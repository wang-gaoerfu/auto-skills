# 知识库问题诊断与解决方案

## 🚨 问题现象

所有预设问题和案例提问时都返回转人工提示，相关性评分低于0.5。

---

## 🔍 诊断步骤

### 步骤1：检查知识库是否有内容

执行以下命令查看知识库内容：

```bash
# 搜索最基础的词
coze-coding-ai knowledge search --query "领导力" --top-k 5
```

**预期结果：**
- ✅ **有内容**：返回相关内容片段
- ❌ **无内容**：返回"未在知识库中找到相关内容"

---

### 步骤2：检查相关性评分

从上面的测试可以看到：
- 搜索"领导力" → 评分0.39（LOW_MATCH）
- 阈值设置：LOW_MATCH < 0.5 → 触发转人工

---

## 💡 解决方案

### 方案一：导入书籍内容（推荐）

如果知识库中没有内容，需要先导入你的书籍：

```bash
# 导入Word文档
python scripts/import_word.py assets/你的书籍.docx
```

**详细步骤：**
1. 将你的Word文档放到 `assets/` 目录
2. 运行导入脚本
3. 等待导入完成
4. 验证导入结果

**验证导入：**
```bash
# 搜索测试
coze-coding-ai knowledge search --query "领导力" --top-k 5

# 如果返回内容，说明导入成功
```

---

### 方案二：调整相关性阈值（临时方案）

如果知识库有内容但相关性评分太低，可以调整阈值：

#### 修改 `src/tools/knowledge_search_tool.py`

**当前阈值：**
```python
# 当前设置
if top_chunk.score >= 0.7:
    return f"HIGH_MATCH|{top_chunk.score:.2f}|..."
elif top_chunk.score >= 0.5:
    return f"MEDIUM_MATCH|{top_chunk.score:.2f}|..."
else:
    return f"LOW_MATCH|{top_chunk.score:.2f}|..."
```

**调整为更宽松的阈值：**
```python
# 降低阈值
if top_chunk.score >= 0.6:  # 从0.7降到0.6
    return f"HIGH_MATCH|{top_chunk.score:.2f}|..."
elif top_chunk.score >= 0.4:  # 从0.5降到0.4
    return f"MEDIUM_MATCH|{top_chunk.score:.2f}|..."
else:
    return f"LOW_MATCH|{top_chunk.score:.2f}|..."
```

**同时调整搜索工具的最低阈值：**
```python
# 在 search_leadership_knowledge 中
response = client.search(
    query=query,
    top_k=5,
    min_score=0.3  # 从0.5降到0.3
)
```

#### 修改步骤：

1. 打开文件：
```bash
# 编辑工具文件
vi src/tools/knowledge_search_tool.py
# 或使用其他编辑器
```

2. 修改阈值：
- HIGH_MATCH: 0.7 → 0.6
- MEDIUM_MATCH: 0.5 → 0.4
- min_score: 0.5 → 0.3

3. 保存文件

4. 测试：
```bash
# 重新测试
# 使用你的测试工具
```

---

### 方案三：混合方案（推荐）

**结合方案一和方案二：**

1. **先导入书籍内容**
   ```bash
   python scripts/import_word.py assets/你的书籍.docx
   ```

2. **验证导入效果**
   ```bash
   coze-coding-ai knowledge search --query "领导力" --top-k 5
   ```

3. **如果相关性还是太低，调整阈值**
   - 按照方案二修改阈值

4. **重新测试**

---

## 📊 阈值建议

### 推荐阈值设置

| 阈值类型 | 保守 | 标准 | 宽松 |
|---------|------|------|------|
| HIGH_MATCH | 0.8 | 0.7 | 0.6 |
| MEDIUM_MATCH | 0.6 | 0.5 | 0.4 |
| LOW_MATCH | < 0.6 | < 0.5 | < 0.4 |
| 搜索最低分 | 0.5 | 0.4 | 0.3 |

**建议：**
- **首次使用**：使用"宽松"阈值
- **内容丰富后**：切换到"标准"阈值
- **追求质量**：使用"保守"阈值

