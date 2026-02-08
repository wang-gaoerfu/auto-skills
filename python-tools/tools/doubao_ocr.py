"""
豆包视觉理解 OCR 工具
使用火山引擎 Ark SDK 调用豆包多模态视觉理解模型

需要安装: pip install volcengine-python-sdk[ark]
API Key: https://console.volcengine.com/
文档: https://www.volcengine.com/docs/82379/1362931
"""

import argparse
import os
import base64
from typing import Optional, Dict, Any
from pathlib import Path


class DoubaoOCR:
    """豆包视觉理解 OCR 工具类"""

    def __init__(self, api_key: Optional[str] = None):
        """
        初始化豆包 OCR 工具

        Args:
            api_key: 火山引擎 API Key，如果不提供则从环境变量 VOLCENGINE_API_KEY 读取
        """
        self.api_key = api_key or os.getenv("VOLCENGINE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "API Key 未提供。请设置 VOLCENGINE_API_KEY 环境变量 "
                "或传入 api_key 参数。\n"
                "获取 API Key: https://console.volcengine.com/\n"
                "文档: https://www.volcengine.com/docs/82379/1362931"
            )

        self.endpoint = "https://ark.cn-beijing.volces.com/api/v3"

    def _encode_image(self, image_path: str) -> str:
        """
        将图片编码为 base64 URL

        Args:
            image_path: 图片路径

        Returns:
            base64 编码的图片 URL
        """
        with open(image_path, "rb") as f:
            base64_data = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/jpeg;base64,{base64_data}"

    def recognize_image(
        self,
        image_path: str,
        prompt: str = "请识别图片中的所有文字内容，包括中英文。请保持原有的格式和结构，直接输出识别到的文字，不需要任何解释或额外说明。"
    ) -> Dict[str, Any]:
        """
        识别图片中的文字（使用火山引擎 SDK）

        Args:
            image_path: 图片路径
            prompt: 识别提示词

        Returns:
            识别结果
        """
        try:
            from volcengine.maas.v2 import MaasService, MaasException

            # 创建服务实例
            maas = MaasService(
                api_key=self.api_key,
                region="cn-beijing"
            )

            # 编码图片
            image_url = self._encode_image(image_path)

            # 调用豆包视觉理解模型
            # 使用 Doubao-pro-256k 或其他支持视觉的模型
            resp = maas.chat(
                model="ep-20241205173316-6mcrq",  # 豆包视觉理解模型 endpoint
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "image": {"type": "image_url", "image_url": image_url}},
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
            )

            if resp.success:
                # 提取文本内容
                text = resp.output.choices[0].message.content
                return {
                    "success": True,
                    "text": text,
                    "model": resp.model
                }
            else:
                return {
                    "success": False,
                    "error": f"API 调用失败: {resp.error}"
                }

        except ImportError:
            return {
                "success": False,
                "error": "请先安装 volcengine-python-sdk: pip install volcengine-python-sdk[ark]"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"识别失败: {str(e)}"
            }

    def recognize_pdf(
        self,
        pdf_path: str,
        output_path: Optional[str] = None,
        page_range: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """
        识别 PDF 中的文字

        Args:
            pdf_path: PDF 文件路径
            output_path: 输出 Markdown 文件路径
            page_range: 页面范围 (start, end)，None 表示全部

        Returns:
            识别结果
        """
        try:
            import pdfplumber

            result = {
                "success": False,
                "text": "",
                "pages": 0,
                "output_file": output_path,
                "error": None
            }

            # 打开 PDF
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)

                # 确定页面范围
                if page_range:
                    start, end = page_range
                    pages_to_process = range(start - 1, min(end, total_pages))
                else:
                    pages_to_process = range(total_pages)

                # 逐页识别
                markdown_content = []

                for i in pages_to_process:
                    page = pdf.pages[i]

                    # 将页面转换为图片
                    img = page.to_image()
                    temp_img_path = f"temp_page_{i+1}.png"
                    img.save(temp_img_path, format="PNG")

                    # 识别图片
                    page_result = self.recognize_image(temp_img_path)

                    # 清理临时文件
                    os.remove(temp_img_path)

                    if page_result["success"]:
                        markdown_content.append(f"## 第 {i+1} 页\n\n")
                        markdown_content.append(page_result["text"])
                        markdown_content.append("\n\n---\n\n")
                        print(f"第 {i+1}/{len(pages_to_process)} 页完成")
                    else:
                        print(f"第 {i+1} 页识别失败: {page_result.get('error')}")

                result["pages"] = len(pages_to_process)

                # 保存到文件
                if output_path and markdown_content:
                    with open(output_path, "w", encoding="utf-8") as f:
                        f.write("".join(markdown_content))
                    result["success"] = True
                    result["text"] = f"已保存到 {output_path}"
                elif markdown_content:
                    result["success"] = True
                    result["text"] = "".join(markdown_content)

                return result

        except ImportError:
            return {
                "success": False,
                "error": "请先安装 pdfplumber: pip install pdfplumber"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="豆包视觉理解 OCR 工具 - 使用豆包 AI 进行文字识别",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    # 识别图片
    %(prog)s --image photo.png

    # 识别 PDF（全部页面）
    %(prog)s --pdf document.pdf --output output.md

    # 识别 PDF（指定页面范围）
    %(prog)s --pdf document.pdf --output output.md --pages 1-10

环境变量:
    VOLCENGINE_API_KEY    火山引擎 API 密钥（必需）

获取 API Key:
    1. 访问 https://console.volcengine.com/
    2. 开通火山方舟服务
    3. 创建 API Key

文档:
    https://www.volcengine.com/docs/82379/1362931
        """
    )

    parser.add_argument(
        "--image", "-i",
        help="图片文件路径"
    )

    parser.add_argument(
        "--pdf", "-p",
        help="PDF 文件路径"
    )

    parser.add_argument(
        "--output", "-o",
        help="输出文件路径（仅 PDF）"
    )

    parser.add_argument(
        "--pages",
        help="页面范围，格式: 1-10"
    )

    parser.add_argument(
        "--api-key",
        help="火山引擎 API Key（也可使用 VOLCENGINE_API_KEY 环境变量）"
    )

    args = parser.parse_args()

    # 解析页面范围
    page_range = None
    if args.pages:
        try:
            start, end = map(int, args.pages.split("-"))
            page_range = (start, end)
        except ValueError:
            parser.error("--pages 格式错误，应为: 1-10")

    # 创建 OCR 工具
    try:
        ocr = DoubaoOCR(api_key=args.api_key)
    except ValueError as e:
        print(f"错误: {e}")
        return 1

    # 执行识别
    if args.image:
        result = ocr.recognize_image(args.image)
        if result["success"]:
            print(result["text"])
        else:
            print(f"识别失败: {result.get('error')}")
            return 1

    elif args.pdf:
        if not args.output:
            parser.error("--pdf 需要 --output 参数")

        print(f"开始识别 PDF: {args.pdf}")
        result = ocr.recognize_pdf(args.pdf, args.output, page_range)

        if result["success"]:
            print(f"\n识别完成！")
            print(f"处理页数: {result['pages']}")
            print(f"输出文件: {result['output_file']}")
        else:
            print(f"识别失败: {result.get('error')}")
            return 1

    else:
        parser.error("请指定 --image 或 --pdf 参数")

    return 0


if __name__ == "__main__":
    exit(main())
