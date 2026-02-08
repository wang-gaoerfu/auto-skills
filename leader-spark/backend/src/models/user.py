"""
用户模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class User(Base):
    """用户表"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")  # 'admin' or 'user'
    status = Column(String(20), nullable=False, default="active", index=True)  # 'active' or 'disabled'
    nickname = Column(String(100))
    avatar_url = Column(String(500))
    last_login_at = Column(TIMESTAMP, nullable=True)
    login_failed_count = Column(Integer, default=0)
    locked_until = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 关系
    documents = relationship("Document", back_populates="uploaded_by_user", foreign_keys="Document.uploaded_by")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    token_usage = relationship("TokenUsage", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    categories = relationship("Category", back_populates="created_by_user")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

    def is_admin(self) -> bool:
        """是否是管理员"""
        return self.role == "admin"

    def is_active(self) -> bool:
        """账户是否激活"""
        return self.status == "active"

    def is_locked(self) -> bool:
        """账户是否被锁定"""
        if self.locked_until is None:
            return False
        return self.locked_until > datetime.utcnow()
