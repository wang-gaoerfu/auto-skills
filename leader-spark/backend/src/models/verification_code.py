"""
验证码模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from src.core.database import Base


class VerificationCode(Base):
    """验证码表"""

    __tablename__ = "verification_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    type = Column(String(20), nullable=False)  # 'register', 'reset_password'
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<VerificationCode(id={self.id}, email={self.email}, type={self.type})>"

    def is_expired(self) -> bool:
        """验证码是否过期"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """验证码是否有效"""
        return not self.used and not self.is_expired()
