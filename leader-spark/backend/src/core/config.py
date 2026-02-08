"""
应用配置管理
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """应用设置"""

    # 应用配置
    APP_NAME: str = "Leader-Spark"
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_URL: str = "http://localhost:8000"
    SECRET_KEY: str = "your-secret-key-change-this"

    # 数据库配置
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "leader_spark"
    DB_USER: str = "leader_spark"
    DB_PASSWORD: str = "password"

    # Qdrant 配置
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_GRPC_PORT: int = 6334
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "leader_spark_kb"

    # DeepSeek API 配置
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_EMBEDDING_MODEL: str = "deepseek-embedding"

    # 模型参数
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 2000
    DEFAULT_TOP_P: float = 0.9

    # Token 定价
    DEEPSEEK_CHAT_INPUT_PRICE: float = 0.001
    DEEPSEEK_CHAT_OUTPUT_PRICE: float = 0.002
    DEEPSEEK_EMBEDDING_PRICE: float = 0.0001

    # JWT 配置
    JWT_SECRET_KEY: str = "jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24小时

    # 邮件配置
    MAIL_SERVER: str = "smtp.163.com"
    MAIL_PORT: int = 465
    MAIL_USE_SSL: bool = True
    MAIL_USE_TLS: bool = False
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM_NAME: str = "Leader-Spark"
    MAIL_DEFAULT_SENDER: str = ""

    # 验证码配置
    VERIFICATION_CODE_LENGTH: int = 6
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10
    VERIFICATION_CODE_RESEND_INTERVAL: int = 60

    # 文件上传配置
    ALLOWED_FILE_EXTENSIONS: List[str] = ["docx", "pdf", "txt", "md"]
    MAX_FILE_SIZE: int = 52428800  # 50MB
    UPLOAD_DIR: str = "./uploads"
    CHUNK_DIR: str = "./uploads/chunks"

    # 安全配置
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    PASSWORD_MIN_LENGTH: int = 8

    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # 向量检索配置
    EMBEDDING_DIMENSION: int = 1536
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    DEFAULT_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.7

    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
