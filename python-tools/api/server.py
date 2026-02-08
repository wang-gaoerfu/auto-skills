"""
Python Tools API 服务器
提供 REST API 接口调用各种工具

启动方式:
    python api/server.py
    或
    uvicorn api.server:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
import os

# 添加工具目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))

from ocr_tool import OCRTool

try:
    from doubao_ocr import DoubaoOCR
    DOUBAO_AVAILABLE = True
except ImportError:
    DOUBAO_AVAILABLE = False

# 创建 FastAPI 应用
app = FastAPI(
    title="Python Tools API",
    description="统一 API 接口调用各种 Python 工具",
    version="1.0.0"
)


# ========== 请求/响应模型 ==========

class OCRRequest(BaseModel):
    """OCR 请求模型"""
    input_path: str
    output_path: Optional[str] = None
    engine: str = "auto"
    api_key: Optional[str] = None  # 豆包 API Key
    pages: Optional[str] = None  # 页面范围，格式: "1-10"


class ToolResponse(BaseModel):
    """工具响应模型"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ========== API 路由 ==========

@app.get("/")
async def root():
    """根路径 - API 信息"""
    return {
        "name": "Python Tools API",
        "version": "1.0.0",
        "endpoints": {
            "/ocr": "POST - OCR 文字识别",
            "/tools": "GET - 获取可用工具列表",
            "/health": "GET - 健康检查"
        }
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}


@app.get("/tools")
async def list_tools():
    """获取可用工具列表"""
    return {
        "tools": [
            {
                "name": "ocr",
                "description": "OCR 文字识别工具",
                "endpoint": "/ocr",
                "methods": ["POST"]
            }
        ]
    }


@app.post("/ocr", response_model=ToolResponse)
async def ocr_convert(request: OCRRequest):
    """
    OCR 文字识别接口

    支持的引擎:
    - auto: 自动选择
    - doubao: 豆包视觉理解 API
    - tesseract: Tesseract OCR
    - paddleocr: PaddleOCR

    Args:
        request: OCR 请求

    Returns:
        转换结果
    """
    try:
        # 使用豆包 OCR
        if request.engine == "doubao":
            tool = DoubaoOCR(api_key=request.api_key)

            if request.input_path.endswith(".pdf"):
                # 解析页面范围
                page_range = None
                if request.pages:
                    try:
                        start, end = map(int, request.pages.split("-"))
                        page_range = (start, end)
                    except:
                        pass

                result = tool.recognize_pdf(
                    request.input_path,
                    request.output_path,
                    page_range
                )
            else:
                result = tool.recognize_image(request.input_path)
        else:
            # 使用默认 OCR 工具
            tool = OCRTool(engine=request.engine)
            result = tool.convert(request.input_path, request.output_path)

        return ToolResponse(
            success=result["success"],
            data=result if result["success"] else None,
            error=result["error"]
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== 错误处理 ==========

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc)
        }
    )


# ========== 主程序 ==========

if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("Python Tools API 服务器")
    print("=" * 50)
    print("启动服务: http://localhost:8000")
    print("API 文档: http://localhost:8000/docs")
    print("=" * 50)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
