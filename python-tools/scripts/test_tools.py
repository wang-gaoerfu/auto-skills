"""
测试脚本 - 验证所有工具是否正常工作
"""

import sys
import os

# 添加工具目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))


def test_ocr_tool():
    """测试 OCR 工具"""
    print("测试 OCR 工具...")

    try:
        from ocr_tool import OCRTool

        # 创建工具实例
        tool = OCRTool()

        # 测试不存在文件的情况
        result = tool.convert("non_existent.pdf")

        assert result["success"] == False
        assert result["error"] is not None

        print("  [OK] OCR tool import and basic functions working")
        return True

    except Exception as e:
        print(f"  [FAIL] OCR tool test failed: {e}")
        return False


def test_api_server():
    """测试 API 服务器"""
    print("测试 API 服务器...")

    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
        from server import app

        assert app is not None
        assert app.title == "Python Tools API"

        print("  [OK] API server import working")
        return True

    except Exception as e:
        print(f"  [FAIL] API server test failed: {e}")
        return False


def main():
    """运行所有测试"""
    print("=" * 50)
    print("Python Tools 测试")
    print("=" * 50)
    print()

    results = []

    # 运行测试
    results.append(("OCR 工具", test_ocr_tool()))
    results.append(("API 服务器", test_api_server()))

    # 输出结果
    print()
    print("=" * 50)
    print("测试结果汇总:")
    print("=" * 50)

    for name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {name}: {status}")

    # 总体结果
    all_passed = all(r[1] for r in results)
    print()
    if all_passed:
        print("All tests passed! [OK]")
        return 0
    else:
        print("Some tests failed! [FAIL]")
        return 1


if __name__ == "__main__":
    exit(main())
