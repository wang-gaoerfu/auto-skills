"""
Leader-Spark FastAPI 应用入口
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.database import init_db
from src.services.qdrant_service import qdrant_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("Starting Leader-Spark backend...")

    # 初始化数据库
    try:
        await init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")

    # 初始化 Qdrant
    try:
        await qdrant_service.initialize_collection()
        print("Qdrant initialized successfully")
    except Exception as e:
        print(f"Qdrant initialization failed: {e}")

    yield

    # 关闭时执行
    print("Shutting down Leader-Spark backend...")


# 创建 FastAPI 应用
app = FastAPI(
    title="Leader-Spark API",
    description="领导力教练平台 API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


# 注册路由
from src.api.v1 import auth, chat, categories, documents, admin

app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


# 根路由
@app.get("/")
async def root():
    return {
        "name": "Leader-Spark API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


# 健康检查
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Leader-Spark Backend"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
