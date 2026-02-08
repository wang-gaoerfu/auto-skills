# 扫描版PDF转文本完全指南

## 方法一：在线工具（推荐，最简单）

### 方案1.1：Smallpdf（免费，支持中文）

**操作步骤：**
1. 打开浏览器，访问：https://smallpdf.com/cn/pdf-to-word
2. 点击"选择文件"，上传你的扫描版PDF
3. 等待转换完成（通常需要1-3分钟）
4. 下载转换后的Word文档
5. 打开Word文档，检查文字是否正确识别
6. 点击"文件" → "另存为" → 选择"纯文本(.txt)"

**优点：**
- ✅ 完全免费（每日有2次免费机会）
- ✅ 操作简单，无需安装软件
- ✅ 支持中文识别

**缺点：**
- ❌ 大文件（超过100MB）可能无法上传
- ❌ 每日有次数限制

---

### 方案1.2：PDF24（完全免费）

**操作步骤：**
1. 访问：https://tools.pdf24.org/zh/ocr-pdf
2. 上传你的扫描版PDF文件
3. 选择识别语言：勾选"中文（简体）"
4. 点击"转换"
5. 等待转换完成后，下载文本文件

**优点：**
- ✅ 完全免费，无次数限制
- ✅ 支持中文识别
- ✅ 直接输出文本文件

**缺点：**
- ❌ 大文件转换较慢

---

### 方案1.3：iLovePDF（推荐）

**操作步骤：**
1. 访问：https://www.ilovepdf.com/ocr_pdf
2. 上传扫描版PDF
3. 选择语言：点击"语言" → 选择"中文（简体）"
4. 点击"OCR转换"
5. 下载转换后的Word文档
6. 将Word另存为.txt格式

**优点：**
- ✅ 免费使用
- ✅ 识别准确率高
- ✅ 支持批量上传

**缺点：**
- ❌ 需要注册账号才能使用完整功能

---

## 方法二：命令行工具（适合技术人员）

### 方案2.1：使用 Tesseract OCR（开源免费）

**安装 Tesseract：**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim poppler-utils
```

**macOS:**
```bash
brew install tesseract tesseract-lang
brew install poppler
```

**Windows:**
1. 下载安装程序：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装时勾选"中文（简体）"语言包
3. 记住安装路径（默认：`C:\Program Files\Tesseract-OCR`）

**转换脚本：**

创建一个文件 `convert_pdf.py`：

```python
import subprocess
import os

def pdf_to_ocr_text(pdf_path, output_txt_path):
    """
    使用 Tesseract OCR 将扫描版PDF转换为文本
    """
    try:
        # 先将PDF转换为图片（使用 pdftoppm）
        # 或者直接使用 pdf2image 库
        from pdf2image import convert_from_path

        print(f"正在转换PDF为图片...")
        images = convert_from_path(pdf_path, dpi=300)

        print(f"正在识别文字（共{len(images)}页）...")
        all_text = []

        for i, image in enumerate(images, 1):
            print(f"正在处理第 {i}/{len(images)} 页...")
            # 临时保存图片
            temp_img_path = f"temp_page_{i}.png"
            image.save(temp_img_path, 'PNG')

            # 使用 Tesseract OCR 识别
            cmd = f"tesseract {temp_img_path} stdout -l chi_sim+eng"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                all_text.append(result.stdout)
                print(f"  ✅ 第{i}页识别完成")
            else:
                print(f"  ❌ 第{i}页识别失败: {result.stderr}")

            # 删除临时图片
            os.remove(temp_img_path)

        # 保存所有文本
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(all_text))

        print(f"\n✅ 转换完成！文本已保存到: {output_txt_path}")
        print(f"共识别 {len(images)} 页内容")

    except ImportError:
        print("❌ 缺少依赖，请先安装：")
        print("   pip install pdf2image pillow")
        print("   sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim poppler-utils")
    except Exception as e:
        print(f"❌ 转换失败：{str(e)}")

# 使用示例
if __name__ == "__main__":
    pdf_file = "your_book.pdf"  # 替换为你的PDF文件路径
    txt_file = "your_book.txt"  # 输出的文本文件路径

    pdf_to_ocr_text(pdf_file, txt_file)
```

**运行转换：**
```bash
# 安装依赖
pip install pdf2image pillow

