# Word文档导入知识库操作指南

## 📥 如何上传你的Word文档

### 方案一：使用自动导入脚本（推荐）⭐

我已经为你创建了一个自动化脚本，可以：
- ✅ 自动从Word提取所有文本（包括表格）
- ✅ 自动清洗页眉、页脚、页码
- ✅ 自动去除多余空格和空白行
- ✅ 自动分块并导入到知识库

#### 操作步骤：

**1. 安装依赖**
```bash
pip install python-docx coze-coding-dev-sdk
```

**2. 准备Word文档**
将你的Word文档放到项目目录下，例如：`assets/领导力测评书籍.docx`

**3. 运行导入脚本**
```bash
python scripts/import_word.py assets/领导力测评书籍.docx
```

**4. 查看结果**
导入脚本会显示详细的进度信息：
```
============================================================
📚 开始导入Word文档到知识库
============================================================

📖 步骤 1/4: 读取Word文档...
   文件路径: assets/领导力测评书籍.docx
✅ 成功提取文本，共 150000 个字符
   大约 300 页内容

🧹 步骤 2/4: 清洗文本内容...
   正在去除页眉、页脚、页码等无关信息...
✅ 清洗完成
   清洗前: 150000 字符
   清洗后: 142000 字符
   清除: 8000 字符
   清洗后文本已保存: assets/领导力测评书籍_cleaned.txt

⚙️  步骤 3/4: 配置分块参数...
   分块大小: 1500 tokens
   分割符: 段落 (\n\n)

📤 步骤 4/4: 导入到知识库...
   数据集名称: leadership_knowledge

✅✅✅ 导入成功！✅✅✅

📊 导入统计:
   文档ID: ['doc_xxx']
   数据集: leadership_knowledge
   总字符: 142000
   分块大小: 1500 tokens

🎉 现在可以使用Agent进行问答了！
```

---

### 方案二：使用命令行工具（简单快速）

如果你不想写Python脚本，也可以使用命令行工具：

**1. 先从Word提取文本**
- 打开Word文档
- 点击"文件" → "另存为"
- 选择"纯文本(.txt)"格式
- 保存文件，例如：`assets/book.txt`

**2. 使用命令导入**
```bash
coze-coding-ai knowledge add \
  --dataset "leadership_knowledge" \
  --content "$(cat assets/book.txt)"
```

**注意：** 此方法不会自动清洗页眉页脚，需要在另存为文本时手动检查。

---

## 🧹 自动清洗功能说明

### 已支持的清洗功能

导入脚本会自动去除以下无关信息：

#### 1. **页眉页脚**
- ✅ 书名（如：领导力测评与发展）
- ✅ 章节号（重复的章节标题）
- ✅ 保密声明
- ✅ 内部资料声明
- ✅ 版权信息

#### 2. **页码**
- ✅ "第x页" 格式
- ✅ "Page x" 格式
- ✅ "- x -" 格式
- ✅ "x/xx" 格式
- ✅ 纯数字行

#### 3. **格式问题**
- ✅ 多余的空行（3个及以上换行符 → 2个）
- ✅ 多余的空格和制表符
- ✅ 每行首尾的空格
- ✅ 过短的行（可能是乱码）

#### 4. **内容保留**
- ✅ 保留所有正文段落
- ✅ 保留表格内容（自动转为文本）
- ✅ 保留标题和章节信息
- ✅ 保留重要的列表和要点

---

## ⚙️ 高级配置

### 调整分块大小

如果书本内容较长，可以调整分块大小：

```bash
# 默认：1500 tokens（推荐）
python scripts/import_word.py assets/book.docx

# 更大的分块（适合章节较长的书）
python scripts/import_word.py assets/book.docx leadership_knowledge 2000

# 更小的分块（适合检索更精准）
python scripts/import_word.py assets/book.docx leadership_knowledge 1000
```

**分块大小建议：**
- 1000-1500：适合短内容，检索更精准
- 1500-2000：通用推荐，平衡性最好
- 2000-3000：适合长内容，上下文更完整

### 使用不同的数据集名称

如果想导入多本书，可以使用不同的数据集名：

