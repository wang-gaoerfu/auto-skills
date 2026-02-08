"""
文档管理 API 路由
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_

from src.core.database import get_db
from src.core.config import settings
from src.auth.dependencies import get_current_user, get_current_admin
from src.models.user import User
from src.models.document import Document
from src.models.audit_log import AuditLog
from src.services.document_service import document_service
from src.services.llm_service import deepseek_service
from src.services.qdrant_service import qdrant_service
from src.schemas.knowledge import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
    BatchUploadResponse,
    AIClassifyRequest,
    AIClassifyResponse,
)

router = APIRouter(prefix="/documents", tags=["文档管理"])


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    category_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取文档列表

    管理员可以看到所有文档，普通用户只能看到自己上传的文档
    """
    query = select(Document)

    # 权限过滤
    if not current_user.is_admin():
        query = query.where(Document.uploaded_by == current_user.id)

    # 分类过滤
    if category_id:
        query = query.where(Document.category_id == category_id)

    # 状态过滤
    if status_filter:
        query = query.where(Document.status == status_filter)

    # 排序
    query = query.order_by(Document.created_at.desc())

    # 分页
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取单个文档详情
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )

    # 权限检查
    if not current_user.is_admin() and document.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此文档"
        )

    return DocumentResponse.model_validate(document)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    category_id: uuid.UUID = Form(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    上传单个文档

    支持的格式: docx, pdf, txt, md
    最大文件大小: 50MB
    """
    # 验证文件
    file_content = await file.read()
    file_size = len(file_content)
    is_valid, error_msg = document_service.validate_file(file.filename, file_size)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # 验证分类存在
    from src.models.category import Category
    category_result = await db.execute(select(Category).where(Category.id == category_id))
    category = category_result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类不存在"
        )

    try:
        # 保存文件
        await file.seek(0)  # 重置文件指针
        filename, file_path, saved_size = await document_service.save_file(file, current_user.id)

        # 创建文档记录
        file_type = document_service.get_file_type(file.filename)
        document = await document_service.create_document_record(
            db, filename, file.filename, file_path, saved_size, file_type, category_id, current_user.id
        )

        # 记录审计日志
        audit_log = AuditLog.create_log(
            user_id=current_user.id,
            action="upload_document",
            resource_type="document",
            resource_id=document.id,
            details={
                "filename": file.filename,
                "category_id": str(category_id),
                "file_size": saved_size
            },
            ip=request.client.host if request else None
        )
        db.add(audit_log)

        await db.commit()

        # 异步处理文档（向量化）
        # TODO: 使用后台任务处理
        # await process_document_async(document.id)

        return DocumentUploadResponse(
            document_id=document.id,
            filename=file.filename,
            status="processing",
            message="文档上传成功，正在处理中"
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档上传失败: {str(e)}"
        )


@router.post("/upload/batch", response_model=BatchUploadResponse)
async def upload_documents_batch(
    files: List[UploadFile] = File(...),
    category_id: uuid.UUID = Form(...),
    request: Request = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    批量上传文档（仅管理员）

    支持一次上传多个文件
    """
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="一次最多上传 20 个文件"
        )

    # 验证分类存在
    from src.models.category import Category
    category_result = await db.execute(select(Category).where(Category.id == category_id))
    category = category_result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类不存在"
        )

    success_count = 0
    failed_count = 0
    results = []

    for file in files:
        try:
            # 验证文件
            file_content = await file.read()
            file_size = len(file_content)
            is_valid, error_msg = document_service.validate_file(file.filename, file_size)

            if not is_valid:
                results.append(DocumentUploadResponse(
                    document_id=uuid.uuid4(),
                    filename=file.filename,
                    status="failed",
                    message=error_msg
                ))
                failed_count += 1
                continue

            # 保存文件
            await file.seek(0)
            filename, file_path, saved_size = await document_service.save_file(file, current_admin.id)

            # 创建文档记录
            file_type = document_service.get_file_type(file.filename)
            document = await document_service.create_document_record(
                db, filename, file.filename, file_path, saved_size, file_type, category_id, current_admin.id
            )

            results.append(DocumentUploadResponse(
                document_id=document.id,
                filename=file.filename,
                status="processing",
                message="上传成功，正在处理"
            ))
            success_count += 1

            # 记录审计日志
            audit_log = AuditLog.create_log(
                user_id=current_admin.id,
                action="upload_document",
                resource_type="document",
                resource_id=document.id,
                details={
                    "filename": file.filename,
                    "category_id": str(category_id),
                    "file_size": saved_size,
                    "batch": True
                },
                ip=request.client.host if request else None
            )
            db.add(audit_log)

        except Exception as e:
            results.append(DocumentUploadResponse(
                document_id=uuid.uuid4(),
                filename=file.filename,
                status="failed",
                message=f"上传失败: {str(e)}"
            ))
            failed_count += 1

    await db.commit()

    return BatchUploadResponse(
        success_count=success_count,
        failed_count=failed_count,
        results=results
    )


