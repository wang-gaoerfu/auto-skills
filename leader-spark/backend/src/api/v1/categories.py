"""
分类管理 API 路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
import uuid

from src.core.database import get_db
from src.auth.dependencies import get_current_user, get_current_admin
from src.models.user import User
from src.models.category import Category
from src.models.document import Document
from src.models.chat import ChatSession
from src.models.audit_log import AuditLog
from src.schemas.knowledge import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListResponse,
    CategoryStatsResponse,
    KnowledgeStatsResponse,
)

router = APIRouter(prefix="/categories", tags=["分类管理"])


@router.get("", response_model=CategoryListResponse)
async def list_categories(
    visible_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    获取分类列表

    Args:
        visible_only: 是否只返回对用户可见的分类
    """
    query = select(Category).order_by(Category.sort_order, Category.name)

    if visible_only:
        query = query.where(Category.is_visible_to_users == True)

    result = await db.execute(query)
    categories = result.scalars().all()

    # 获取总数
    count_result = await db.execute(
        select(func.count(Category.id))
    )
    if visible_only:
        count_result = await db.execute(
            select(func.count(Category.id)).where(Category.is_visible_to_users == True)
        )
    total = count_result.scalar() or 0

    return CategoryListResponse(
        categories=[CategoryResponse.model_validate(c) for c in categories],
        total=total
    )


@router.get("/stats", response_model=List[CategoryStatsResponse])
async def get_category_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有分类的统计信息（管理员）
    """
    # 使用原生 SQL 查询统计数据
    query = """
    SELECT
        c.id,
        c.name,
        c.is_visible_to_users,
        COUNT(DISTINCT d.id) as document_count,
        COALESCE(SUM(d.file_size), 0) as total_size,
        COUNT(DISTINCT cs.id) as session_count
    FROM categories c
    LEFT JOIN documents d ON c.id = d.category_id AND d.status = 'completed'
    LEFT JOIN chat_sessions cs ON c.id = cs.category_id
    GROUP BY c.id, c.name, c.is_visible_to_users
    ORDER BY c.sort_order, c.name
    """

    result = await db.execute(query)
    rows = result.fetchall()

    stats = []
    for row in rows:
        stats.append(CategoryStatsResponse(
            id=row[0],
            name=row[1],
            is_visible_to_users=row[2],
            document_count=row[3] or 0,
            total_size=row[4] or 0,
            session_count=row[5] or 0
        ))

    return stats


@router.get("/knowledge-stats", response_model=KnowledgeStatsResponse)
async def get_knowledge_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取知识库总览统计（管理员）
    """
    # 分类统计
    category_result = await db.execute(select(func.count(Category.id)))
    total_categories = category_result.scalar() or 0

    visible_result = await db.execute(
        select(func.count(Category.id)).where(Category.is_visible_to_users == True)
    )
    visible_categories = visible_result.scalar() or 0

    # 文档统计
    doc_count_result = await db.execute(select(func.count(Document.id)))
    total_documents = doc_count_result.scalar() or 0

    processing_result = await db.execute(
        select(func.count(Document.id)).where(Document.status == "processing")
    )
    processing_documents = processing_result.scalar() or 0

    failed_result = await db.execute(
        select(func.count(Document.id)).where(Document.status == "failed")
    )
    failed_documents = failed_result.scalar() or 0

    # 文件大小统计
    size_result = await db.execute(
        select(func.sum(Document.file_size)).where(Document.status == "completed")
    )
    total_size = size_result.scalar() or 0

    return KnowledgeStatsResponse(
        total_categories=total_categories,
        total_documents=total_documents,
        total_size=total_size,
        visible_categories=visible_categories,
        processing_documents=processing_documents,
        failed_documents=failed_documents
    )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    获取单个分类详情
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    return CategoryResponse.model_validate(category)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建分类（管理员）
    """
    # 检查名称是否重复
    existing = await db.execute(
        select(Category).where(Category.name == category_data.name)
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类名称已存在"
        )

    new_category = Category(
        name=category_data.name,
        description=category_data.description,
        system_prompt=category_data.system_prompt,
        is_visible_to_users=category_data.is_visible_to_users,
        sort_order=category_data.sort_order,
        created_by=current_admin.id
    )
    db.add(new_category)

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_admin.id,
        action="create_category",
        resource_type="category",
        resource_id=new_category.id,
        details={"name": category_data.name},
        ip=request.client.host if request.client else None
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(new_category)

    return CategoryResponse.model_validate(new_category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    category_data: CategoryUpdate,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新分类（管理员）
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    # 更新字段
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_admin.id,
        action="update_category",
        resource_type="category",
        resource_id=category.id,
        details=update_data,
        ip=request.client.host if request.client else None
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}")
async def delete_category(
    category_id: uuid.UUID,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除分类（管理员）
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    # 检查是否有文档关联
    doc_result = await db.execute(
        select(func.count(Document.id)).where(Document.category_id == category_id)
    )
    doc_count = doc_result.scalar() or 0

    if doc_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该分类下还有 {doc_count} 个文档，无法删除"
        )

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_admin.id,
        action="delete_category",
        resource_type="category",
        resource_id=category.id,
        details={"name": category.name},
        ip=request.client.host if request.client else None
    )
    db.add(audit_log)

    await db.delete(category)
    await db.commit()

    return {"message": "分类删除成功"}


@router.post("/{category_id}/generate-prompt", response_model=dict)
async def generate_system_prompt(
    category_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    使用 AI 生成系统提示词（管理员）
    """
    from src.services.llm_service import deepseek_service

    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )

    # 获取该分类的一个文档作为示例
    doc_result = await db.execute(
        select(Document).where(
            Document.category_id == category_id,
            Document.status == "completed"
        ).limit(1)
    )
    sample_doc = doc_result.scalar_one_or_none()

    sample_content = None
    if sample_doc:
        # 读取文档内容（需要实现文档读取服务）
        # TODO: 实现文档内容读取
        pass

    # 使用 AI 生成提示词
    generated_prompt = await deepseek_service.generate_system_prompt(
        category.name,
        category.description or "",
        sample_content
    )

    # 更新分类的提示词
    category.system_prompt = generated_prompt
    await db.commit()

    return {
        "category_id": str(category_id),
        "system_prompt": generated_prompt
    }
