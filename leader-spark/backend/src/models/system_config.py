"""
系统配置模型
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from src.core.database import Base


class SystemConfig(Base):
    """系统配置表"""

    __tablename__ = "system_configs"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(Text)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SystemConfig(key={self.key}, value={self.value})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "updated_by": str(self.updated_by) if self.updated_by else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def get(cls, db, key: str, default: str = None):
        """获取配置值"""
        config = db.query(cls).filter(cls.key == key).first()
        if config:
            return config.value
        return default

    @classmethod
    def set(cls, db, key: str, value: str, description: str = None, updated_by=None):
        """设置配置值"""
        config = db.query(cls).filter(cls.key == key).first()
        if config:
            config.value = value
            config.description = description
            config.updated_by = updated_by
            config.updated_at = datetime.utcnow()
        else:
            config = cls(key=key, value=value, description=description, updated_by=updated_by)
            db.add(config)
        return config
