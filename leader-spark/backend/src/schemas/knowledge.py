"""
知识库相关的 Pydantic 模型
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


# 分类相关
class CategoryBase(BaseModel):
    """分类基础模型"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: str = Field(..., min_length=1)
    is_visible_to_users: bool = False
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    """分类创建模型"""
    pass


class CategoryUpdate(BaseModel):
    """分类更新模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    is_visible_to_users: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    """分类响应模型"""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    system_prompt: str
    is_visible_to_users: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """分类列表响应模型"""
    categories: List[CategoryResponse]
    total: int


# 文档相关
class DocumentBase(BaseModel):
    """文档基础模型"""
    category_id: uuid.UUID


class DocumentResponse(BaseModel):
    """文档响应模型"""
    id: uuid.UUID
    filename: str
    file_size: int
    file_type: str
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    uploaded_by: Optional[uuid.UUID] = None
    status: str
    error_message: Optional[str] = None
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """文档列表响应模型"""
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentUploadResponse(BaseModel):
    """文档上传响应模型"""
    document_id: uuid.UUID
    filename: str
    status: str
    message: str


class BatchUploadResponse(BaseModel):
    """批量上传响应模型"""
    success_count: int
    failed_count: int
    results: List[DocumentUploadResponse]


# 文档处理相关
class ProcessDocumentRequest(BaseModel):
    """处理文档请求模型"""
    document_id: uuid.UUID
    reprocess: bool = False  # 是否重新处理


# AI 分类相关
class AIClassifyRequest(BaseModel):
    """AI 分类请求模型"""
    document_id: uuid.UUID


class AIClassifyResponse(BaseModel):
    """AI 分类响应模型"""
    category_id: uuid.UUID
    category_name: str
    confidence: float
    reason: str


# 统计相关
class CategoryStatsResponse(BaseModel):
    """分类统计响应模型"""
    id: uuid.UUID
    name: str
    is_visible_to_users: bool
    document_count: int
    total_size: int
    session_count: int


class KnowledgeStatsResponse(BaseModel):
    """知识库统计响应模型"""
    total_categories: int
    total_documents: int
    total_size: int
    visible_categories: int
    processing_documents: int
    failed_documents: int
