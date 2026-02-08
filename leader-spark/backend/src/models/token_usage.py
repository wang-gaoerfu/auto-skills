"""
Token 使用统计模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class TokenUsage(Base):
    """Token 使用统计表"""

    __tablename__ = "token_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    estimated_cost = Column(Numeric(10, 6), default=0)  # 预估费用（USD）
    model = Column(String(50), nullable=False)  # 'deepseek-chat', 'deepseek-coder'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # 关系
    user = relationship("User", back_populates="token_usage")
    session = relationship("ChatSession", back_populates="token_usage_records")

    def __repr__(self):
        return f"<TokenUsage(id={self.id}, user_id={self.user_id}, total_tokens={self.total_tokens})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_id": str(self.session_id) if self.session_id else None,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "estimated_cost": float(self.estimated_cost) if self.estimated_cost else 0,
            "model": self.model,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
