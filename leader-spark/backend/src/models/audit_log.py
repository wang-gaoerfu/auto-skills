"""
操作审计日志模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class AuditLog(Base):
    """操作审计日志表"""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)  # 'login', 'logout', 'upload_document', etc.
    resource_type = Column(String(50), index=True)  # 'user', 'document', 'category', 'session'
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(JSONB)  # 存储详细信息的JSON
    ip_address = Column(String(45))
    user_agent = Column(Text)
    status = Column(String(20), default="success")  # 'success' or 'failure'
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # 关系
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": str(self.resource_id) if self.resource_id else None,
            "details": self.details,
            "ip_address": self.ip_address,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def create_log(cls, user_id, action, resource_type=None, resource_id=None, details=None, ip=None, user_agent=None, status="success", error_message=None):
        """创建审计日志"""
        return cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip,
            user_agent=user_agent,
            status=status,
            error_message=error_message
        )