@router.post("/{document_id}/process")
async def process_document(
    document_id: uuid.UUID,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    处理文档（提取文本、向量化）

    管理员可以手动触发文档处理
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )

    try:
        # 提取文本
        text = await document_service.extract_text(document.file_path, document.file_type)
        text = document_service.clean_text(text)

        if not text or len(text.strip()) < 50:
            document.status = "failed"
            document.error_message = "文档内容为空或过少"
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文档内容为空或过少"
            )

        # 分块
        chunks = document_service.chunk_text(text)
        document.chunk_count = len(chunks)

        # 获取嵌入向量
        embeddings = await deepseek_service.get_embeddings_batch(chunks)

        # 准备元数据
        vector_ids = []
        payloads = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            payload = {
                "document_id": str(document.id),
                "category_id": str(document.category_id),
                "chunk_index": i,
                "content": chunk,
                "filename": document.original_filename
            }
            payloads.append(payload)

        # 插入向量数据库
        vector_ids = await qdrant_service.insert_points(embeddings, payloads)

        # 更新文档状态
        document.status = "completed"
        document.vector_ids = vector_ids

        # 记录审计日志
        audit_log = AuditLog.create_log(
            user_id=current_admin.id,
            action="process_document",
            resource_type="document",
            resource_id=document.id,
            details={
                "filename": document.original_filename,
                "chunk_count": len(chunks)
            },
            ip=request.client.host if request else None
        )
        db.add(audit_log)

        await db.commit()

        return {
            "message": "文档处理完成",
            "document_id": str(document.id),
            "chunk_count": len(chunks),
            "status": "completed"
        }

    except Exception as e:
        document.status = "failed"
        document.error_message = str(e)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档处理失败: {str(e)}"
        )


@router.post("/{document_id}/classify", response_model=AIClassifyResponse)
async def classify_document(
    document_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    使用 AI 自动分类文档（管理员）
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )

    # 获取所有可见分类
    from src.models.category import Category
    category_result = await db.execute(
        select(Category).order_by(Category.sort_order, Category.name)
    )
    categories = category_result.scalars().all()

    if not categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有可用的分类"
        )

    # 提取文档内容预览
    try:
        text = await document_service.extract_text(document.file_path, document.file_type)
        content_preview = text[:1000]  # 只取前1000字符
    except:
        content_preview = ""

    # 准备分类信息
    category_list = [
        {
            "id": str(cat.id),
            "name": cat.name,
            "description": cat.description or ""
        }
        for cat in categories
    ]

    # 使用 AI 分类
    classification_result = await deepseek_service.classify_document(
        document.original_filename,
        content_preview,
        category_list
    )

    # 更新文档分类
    try:
        classified_category_id = uuid.UUID(classification_result["category_id"])
        document.category_id = classified_category_id
        await db.commit()

        # 获取分类名称
        category_obj = next((c for c in categories if c.id == classified_category_id), None)
        category_name = category_obj.name if category_obj else "未知"

        return AIClassifyResponse(
            category_id=classified_category_id,
            category_name=category_name,
            confidence=classification_result.get("confidence", 0.0),
            reason=classification_result.get("reason", "")
        )

    except (ValueError, KeyError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"分类失败: {str(e)}"
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除文档

    管理员可以删除任何文档，普通用户只能删除自己上传的文档
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )

    # 权限检查
    if not current_user.is_admin() and document.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此文档"
        )

    try:
        # 删除向量数据库中的记录
        if document.vector_ids:
            await qdrant_service.delete_points(document.vector_ids)

        # 删除文件
        await document_service.delete_file(document.file_path)

        # 记录审计日志
        audit_log = AuditLog.create_log(
            user_id=current_user.id,
            action="delete_document",
            resource_type="document",
            resource_id=document.id,
            details={
                "filename": document.original_filename,
                "category_id": str(document.category_id) if document.category_id else None
            },
            ip=request.client.host if request else None
        )
        db.add(audit_log)

        # 删除数据库记录
        await db.delete(document)
        await db.commit()

        return {"message": "文档删除成功"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档删除失败: {str(e)}"
        )
