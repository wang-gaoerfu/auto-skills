"""
聊天相关的 Pydantic 模型
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class ChatMessageBase(BaseModel):
    """聊天消息基础模型"""
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """聊天请求模型"""
    message: str = Field(..., min_length=1)
    session_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None


class ChatResponse(BaseModel):
    """聊天响应模型（流式）"""
    session_id: uuid.UUID
    message_id: uuid.UUID
    content: str
    role: str = "assistant"
    created_at: datetime


class ChatMessageResponse(BaseModel):
    """聊天消息响应模型"""
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionBase(BaseModel):
    """聊天会话基础模型"""
    title: str = Field(..., min_length=1, max_length=255)
    category_id: Optional[uuid.UUID] = None


class ChatSessionCreate(ChatSessionBase):
    """创建会话模型"""
    pass


class ChatSessionResponse(BaseModel):
    """聊天会话响应模型"""
    id: uuid.UUID
    title: str
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class ChatSessionListResponse(BaseModel):
    """会话列表响应模型"""
    sessions: List[ChatSessionResponse]
    total: int


class ChatHistoryResponse(BaseModel):
    """聊天历史响应模型"""
    session_id: uuid.UUID
    title: str
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    messages: List[ChatMessageResponse]
