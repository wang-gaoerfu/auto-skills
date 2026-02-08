"""
文档模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, BigInteger, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class Document(Base):
    """文档表"""

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)  # 存储的文件名
    original_filename = Column(String(255), nullable=False)  # 原始文件名
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String(50), nullable=False)  # 'docx', 'pdf', 'txt'
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    status = Column(String(20), default="processing", index=True)  # 'processing', 'completed', 'failed'
    error_message = Column(Text)
    chunk_count = Column(Integer, default=0)  # 分片数量
    vector_ids = Column(JSONB)  # 存储Qdrant中的向量ID列表
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 关系
    category = relationship("Category", back_populates="documents", foreign_keys=[category_id])
    uploaded_by_user = relationship("User", back_populates="documents", foreign_keys=[uploaded_by])

    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.original_filename}, status={self.status})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": str(self.id),
            "filename": self.original_filename,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "category_id": str(self.category_id) if self.category_id else None,
            "category_name": self.category.name if self.category else None,
            "uploaded_by": str(self.uploaded_by) if self.uploaded_by else None,
            "status": self.status,
            "error_message": self.error_message,
            "chunk_count": self.chunk_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @property
    def file_size_mb(self) -> float:
        """文件大小（MB）"""
        return self.file_size / (1024 * 1024)
