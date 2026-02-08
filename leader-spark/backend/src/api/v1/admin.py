"""
管理员 API 路由
"""
import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, and_

from src.core.database import get_db
from src.core.config import settings
from src.auth.dependencies import get_current_admin
from src.models.user import User
from src.models.category import Category
from src.models.document import Document
from src.models.chat import ChatSession, ChatMessage
from src.models.token_usage import TokenUsage
from src.models.audit_log import AuditLog
from src.models.system_config import SystemConfig
from src.schemas.auth import (
    UserResponse,
    UserListResponse,
    UserUpdateRequest,
    UserDisableRequest,
    UserStatsResponse,
)

router = APIRouter(prefix="/admin", tags=["管理员"])


# ==================== 仪表盘统计 ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取仪表盘统计数据
    """
    # 用户统计
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.status == "active")
    )
    active_users = active_users_result.scalar() or 0

    # 分类统计
    categories_result = await db.execute(select(func.count(Category.id)))
    total_categories = categories_result.scalar() or 0

    visible_categories_result = await db.execute(
        select(func.count(Category.id)).where(Category.is_visible_to_users == True)
    )
    visible_categories = visible_categories_result.scalar() or 0

    # 文档统计
    docs_result = await db.execute(select(func.count(Document.id)))
    total_documents = docs_result.scalar() or 0

    processing_docs_result = await db.execute(
        select(func.count(Document.id)).where(Document.status == "processing")
    )
    processing_documents = processing_docs_result.scalar() or 0

    # 会话统计
    sessions_result = await db.execute(
        select(func.count(ChatSession.id))
    )
    total_sessions = sessions_result.scalar() or 0

    # 今日会话统计
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions_result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.created_at >= today_start)
    )
    today_sessions = today_sessions_result.scalar() or 0

    # Token 使用统计
    token_result = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(TokenUsage.estimated_cost), 0).label("total_cost")
        )
    )
    token_stats = token_result.first()

    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "categories": {
            "total": total_categories,
            "visible": visible_categories
        },
        "documents": {
            "total": total_documents,
            "processing": processing_documents
        },
        "sessions": {
            "total": total_sessions,
            "today": today_sessions
        },
        "tokens": {
            "total": int(token_stats.total_tokens) if token_stats.total_tokens else 0,
            "cost": float(token_stats.total_cost) if token_stats.total_cost else 0.0
        }
    }


@router.get("/dashboard/activity")
async def get_activity_data(
    days: int = Query(7, ge=1, le=30),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取活动趋势数据
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # 每日新增用户
    daily_users = []
    # 每日新增会话
    daily_sessions = []
    # 每日 Token 使用
    daily_tokens = []

    for i in range(days):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        # 新增用户
        users_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    User.created_at >= day_start,
                    User.created_at < day_end
                )
            )
        )
        daily_users.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": users_result.scalar() or 0
        })

        # 新增会话
        sessions_result = await db.execute(
            select(func.count(ChatSession.id)).where(
                and_(
                    ChatSession.created_at >= day_start,
                    ChatSession.created_at < day_end
                )
            )
        )
        daily_sessions.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": sessions_result.scalar() or 0
        })

        # Token 使用
        token_result = await db.execute(
            select(
                func.coalesce(func.sum(TokenUsage.total_tokens), 0)
            ).where(
                and_(
                    TokenUsage.created_at >= day_start,
                    TokenUsage.created_at < day_end
                )
            )
        )
        daily_tokens.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": int(token_result.scalar() or 0)
        })

    return {
        "daily_users": daily_users,
        "daily_sessions": daily_sessions,
        "daily_tokens": daily_tokens
    }


# ==================== 用户管理 ====================

@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    role_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户列表（管理员）
    """
    query = select(User)

    # 过滤条件
    if status_filter:
        query = query.where(User.status == status_filter)

    if role_filter:
        query = query.where(User.role == role_filter)

    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.nickname.ilike(f"%{search}%")
            )
        )

    # 总数
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # 分页
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(desc(User.created_at))

    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户详情（管理员）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    update_data: UserUpdateRequest,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新用户信息（管理员）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 更新字段
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(user, field, value)

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_admin.id,
        action="update_user",
        resource_type="user",
        resource_id=user.id,
        details=update_dict,
        ip=request.client.host if request else None
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/disable")
async def disable_user(
    user_id: uuid.UUID,
    request_data: UserDisableRequest,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    禁用/启用用户（管理员）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 不能禁用自己
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能禁用自己"
        )

    # 切换状态
    new_status = "disabled" if user.status == "active" else "active"
    user.status = new_status

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=current_admin.id,
        action=f"{'disable' if new_status == 'disabled' else 'enable'}_user",
        resource_type="user",
        resource_id=user.id,
        details={
            "previous_status": user.status,
            "new_status": new_status,
            "reason": request_data.reason
        },
        ip=request.client.host if request else None
    )
    db.add(audit_log)

    await db.commit()

    return {
        "message": f"用户已{'禁用' if new_status == 'disabled' else '启用'}",
        "user_id": str(user_id),
        "new_status": new_status
    }


@router.get("/users/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats_admin(
    user_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户统计信息（管理员）
    """
    # 验证用户存在
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # Token 统计
    token_result = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsage.total_tokens), 0),
            func.coalesce(func.sum(TokenUsage.estimated_cost), 0)
        ).where(TokenUsage.user_id == user_id)
    )
    token_stats = token_result.first()

    # 会话统计
    session_result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == user_id)
    )
    session_count = session_result.scalar() or 0

    # 消息统计
    message_result = await db.execute(
        select(func.count(ChatMessage.id))
        .join(ChatSession, ChatSession.id == ChatMessage.session_id)
        .where(ChatSession.user_id == user_id)
    )
    message_count = message_result.scalar() or 0

    return UserStatsResponse(
        total_tokens=int(token_stats[0]) if token_stats[0] else 0,
        total_cost=float(token_stats[1]) if token_stats[1] else 0.0,
        session_count=session_count,
        message_count=message_count
    )


# ==================== 审计日志 ====================

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action_filter: Optional[str] = None,
    resource_type_filter: Optional[str] = None,
    user_id_filter: Optional[uuid.UUID] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取审计日志（管理员）
    """
    query = select(AuditLog)

    # 过滤条件
    if action_filter:
        query = query.where(AuditLog.action == action_filter)

    if resource_type_filter:
        query = query.where(AuditLog.resource_type == resource_type_filter)

    if user_id_filter:
        query = query.where(AuditLog.user_id == user_id_filter)

    # 总数
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # 分页
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(desc(AuditLog.created_at))

    result = await db.execute(query)
    logs = result.scalars().all()

    return {
        "logs": [log.to_dict() for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size
    }


# ==================== 系统配置 ====================

@router.get("/settings")
async def get_system_settings(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取系统配置（管理员）
    """
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()

    return {
        "settings": {config.key: config.to_dict() for config in configs}
    }


@router.put("/settings/{key}")
async def update_system_setting(
    key: str,
    value: str,
    description: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新系统配置（管理员）
    """
    config = SystemConfig.set(
        db, key, value, description, updated_by=current_admin.id
    )

    await db.commit()
    await db.refresh(config)

    return {
        "message": "配置更新成功",
        "setting": config.to_dict()
    }
