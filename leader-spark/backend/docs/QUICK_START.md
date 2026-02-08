# 🚀 快速开始：3步导入你的Word文档

## 第一步：无需安装依赖 ✨

**好消息！** 所需的依赖已经安装好了，你不需要安装任何东西！

系统已经包含：
- ✅ `docx2python`：用于读取Word文档
- ✅ `coze-coding-dev-sdk`：用于知识库操作

直接开始使用即可！

---

## 第二步：准备文件

将你的Word文档放到项目目录下：

```bash
# 创建assets目录（如果不存在）
mkdir -p assets

# 将你的Word文档复制到assets目录
# 例如：领导力测评书籍.docx
```

---

## 第三步：运行导入脚本

```bash
python scripts/import_word.py assets/你的文档.docx
```

就这么简单！✅

---

## 📝 完整示例

假设你的文档名是 `领导力测评与发展.docx`：

```bash
# 1. 安装依赖（只需一次）
pip install python-docx

# 2. 确认文件位置
ls assets/领导力测评与发展.docx

# 3. 导入到知识库
python scripts/import_word.py assets/领导力测评与发展.docx

# 等待完成...
# ✅ 导入成功！
```

---

## 🎉 导入完成后

### 验证导入是否成功

```bash
# 搜索测试
coze-coding-ai knowledge search \
  --query "领导力" \
  --top-k 3
```

如果返回相关内容，说明导入成功！

### 测试Agent

直接与Agent对话：

```
用户：领导力测评的方法有哪些？
```

如果Agent能基于你的书籍内容回答，说明一切就绪！🎊

---

## ⚡ 常用命令

```bash
# 使用默认参数导入
python scripts/import_word.py assets/book.docx

# 自定义数据集名称
python scripts/import_word.py assets/book.docx my_dataset

# 调整分块大小（适合长内容）
python scripts/import_word.py assets/book.docx my_dataset 2000

# 验证知识库内容
coze-coding-ai knowledge search --query "测试关键词" --top-k 5

# 查看清洗后的文本
cat assets/book_cleaned.txt
```

---

## 📂 文件说明

导入后会产生以下文件：

| 文件 | 说明 |
|------|------|
| `assets/book.docx` | 原始Word文档（你的输入） |
| `assets/book_cleaned.txt` | 清洗后的文本（自动生成） |

**建议：** 保留 `book_cleaned.txt`，可以用来检查清洗效果和备份内容。

---

## 🆘 遇到问题？

### 问题1：找不到模块 'docx'
**解决：**
```bash
pip install python-docx
```

### 问题2：导入失败，提示连接错误
**解决：**
- 检查网络连接
- 确认 `coze-coding-dev-sdk` 已安装
- 查看错误信息，可能是知识库服务暂时不可用

### 问题3：清洗后内容丢失
**解决：**
- 查看 `book_cleaned.txt` 文件
- 如果是清洗规则太严格，可以修改 `scripts/import_word.py`
- 或者先手动将Word另存为文本，再导入

---

## 📚 更多帮助

- **详细教程**：查看 `docs/WORD_IMPORT_GUIDE.md`
- **PDF转换指南**：查看 `docs/PDF_OCR_GUIDE.md`
- **Agent使用指南**：查看 `docs/LEADERSHIP_AGENT_GUIDE.md`

---

现在就开始吧！只需3步，3分钟内完成导入！⏱️