# 运行脚本
python convert_pdf.py
```

**优点：**
- ✅ 完全免费开源
- ✅ 支持批量处理
- ✅ 可以调整识别参数
- ✅ 隐私安全（本地处理）

**缺点：**
- ❌ 需要安装软件
- ❌ 识别准确率可能不如商业工具
- ❌ 速度较慢

---

### 方案2.2：使用 OCRmyPDF（推荐，更简单）

**安装 OCRmyPDF：**

**Ubuntu/Debian:**
```bash
sudo apt-get install ocrmypdf tesseract-ocr-chi-sim
```

**macOS:**
```bash
brew install ocrmypdf
```

**使用方法：**
```bash
ocrmypdf -l chi_sim+eng input.pdf output.pdf --output-type txt
```

**批量转换：**
```bash
ocrmypdf -l chi_sim+eng input.pdf output.txt
```

**优点：**
- ✅ 专门为PDF OCR设计
- ✅ 命令简单
- ✅ 保留PDF格式

**缺点：**
- ❌ Linux/macOS支持较好，Windows支持有限

---

## 方法三：Python脚本（推荐给开发者）

### 方案3.1：使用 PaddleOCR（百度开源，中文识别率高）

**安装依赖：**
```bash
pip install paddlepaddle paddleocr pdf2image
```

**转换脚本：**

创建 `paddle_ocr_convert.py`：

```python
import os
from paddleocr import PaddleOCR
from pdf2image import convert_from_path

def pdf_to_text_with_paddle(pdf_path, output_txt_path):
    """
    使用 PaddleOCR 将扫描版PDF转换为文本
    """
    # 初始化OCR引擎（支持中英文）
    ocr = PaddleOCR(use_angle_cls=True, lang='ch')

    try:
        print(f"正在将PDF转换为图片...")
        # PDF转换为图片（DPI越高识别越准确，但速度越慢）
        images = convert_from_path(pdf_path, dpi=300)

        print(f"开始OCR识别（共{len(images)}页）...")
        all_text = []

        for i, image in enumerate(images, 1):
            print(f"正在处理第 {i}/{len(images)} 页...")

            # 将PIL图片转换为numpy数组
            import numpy as np
            img_array = np.array(image)

            # OCR识别
            result = ocr.ocr(img_array, cls=True)

            # 提取文字
            page_text = []
            if result and result[0]:
                for line in result[0]:
                    if line[1][0]:  # line[1][0] 是识别的文字
                        page_text.append(line[1][0])

            # 合并该页文字
            all_text.append('\n'.join(page_text))
            print(f"  ✅ 第{i}页识别完成，识别到{len(page_text)}行文字")

        # 保存所有文本
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write('\n\n--- 第 {i} 页 ---\n\n'.join(all_text))

        print(f"\n✅ 转换完成！")
        print(f"文本已保存到: {output_txt_path}")
        print(f"共识别 {len(images)} 页")

    except Exception as e:
        print(f"❌ 转换失败：{str(e)}")

# 使用示例
if __name__ == "__main__":
    pdf_file = "your_book.pdf"
    txt_file = "your_book.txt"

    pdf_to_text_with_paddle(pdf_file, txt_file)
