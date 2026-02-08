"""
认证 API 路由
"""
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import EmailStr

from src.core.database import get_db
from src.core.config import settings
from src.auth.jwt import create_access_token, verify_password, get_password_hash
from src.auth.password import validate_password_strength
from src.auth.dependencies import get_current_user, get_current_admin
from src.models.user import User
from src.models.verification_code import VerificationCode
from src.models.audit_log import AuditLog
from src.services.email import email_service
from src.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    PasswordResetRequest,
    PasswordChangeRequest,
    VerificationCodeRequest,
    VerificationCodeResponse,
    UpdateProfileRequest,
    UserStatsResponse,
)

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/send-code", response_model=VerificationCodeResponse)
async def send_verification_code(
    request: VerificationCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    发送验证码

    发送注册或重置密码的验证码到用户邮箱
    """
    # 检查是否有最近的验证码（防刷）
    recent_time = datetime.utcnow() - timedelta(seconds=settings.VERIFICATION_CODE_RESEND_INTERVAL)
    result = await db.execute(
        select(VerificationCode).where(
            and_(
                VerificationCode.email == request.email,
                VerificationCode.type == request.type,
                VerificationCode.created_at >= recent_time
            )
        ).order_by(VerificationCode.created_at.desc())
    )
    recent_code = result.first()

    if recent_code:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"验证码发送过于频繁，请 {settings.VERIFICATION_CODE_RESEND_INTERVAL} 秒后再试"
        )

    # 如果是注册，检查邮箱是否已存在
    if request.type == "register":
        existing_user = await db.execute(select(User).where(User.email == request.email))
        if existing_user.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册"
            )

    # 生成验证码
    import random
    code = ''.join([str(random.randint(0, 9)) for _ in range(settings.VERIFICATION_CODE_LENGTH)])

    # 保存验证码到数据库
    expires_at = datetime.utcnow() + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)
    verification_code = VerificationCode(
        email=request.email,
        code=code,
        type=request.type,
        expires_at=expires_at
    )
    db.add(verification_code)
    await db.commit()

    # 发送邮件
    await email_service.send_verification_code(request.email, code, request.type)

    return VerificationCodeResponse(
        message="验证码已发送到您的邮箱",
        expires_in=settings.VERIFICATION_CODE_EXPIRE_MINUTES * 60
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    用户注册

    使用邮箱和验证码注册新用户
    """
    # 验证验证码
    result = await db.execute(
        select(VerificationCode).where(
            and_(
                VerificationCode.email == user_data.email,
                VerificationCode.code == user_data.verification_code,
                VerificationCode.type == "register",
                VerificationCode.used == False
            )
        ).order_by(VerificationCode.created_at.desc())
    )
    verification_code = result.first()

    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    if not verification_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码已过期"
        )

    # 验证密码强度
    is_valid, errors = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )

    # 创建用户
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="user",
        status="active",
        nickname=user_data.nickname
    )
    db.add(new_user)
    await db.flush()  # 获取 user ID

    # 标记验证码已使用
    verification_code.used = True

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=new_user.id,
        action="register",
        resource_type="user",
        resource_id=new_user.id,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(new_user)

    # 生成令牌
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录
    """
    # 查找用户
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    # 验证用户和密码
    if not user or not verify_password(credentials.password, user.password_hash):
        # 如果用户存在，增加失败计数
        if user:
            user.login_failed_count += 1
            # 检查是否需要锁定
            if user.login_failed_count >= settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"账户已被锁定 {settings.LOGIN_LOCKOUT_MINUTES} 分钟"
                )
            await db.commit()

        # 记录失败的登录尝试
        audit_log = AuditLog.create_log(
            user_id=user.id if user else None,
            action="login",
            status="failure",
            error_message="密码错误或用户不存在",
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )

    # 检查账户状态
    if not user.is_active():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用"
        )

    # 检查账户锁定
    if user.is_locked():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="账户已被锁定，请稍后再试"
        )

    # 重置失败计数
    user.login_failed_count = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()

    # 记录成功的登录
    audit_log = AuditLog.create_log(
        user_id=user.id,
        action="login",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(user)

    # 生成令牌
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/reset-password")
async def reset_password(
    request_data: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    重置密码
    """
    # 验证验证码
    result = await db.execute(
        select(VerificationCode).where(
            and_(
                VerificationCode.email == request_data.email,
                VerificationCode.code == request_data.verification_code,
                VerificationCode.type == "reset_password",
                VerificationCode.used == False
            )
        ).order_by(VerificationCode.created_at.desc())
    )
    verification_code = result.first()

    if not verification_code or not verification_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期"
        )

    # 查找用户
    result = await db.execute(
        select(User).where(User.email == request_data.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 验证新密码强度
    is_valid, errors = validate_password_strength(request_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )

    # 更新密码
    user.password_hash = get_password_hash(request_data.new_password)
    user.login_failed_count = 0
    user.locked_until = None

    # 标记验证码已使用
    verification_code.used = True

    # 记录审计日志
    audit_log = AuditLog.create_log(
        user_id=user.id,
        action="reset_password",
        resource_type="user",
        resource_id=user.id,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)

    await db.commit()

    return {"message": "密码重置成功"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户信息
    """
    return UserResponse.model_validate(current_user)


@router.put("/me")
async def update_current_user(
    update_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新当前用户信息
    """
    if update_data.nickname is not None:
        current_user.nickname = update_data.nickname
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    修改密码
    """
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )

    # 验证新密码强度
    is_valid, errors = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )

    # 更新密码
    current_user.password_hash = get_password_hash(password_data.new_password)

    await db.commit()

    return {"message": "密码修改成功"}


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取当前用户统计信息
    """
    from sqlalchemy import func, select
    from src.models.token_usage import TokenUsage
    from src.models.chat import ChatSession, ChatMessage

    # Token 统计
    token_result = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(TokenUsage.estimated_cost), 0).label("total_cost")
        ).where(TokenUsage.user_id == current_user.id)
    )
    token_stats = token_result.first()

    # 会话统计
    session_result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == current_user.id)
    )
    session_count = session_result.scalar() or 0

    # 消息统计
    # 通过会话关联计算消息数
    message_result = await db.execute(
        select(func.count(ChatMessage.id))
        .join(ChatSession, ChatSession.id == ChatMessage.session_id)
        .where(ChatSession.user_id == current_user.id)
    )
    message_count = message_result.scalar() or 0

    return UserStatsResponse(
        total_tokens=int(token_stats.total_tokens) if token_stats.total_tokens else 0,
        total_cost=float(token_stats.total_cost) if token_stats.total_cost else 0.0,
        session_count=session_count,
        message_count=message_count
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    用户登出（可选，客户端删除 token 即可）
    """
    # 如果需要实现 token 黑名单，可以在这里处理
    # 当前实现只需要客户端删除 token
    return {"message": "登出成功"}
