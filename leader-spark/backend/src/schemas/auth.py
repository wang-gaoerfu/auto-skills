"""
认证相关的 Pydantic 模型
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid


class UserBase(BaseModel):
    """用户基础模型"""
    email: EmailStr
    nickname: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模型"""
    password: str = Field(..., min_length=8)
    verification_code: str = Field(..., min_length=6, max_length=6)


class UserLogin(BaseModel):
    """用户登录模型"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """用户响应模型"""
    id: uuid.UUID
    email: str
    role: str
    status: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    """密码重置请求模型"""
    email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class PasswordChangeRequest(BaseModel):
    """密码修改请求模型"""
    old_password: str
    new_password: str = Field(..., min_length=8)


class VerificationCodeRequest(BaseModel):
    """验证码请求模型"""
    email: EmailStr
    type: str = Field(..., pattern="^(register|reset_password)$")


class VerificationCodeResponse(BaseModel):
    """验证码响应模型"""
    message: str
    expires_in: int  # 秒


class UpdateProfileRequest(BaseModel):
    """更新个人资料请求模型"""
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserStatsResponse(BaseModel):
    """用户统计响应模型"""
    total_tokens: int = 0
    total_cost: float = 0.0
    session_count: int = 0
    message_count: int = 0


# Admin 用户管理相关
class UserListResponse(BaseModel):
    """用户列表响应模型"""
    users: list[UserResponse]
    total: int
    page: int
    page_size: int


class UserUpdateRequest(BaseModel):
    """用户更新请求模型（管理员）"""
    status: Optional[str] = None
    role: Optional[str] = None
    nickname: Optional[str] = None


class UserDisableRequest(BaseModel):
    """用户禁用/启用请求模型"""
    reason: Optional[str] = None