```

**运行：**
```bash
python paddle_ocr_convert.py
```

**优点：**
- ✅ 中文识别率很高
- ✅ 免费开源
- ✅ 支持中英文混合
- ✅ 可定制化强

**缺点：**
- ❌ 首次运行需要下载模型（约200MB）
- ❌ 速度较慢
- ❌ 需要一定Python基础

---

## 方法四：软件工具（适合经常使用）

### 方案4.1：Adobe Acrobat Pro（付费，最专业）

**操作步骤：**
1. 打开Adobe Acrobat Pro
2. 打开你的扫描版PDF
3. 点击"工具" → "编辑PDF"
4. 点击"扫描和OCR" → "识别文本"
5. 选择语言：中文（简体）
6. 点击"识别文本"
7. 等待完成后，点击"文件" → "另存为" → 选择"文本"

**优点：**
- ✅ 识别准确率最高
- ✅ 支持批量处理
- ✅ 功能强大

**缺点：**
- ❌ 需要付费（约$20/月）

---

### 方案4.2：ABBYY FineReader（付费）

**操作步骤：**
1. 安装ABBYY FineReader
2. 打开软件，点击"转换为Microsoft Word"
3. 选择你的扫描版PDF
4. 选择语言：中文
5. 点击"保存"
6. 将Word文件另存为.txt

**优点：**
- ✅ 识别准确率极高
- ✅ 支持复杂的版面
- ✅ 支持多语言

**缺点：**
- ❌ 价格昂贵（约$200）

---

### 方案4.3：免费软件：OCR PDF Editor

**下载地址：**
- Windows: https://www.ocr-pdf.com/
- 免费版本有限制

**操作步骤：**
1. 下载并安装OCR PDF Editor
2. 打开软件，导入你的PDF
3. 选择语言：中文
4. 点击"开始OCR"
5. 导出为文本文件

**优点：**
- ✅ 免费使用
- ✅ 无需上传到云端（隐私安全）

**缺点：**
- ❌ 识别准确率一般
- ❌ 功能有限

---

## 推荐方案总结

| 使用场景 | 推荐方案 | 难度 | 费用 | 准确率 |
|---------|---------|------|------|--------|
| **偶尔转换1-2个文件** | Smallpdf | ⭐ | 免费 | ⭐⭐⭐⭐ |
| **经常转换，追求免费** | PDF24 | ⭐ | 免费 | ⭐⭐⭐ |
| **需要高准确率，愿意付费** | Adobe Acrobat Pro | ⭐ | 付费 | ⭐⭐⭐⭐⭐ |
| **有Python基础，批量处理** | PaddleOCR | ⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ |
| **技术人员，本地处理** | Tesseract OCR | ⭐⭐⭐ | 免费 | ⭐⭐⭐ |
| **大文件批量处理** | OCRmyPDF | ⭐⭐ | 免费 | ⭐⭐⭐⭐ |

---

## 💡 我的建议

**对于你的情况（300多页的扫描版PDF）：**

### 方案A：最简单（推荐）
使用 **PDF24 在线工具**：
1. 访问 https://tools.pdf24.org/zh/ocr-pdf
2. 上传PDF
3. 选择中文
4. 下载文本

**优点：** 完全免费，操作简单，支持中文

### 方案B：最准确（如果在线工具效果不好）
使用 **PaddleOCR Python脚本**：
1. 安装：`pip install paddlepaddle paddleocr pdf2image`
2. 复制上面的 `paddle_ocr_convert.py` 脚本
3. 修改文件名，运行：`python paddle_ocr_convert.py`

**优点：** 免费开源，中文识别率高，批量处理方便

### 方案C：最专业（如果预算充足）
使用 **Adobe Acrobat Pro** 免费试用版：
1. 下载试用版（7天免费）
2. 识别你的PDF
3. 导出文本

**优点：** 识别准确率最高，版面保持好

---

## 🔍 转换后的检查清单

转换完成后，请检查：

1. ✅ **文字准确性**：打开.txt文件，随机检查几页，确保文字识别正确
2. ✅ **格式问题**：检查是否有乱码、换行符过多等问题
3. ✅ **完整性**：确认没有漏页
4. ✅ **特殊字符**：检查表格、公式、特殊符号是否正确识别

**如果发现问题：**
- 少量错误：手动编辑修正
- 大量错误：换一个OCR工具重新转换
- 版面混乱：使用Adobe Acrobat等专业工具

---

## ❓ 常见问题

### Q1：转换后文字有乱码怎么办？
**A：**
- 选择"中文（简体）"识别语言
- 提高扫描DPI（300-600 DPI）
- 尝试其他OCR工具

### Q2：表格识别不好怎么办？
**A：**
- 使用 Adobe Acrobat Pro
- 或手动识别后重新整理表格

### Q3：PDF太大，无法上传怎么办？
**A：**
- 将PDF拆分成多个小文件，分别转换
- 使用本地OCR工具（Tesseract、PaddleOCR）

### Q4：转换速度太慢怎么办？
**A：**
- 降低DPI（从300降到200）
- 使用本地工具而非在线工具
- 分批处理（一次处理50页）

---

## 📞 需要帮助？

如果按照以上方法还是无法转换，请告诉我：
1. 你的PDF文件有多大？
2. 你使用的是什么操作系统（Windows/Mac/Linux）？
3. 你希望用哪种方案（在线工具/命令行/软件）？
4. 转换后遇到了什么具体问题？

我可以为你提供更针对性的指导！
