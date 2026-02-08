"""
分类模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class Category(Base):
    """分类表"""

    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    system_prompt = Column(Text, nullable=False)
    is_visible_to_users = Column(Boolean, default=False, index=True)  # 是否对用户可见
    sort_order = Column(Integer, default=0, index=True)  # 排序
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 关系
    created_by_user = relationship("User", back_populates="categories")
    documents = relationship("Document", back_populates="category", foreign_keys="Document.category_id")
    chat_sessions = relationship("ChatSession", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "is_visible_to_users": self.is_visible_to_users,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
