"""
聊天 API 路由（支持 RAG）
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from src.core.database import get_db
from src.core.config import settings
from src.auth.dependencies import get_current_user
from src.models.user import User
from src.models.chat import ChatSession, ChatMessage
from src.models.category import Category
from src.models.token_usage import TokenUsage
from src.models.audit_log import AuditLog
from src.services.llm_service import deepseek_service
from src.services.qdrant_service import qdrant_service
from src.schemas.chat import (
    ChatRequest,
    ChatMessageResponse,
    ChatSessionResponse,
    ChatSessionListResponse,
    ChatHistoryResponse,
)

router = APIRouter(prefix="/chat", tags=["聊天"])


class StreamChunk(BaseModel):
    """流式响应块"""
    content: str
    session_id: uuid.UUID
    message_id: uuid.UUID
    done: bool = False


@router.post("/stream")
async def chat_stream(
    request_data: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    流式聊天（RAG 模式）

    支持知识库检索增强
    """
    # 获取或创建会话
    session_id = request_data.session_id
    if session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会话不存在"
            )

        # 更新会话时间
        session.updated_at = datetime.utcnow()
    else:
        # 创建新会话
        session = ChatSession(
            user_id=current_user.id,
            title="新对话",
            category_id=request_data.category_id
        )
        db.add(session)
        await db.flush()

    # 保存用户消息
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=request_data.message
    )
    db.add(user_message)

    # 如果是第一条消息，生成会话标题
    if not request_data.session_id:
        try:
            title = await deepseek_service.generate_chat_title(request_data.message)
            session.title = title
        except:
            session.title = request_data.message[:50]

    await db.commit()

    # 获取分类的系统提示词
    system_prompt = "你是一个专业的 AI 助手，能够根据提供的信息回答用户的问题。"
    category_filter = None

    if session.category_id:
        category_result = await db.execute(
            select(Category).where(Category.id == session.category_id)
        )
        category = category_result.scalar_one_or_none()
        if category:
            system_prompt = category.system_prompt
            category_filter = str(category.id)

    # 知识库检索
    context_docs = []
    try:
        # 获取查询向量
        query_embedding = await deepseek_service.get_embedding(request_data.message)

        # 在向量数据库中搜索
        search_results = await qdrant_service.search(
            query_vector=query_embedding,
            limit=settings.DEFAULT_TOP_K,
            score_threshold=settings.SIMILARITY_THRESHOLD,
            category_id=category_filter
        )

        # 提取相关文档内容
        for result in search_results:
            if result["score"] > settings.SIMILARITY_THRESHOLD:
                context_docs.append({
                    "content": result["payload"].get("content", ""),
                    "score": result["score"],
                    "filename": result["payload"].get("filename", "")
                })
    except Exception as e:
        print(f"知识库检索失败: {e}")

    # 构建对话消息
    messages = [{"role": "system", "content": system_prompt}]

    # 添加上下文（如果有相关文档）
    if context_docs:
        context_text = "\n\n".join([
            f"【{doc['filename']}】\n{doc['content']}"
            for doc in context_docs[:3]  # 最多使用3个相关文档
        ])
        messages.append({
            "role": "system",
            "content": f"以下是与用户问题相关的知识库内容，请参考这些内容回答用户问题：\n\n{context_text}"
        })

    # 获取历史消息（最近N条）
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(settings.MAX_CONTEXT_MESSAGES * 2)
    )
    history_messages = reversed(history_result.scalars().all())

    for msg in history_messages:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })

    # 添加当前用户消息
    messages.append({
        "role": "user",
        "content": request_data.message
    })

    # 创建助手消息记录
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=""
    )
    db.add(assistant_message)
    await db.flush()

    # 初始化 token 计数
    prompt_tokens = deepseek_service.count_tokens(str(messages))
    completion_tokens = 0
    total_cost = 0.0

    async def generate():
        """流式生成响应"""
        nonlocal completion_tokens

        try:
            # 调用 LLM
            response_stream = await deepseek_service.chat(
                messages=messages,
                stream=True
            )

            full_content = ""

            async for chunk in response_stream:
                full_content += chunk
                completion_tokens = deepseek_service.count_tokens(full_content)

                # 返回 SSE 格式
                yield f"data: {StreamChunk(content=chunk, session_id=session.id, message_id=assistant_message.id).model_dump_json()}\n\n"

            # 计算费用
            total_cost = deepseek_service.estimate_cost(
                prompt_tokens,
                completion_tokens
            )

            # 更新消息内容
            assistant_message.content = full_content

            # 保存 token 使用记录
            token_usage = TokenUsage(
                user_id=current_user.id,
                session_id=session.id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                estimated_cost=total_cost,
                model=settings.DEEPSEEK_MODEL
            )
            db.add(token_usage)

            await db.commit()

            # 发送完成标记
            yield f"data: {StreamChunk(content='', session_id=session.id, message_id=assistant_message.id, done=True).model_dump_json()}\n\n"

        except Exception as e:
            print(f"生成响应失败: {e}")
            assistant_message.content = f"抱歉，发生了错误：{str(e)}"
            await db.commit()
            yield f"data: {StreamChunk(content=assistant_message.content, session_id=session.id, message_id=assistant_message.id, done=True).model_dump_json()}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户的聊天会话列表
    """
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(desc(ChatSession.updated_at))
    )
    sessions = result.scalars().all()

    # 获取总数
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == current_user.id)
    )
    total = count_result.scalar() or 0

    return ChatSessionListResponse(
        sessions=[ChatSessionResponse.model_validate(s) for s in sessions],
        total=total
    )


@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
async def get_session_history(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取会话的详细历史
    """
    # 获取会话
    session_result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 获取消息
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()

    return ChatHistoryResponse(
        session_id=session.id,
        title=session.title,
        category_id=session.category_id,
        category_name=session.category.name if session.category else None,
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除聊天会话
    """
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_user.id,
        action="delete_session",
        resource_type="session",
        resource_id=session.id,
        details={"title": session.title},
        ip=request.client.host if request else None
    )
    db.add(audit_log)

    await db.delete(session)
    await db.commit()

    return {"message": "会话删除成功"}


@router.put("/sessions/{session_id}")
async def update_session(
    session_id: uuid.UUID,
    title: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新会话信息（标题、分类）
    """
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    if title is not None:
        session.title = title

    if category_id is not None:
        # 验证分类存在
        category_result = await db.execute(
            select(Category).where(Category.id == category_id)
        )
        category = category_result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="分类不存在"
            )

        session.category_id = category_id

    await db.commit()

    return ChatSessionResponse.model_validate(session)


@router.get("/categories")
async def get_chat_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    获取可用于聊天的分类列表（对用户可见的分类）
    """
    result = await db.execute(
        select(Category)
        .where(Category.is_visible_to_users == True)
        .order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()

    return {
        "categories": [
            {
                "id": str(cat.id),
                "name": cat.name,
                "description": cat.description
            }
            for cat in categories
        ]
    }
