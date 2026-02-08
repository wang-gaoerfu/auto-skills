# 豆包视觉理解 OCR 快速入门指南

## 🚀 快速开始

### 1. 获取火山引擎 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 注册/登录火山引擎账号
3. 开通"火山方舟"大模型服务平台
4. 在 API Key 管理中创建 API Key

**文档参考:**
- [图片理解 API 文档](https://www.volcengine.com/docs/82379/1362931)
- [火山方舟快速入门](https://www.volcengine.com/docs/82379/1399008)

### 2. 设置环境变量

**Windows CMD:**
```bash
set VOLCENGINE_API_KEY=your_api_key_here
```

**Windows PowerShell:**
```bash
$env:VOLCENGINE_API_KEY="your_api_key_here"
```

**永久设置（推荐）:**
1. 右键"此电脑" -> 属性 -> 高级系统设置 -> 环境变量
2. 添加用户变量: `VOLCENGINE_API_KEY`

### 3. 激活虚拟环境

```bash
cd python-tools
activate.bat
```

### 4. 使用豆包 OCR

#### 方式一：命令行

**识别图片:**
```bash
python tools/doubao_ocr.py --image ../knowledge/教练技术的53个顶级工具-276.pdf
```

**识别 PDF (前10页):**
```bash
python tools/doubao_ocr.py --pdf ../knowledge/教练技术的53个顶级工具-276.pdf --output ../knowledge/教练技术的53个顶级工具-276.md --pages 1-10
```

**识别完整 PDF:**
```bash
python tools/doubao_ocr.py --pdf ../knowledge/教练技术的53个顶级工具-276.pdf --output ../knowledge/教练技术的53个顶级工具-276.md
```

#### 方式二：Python 代码

```python
from tools.doubao_ocr import DoubaoOCR

# 创建工具实例
ocr = DoubaoOCR()

# 识别图片
result = ocr.recognize_image("photo.png")
print(result["text"])

# 识别 PDF
result = ocr.recognize_pdf(
    "document.pdf",
    "output.md",
    page_range=(1, 10)  # 前10页
)
```

## 💡 使用建议

### 处理大文件 (275页 PDF)

**建议分批处理:**
```bash
# 第1批: 1-50页
python tools/doubao_ocr.py --pdf big.pdf --output part1.md --pages 1-50

# 第2批: 51-100页
python tools/doubao_ocr.py --pdf big.pdf --output part2.md --pages 51-100

# 第3批: 101-150页
python tools/doubao_ocr.py --pdf big.pdf --output part3.md --pages 101-150

# 第4批: 151-200页
python tools/doubao_ocr.py --pdf big.pdf --output part4.md --pages 151-200

# 第5批: 201-275页
python tools/doubao_ocr.py --pdf big.pdf --output part5.md --pages 201-275
```

### 费用说明

豆包视觉理解模型定价：
- **约 1元 ≈ 300 张高清图片** [来源](https://cloud.baidu.com/article/4223696)
- 千tokens输入价格仅 **3厘**（0.003元）
- 比行业价格低 **85%**
- 新用户有免费额度

**详细定价:** [火山引擎定价](https://www.volcengine.com/docs/82379/1302004)

### 最佳实践

1. **先测试小批量** - 先处理1-2页看看效果
2. **使用页面范围** - 不要一次性处理全部275页
3. **保存中间结果** - 每批处理完立即保存
4. **检查识别质量** - 确认文字提取准确后再继续

## 🔧 故障排除

### 错误: "API Key 未提供"
**解决:** 设置 `VOLCENGINE_API_KEY` 环境变量

### 错误: "请先安装 volcengine-python-sdk"
**解决:** 运行 `pip install volcengine-python-sdk[ark]`

### 错误: "请先安装 pdfplumber"
**解决:** 运行 `pip install pdfplumber`

### 识别速度慢
**原因:** 需要逐页上传图片到API
**建议:** 减小并发数，或使用更快的网络

## 📚 相关链接

- [火山引擎控制台](https://console.volcengine.com/)
- [火山方舟平台](https://www.volcengine.com/docs/82379/1302004)
- [图片理解 API 文档](https://www.volcengine.com/docs/82379/1362931)
- [豆包产品页](https://www.volcengine.com/product/doubao)
- [火山引擎 Python SDK](https://github.com/volcengine/volcengine-python-sdk)