---

## 🛠️ 完整修复流程

### 第一步：确认知识库状态

```bash
# 搜索测试
coze-coding-ai knowledge search --query "领导力" --top-k 5
```

**判断：**
- ✅ 有内容 → 进入第二步
- ❌ 无内容 → 导入书籍内容

---

### 第二步：导入书籍（如果需要）

```bash
# 确认文件存在
ls assets/*.docx

# 导入
python scripts/import_word.py assets/你的书籍.docx

# 验证
coze-coding-ai knowledge search --query "测评" --top-k 3
```

---

### 第三步：调整阈值

```bash
# 编辑文件
vi src/tools/knowledge_search_tool.py

# 修改阈值（改为宽松模式）
# HIGH_MATCH: 0.6
# MEDIUM_MATCH: 0.4
# min_score: 0.3
```

---

### 第四步：测试验证

```bash
# 测试预设问题
# 使用你的测试工具，提问：
# "什么是领导力测评？"
# "老板突然要求提前完成项目，团队压力大，如何向上沟通？"
```

**预期结果：**
- ✅ 能够基于知识库回答
- ✅ 不再全部转人工

---

## 🔧 快速修复脚本

创建一个快速诊断脚本：

```bash
#!/bin/bash
# 诊断知识库状态

echo "=== 知识库诊断 ==="
echo ""
echo "1. 搜索测试..."
coze-coding-ai knowledge search --query "领导力" --top-k 3

echo ""
echo "2. 检查书籍文件..."
ls -lh assets/*.docx 2>/dev/null || echo "未找到Word文档"

echo ""
echo "3. 检查清洗后的文本..."
ls -lh assets/*_cleaned.txt 2>/dev/null || echo "未找到清洗后的文本"

echo ""
echo "=== 诊断完成 ==="
echo ""
echo "如果搜索无结果，请运行："
echo "  python scripts/import_word.py assets/你的书籍.docx"
echo ""
echo "如果搜索有结果但评分低，请调整阈值："
echo "  编辑 src/tools/knowledge_search_tool.py"
```

保存为 `diagnose_knowledge.sh`，运行：
```bash
chmod +x diagnose_knowledge.sh
./diagnose_knowledge.sh
```

---

## 📝 常见问题

### Q1: 为什么相关性评分这么低？

**可能原因：**
1. 知识库中没有相关内容
2. 问题关键词与知识库内容不匹配
3. 向量搜索的相似度计算问题

**解决方案：**
1. 确认已导入书籍内容
2. 调整问题表述
3. 降低相关性阈值

### Q2: 导入后还是没有结果？

**检查：**
1. 书籍内容是否与领导力相关？
2. 导入时是否报错？
3. 清洗后的文本是否为空？

**解决：**
1. 确认书籍内容
2. 查看导入日志
3. 检查清洗后的文本文件

### Q3: 调整阈值后还是不行？

**尝试：**
1. 进一步降低阈值到0.2
2. 检查知识库内容质量
3. 重新导入书籍

---

## 🎯 推荐操作步骤

### 立即执行（5分钟）

1. **检查知识库**
   ```bash
   coze-coding-ai knowledge search --query "领导力" --top-k 3
   ```

2. **如果无结果，导入书籍**
   ```bash
   python scripts/import_word.py assets/你的书籍.docx
   ```

3. **调整阈值（临时方案）**
   ```bash
   # 编辑 src/tools/knowledge_search_tool.py
   # 将阈值调整为：HIGH=0.6, MEDIUM=0.4, min=0.3
   ```

4. **重新测试**
   ```bash
   # 使用测试工具提问
   ```

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供以下信息：

1. **搜索结果**
   ```bash
   coze-coding-ai knowledge search --query "领导力" --top-k 3
   ```

2. **导入日志**
   ```bash
   python scripts/import_word.py assets/你的书籍.docx
   ```

3. **书籍文件信息**
   ```bash
   ls -lh assets/*.docx
   ```

我会根据这些信息帮你进一步诊断！
