"""
OCR 工具 - 支持直接执行和 API 调用

使用示例:
    1. 直接执行: python tools/ocr_tool.py --input file.pdf --output output.md
    2. API 调用: from tools.ocr_tool import OCRTool; tool = OCRTool(); result = tool.convert("file.pdf")
"""

import argparse
import os
from typing import Optional, Dict, Any


class OCRTool:
    """OCR 工具类"""

    def __init__(self, engine: str = "auto"):
        """
        初始化 OCR 工具

        Args:
            engine: OCR 引擎类型 (auto, tesseract, paddleocr, etc.)
        """
        self.engine = engine
        self._setup()

    def _setup(self):
        """设置 OCR 环境"""
        # 这里将根据选择的引擎初始化相应的 OCR 库
        # 例如: self.ocr = PaddleOCR() 或 self.ocr = pytesseract
        pass

    def convert(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        转换文件为 Markdown

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）
            **kwargs: 其他参数

        Returns:
            包含转换结果的字典
        """
        result = {
            "success": False,
            "input": input_path,
            "output": output_path,
            "error": None
        }

        try:
            # 检查输入文件
            if not os.path.exists(input_path):
                result["error"] = f"输入文件不存在: {input_path}"
                return result

            # TODO: 实现 OCR 转换逻辑
            # 这里将根据文件类型调用相应的 OCR 方法

            result["success"] = True

        except Exception as e:
            result["error"] = str(e)

        return result

    def convert_pdf(self, pdf_path: str, **kwargs) -> str:
        """转换 PDF 文件"""
        # TODO: 实现 PDF OCR
        return ""

    def convert_image(self, image_path: str, **kwargs) -> str:
        """转换图片文件"""
        # TODO: 实现图片 OCR
        return ""


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="OCR 工具 - 将图片/PDF 转换为文本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s --input file.pdf --output output.md
    %(prog)s --input image.png --engine tesseract
        """
    )

    parser.add_argument(
        "--input", "-i",
        required=True,
        help="输入文件路径"
    )

    parser.add_argument(
        "--output", "-o",
        help="输出文件路径"
    )

    parser.add_argument(
        "--engine", "-e",
        default="auto",
        choices=["auto", "tesseract", "paddleocr", "azure"],
        help="OCR 引擎"
    )

    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="显示详细信息"
    )

    args = parser.parse_args()

    # 执行转换
    tool = OCRTool(engine=args.engine)
    result = tool.convert(args.input, args.output)

    # 输出结果
    if args.verbose or not result["success"]:
        print(f"输入: {result['input']}")
        print(f"输出: {result['output']}")
        print(f"状态: {'成功' if result['success'] else '失败'}")
        if result["error"]:
            print(f"错误: {result['error']}")

    return 0 if result["success"] else 1


if __name__ == "__main__":
    exit(main())