```bash
# 导入第一本书
python scripts/import_word.py assets/领导力测评.docx book1

# 导入第二本书
python scripts/import_word.py assets/团队建设.docx book2
```

**注意：** Agent默认会搜索所有数据集，所以不需要特殊配置。

---

## 🔍 验证导入结果

### 方法1：使用命令行搜索

```bash
coze-coding-ai knowledge search \
  --query "领导力测评" \
  --top-k 3
```

### 方法2：查看清洗后的文本

脚本会自动保存清洗后的文本，可以检查清洗效果：

```bash
# 打开清洗后的文件
cat assets/领导力测评书籍_cleaned.txt

# 或者在编辑器中打开
code assets/领导力测评书籍_cleaned.txt
```

### 方法3：使用Agent测试

导入完成后，直接与Agent对话测试：

```
用户：领导力测评的主要方法有哪些？
```

如果Agent能返回相关内容，说明导入成功！

---

## 📊 导入参数说明

### ChunkConfig 参数

```python
ChunkConfig(
    separator="\n\n",              # 分割符：\n\n 表示按段落分割
    max_tokens=1500,              # 每块最大token数
    remove_extra_spaces=True,     # 去除多余空格
    remove_urls_emails=False      # 是否去除URL和邮箱
)
```

**参数说明：**

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| separator | 分割符，用于将文本切分为小块 | `\n\n`（段落）或 `\n`（行） |
| max_tokens | 每块的最大token数 | 1500-2000 |
| remove_extra_spaces | 去除多余空格 | True |
| remove_urls_emails | 去除URL和邮箱 | False（如果书中有参考链接） |

---

## ❓ 常见问题

### Q1：导入后搜索不到内容怎么办？

**A：**
1. 检查导入是否成功（查看是否有错误信息）
2. 使用搜索命令验证：`coze-coding-ai knowledge search --query "测试"`
3. 检查清洗后的文本是否还有内容
4. 可能需要调整搜索关键词

### Q2：页眉页脚没有完全去除怎么办？

**A：**
1. 打开清洗后的文本文件：`book_cleaned.txt`
2. 找到需要去除的页眉页脚
3. 修改 `scripts/import_word.py` 中的 `clean_text` 函数
4. 添加对应的正则表达式

例如：
```python
# 在 footer_patterns 中添加你的页眉页脚模式
footer_patterns = [
    r'你的页眉内容.*?\n',
    # ... 其他模式
]
```

### Q3：Word文档太大，导入失败怎么办？

**A：**
1. 将Word文档按章节拆分成多个文件
2. 分别导入每个文件
3. 使用相同的数据集名称

### Q4：表格内容丢失了怎么办？

**A：**
脚本会自动提取表格内容并转为文本格式。如果表格内容丢失：
1. 检查Word中的表格是否正确识别
2. 查看清洗后的文本文件
3. 表格会以 `列1 | 列2 | 列3` 的格式保存

### Q5：如何更新知识库内容？

**A：**
直接重新导入即可，知识库会自动更新：
```bash
python scripts/import_word.py assets/书籍.docx
```

---

## 🎯 完整工作流程总结

```
1. 准备Word文档
   ↓
2. 安装依赖：pip install python-docx coze-coding-dev-sdk
   ↓
3. 运行导入脚本：python scripts/import_word.py assets/book.docx
   ↓
4. 查看清洗后的文本（确认清洗效果）
   ↓
5. 验证导入：coze-coding-ai knowledge search --query "测试"
   ↓
6. 使用Agent进行问答测试
   ↓
7. ✅ 完成！
```

---

## 💡 最佳实践

1. **首次导入**：先导入1-2章，测试效果
2. **检查清洗**：查看 `book_cleaned.txt`，确认页眉页脚已去除
3. **调整参数**：根据内容特点调整 `chunk_size`
4. **逐步导入**：如果书本很大，分批导入，每批验证一次
5. **保留备份**：保留原始Word文档和清洗后的文本文件

---

## 📞 需要帮助？

如果在导入过程中遇到问题：
1. 查看错误信息
2. 检查清洗后的文本文件
3. 使用搜索命令验证知识库
4. 告诉我具体的错误信息，我会帮你解决！

---

现在就开始导入吧！🚀
