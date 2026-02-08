# Python Tools

统一的 Python 工具集合，支持直接执行和 API 调用。

## 📁 目录结构

```
python-tools/
├── .venv/              # Python 虚拟环境
├── tools/              # 工具目录
│   ├── __init__.py
│   └── ocr_tool.py     # OCR 工具
├── api/                # API 服务
│   ├── __init__.py
│   └── server.py       # FastAPI 服务器
├── scripts/            # 可执行脚本
├── requirements.txt    # 依赖列表
└── README.md          # 说明文档
```

## 🚀 快速开始

### 1. 激活虚拟环境

**Windows:**
```bash
cd python-tools
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd python-tools
source .venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 使用工具

#### 方式一：直接执行

```bash
# OCR 工具
python tools/ocr_tool.py --input file.pdf --output output.md

# 查看帮助
python tools/ocr_tool.py --help
```

#### 方式二：API 调用

**启动 API 服务器:**
```bash
python api/server.py
```

**API 访问:**
- 服务地址: http://localhost:8000
- API 文档: http://localhost:8000/docs
- OCR 接口: `POST /ocr`

**调用示例:**
```bash
# 豆包 OCR - 识别图片
curl -X POST "http://localhost:8000/ocr" \
  -H "Content-Type: application/json" \
  -d '{
    "input_path": "photo.png",
    "engine": "doubao",
    "api_key": "your_api_key"
  }'

# 豆包 OCR - 识别 PDF
curl -X POST "http://localhost:8000/ocr" \
  -H "Content-Type: application/json" \
  -d '{
    "input_path": "document.pdf",
    "output_path": "output.md",
    "engine": "doubao",
    "api_key": "your_api_key",
    "pages": "1-10"
  }'
```

#### 方式三：Python 导入

```python
from tools.ocr_tool import OCRTool

# 创建工具实例
tool = OCRTool(engine="auto")

# 调用工具
result = tool.convert("file.pdf", "output.md")

if result["success"]:
    print("转换成功！")
else:
    print(f"转换失败: {result['error']}")
```

## 🛠️ 可用工具

### 豆包 OCR 工具 (doubao_ocr.py) ⭐ 推荐

**功能:** 使用豆包 AI 进行高精度文字识别

**支持格式:** PDF, PNG, JPG, etc.

**参数:**
- `--image`: 图片文件路径
- `--pdf`: PDF 文件路径
- `--output`: 输出 Markdown 文件路径
- `--pages`: 页面范围 (如: 1-10)
- `--api-key`: 豆包 API Key

**获取 API Key:**
1. 访问 [阿里云百炼平台](https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key)
2. 创建 API Key
3. 设置环境变量: `set DOUBAO_API_KEY=your_key`

**使用示例:**
```bash
# 识别图片
python tools/doubao_ocr.py --image photo.png

# 识别 PDF（全部页面）
python tools/doubao_ocr.py --pdf document.pdf --output output.md

# 识别 PDF（指定页面）
python tools/doubao_ocr.py --pdf document.pdf --output output.md --pages 1-10
```

**特点:**
- 免费额度充足
- 中文识别准确率高
- 支持复杂排版
- 无需本地 OCR 引擎

### 通用 OCR 工具 (ocr_tool.py)

**功能:** 将图片/PDF 转换为文本（模板）

**参数:**
- `--input`: 输入文件路径
- `--output`: 输出文件路径
- `--engine`: OCR 引擎 (auto, tesseract, paddleocr, azure)

## 📦 添加新工具

1. 在 `tools/` 目录创建新工具文件
2. 继承相同的模式（类 + main 函数）
3. 在 `api/server.py` 添加对应的 API 端点
4. 更新 `requirements.txt` 添加依赖

**工具模板:**
```python
"""
新工具模板
"""

import argparse
from typing import Optional, Dict, Any


class NewTool:
    """新工具类"""

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def execute(self, **params) -> Dict[str, Any]:
        """执行工具逻辑"""
        return {"success": True, "data": None}


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(description="新工具")
    parser.add_argument("--input", required=True, help="输入")
    args = parser.parse_args()

    tool = NewTool()
    result = tool.execute(input=args.input)

    return 0 if result["success"] else 1


if __name__ == "__main__":
    exit(main())
```

## 🔧 配置说明

### 虚拟环境隔离

所有依赖安装在 `.venv/` 虚拟环境中，不影响全局 Python 环境。

### 可扩展性

- 每个工具独立文件，便于维护
- 统一的 API 接口
- 支持多种调用方式

## 📝 注意事项

1. **使用前务必激活虚拟环境**
2. **OCR 工具需要额外安装 OCR 引擎**（根据需要选择）
3. **API 服务默认端口 8000**，可在 `api/server.py` 中修改

## 🔗 相关链接

- FastAPI 文档: https://fastapi.tiangolo.com/
- Uvicorn 文档: https://www.uvicorn.org/
