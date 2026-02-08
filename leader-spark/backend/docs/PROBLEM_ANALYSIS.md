# 问题分析与解决方案

## 问题描述
用户反馈：预设问题提问时**全部返回转人工提示**，相关性评分仅为 0.39。

## 根本原因分析

经过诊断，发现问题出在**知识库内容与预设问题不匹配**：

### 当前知识库内容
```
assets/
├── 教练技术的53个顶级工具-276_1-100_cleaned.txt (171K)
├── 教练技术的53个顶级工具-276_101-200_cleaned.txt (153K)
└── 教练技术的53个顶级工具-276_201-275_cleaned.txt (135K)
```

**内容主题**：教练技术（Coaching Tools）  
**内容数量**：276页书籍内容

### 预设问题主题
**主题**：领导力测评与发展  
**数量**：200个问题（100理论+100案例）

### 匹配度分析
- **教练技术** vs **领导力测评**：相关度中等（约0.4）
- 当前阈值设置：HIGH_MATCH > 0.7, MEDIUM_MATCH > 0.5
- 实际评分：0.39（低于MIN_MATCH=0.5）
- **结果**：触发了"无据转人工"逻辑

---

## 解决方案（三选一）

### 方案一：导入正确的知识库内容（推荐）⭐

**优点**：
- 准确匹配用户需求
- 回答质量最高
- 符合"基于知识库回答"的核心原则

**执行步骤**：
1. 准备领导力测评相关的Word文档（书籍、手册等）
2. 运行导入脚本：`python scripts/import_word.py --file assets/领导力测评书籍.docx`
3. 重新导入预设问题的答案到知识库（如果有答案文档）

**示例代码**：
```bash
# 导入领导力测评书籍
python scripts/import_word.py \
  --file assets/领导力测评指南.docx \
  --clean-header \
  --clean-footer

# 导入预设问题及答案（如果有答案文档）
python scripts/import_word.py \
  --file assets/预设问题及答案.docx
```

---

### 方案二：调整相关性阈值（临时方案）

**优点**：
- 快速见效
- 无需新增数据

**缺点**：
- 回答质量可能下降
- 可能出现"答非所问"的情况

**执行步骤**：
修改 `src/tools/knowledge_search_tool.py` 中的阈值：

```python
# 原始设置
THRESHOLDS = {
    "NO_MATCH": 0.0,      # 不匹配
    "LOW_MATCH": 0.5,     # 低匹配
    "MEDIUM_MATCH": 0.7,  # 中等匹配
    "HIGH_MATCH": 0.85,   # 高匹配
}

# 调整后（更宽松）
THRESHOLDS = {
    "NO_MATCH": 0.0,      # 不匹配
    "LOW_MATCH": 0.3,     # 低匹配（从0.5降到0.3）
    "MEDIUM_MATCH": 0.5,  # 中等匹配（从0.7降到0.5）
    "HIGH_MATCH": 0.7,    # 高匹配（从0.85降到0.7）
}

# 最小匹配分数
MIN_MATCH_SCORE = 0.3  # 从0.5降到0.3
```

**修改后效果**：
- 评分0.39会被判定为 `LOW_MATCH`，允许基于知识库回答
- 但需要接受回答可能不够精准的风险

---

### 方案三：混合方案（折中）

**优点**：
- 既能快速解决，又能保证质量

**缺点**：
- 需要分两步执行

**执行步骤**：
1. **短期**：调整阈值到0.3，让系统先能回答（方案二）
2. **长期**：导入正确的知识库内容（方案一）
3. **完成**：将阈值恢复到0.5，确保回答质量

---

## 推荐执行顺序

### 立即执行（方案三 - 第一步）
```bash
# 临时调整阈值
sed -i 's/"MIN_MATCH_SCORE": 0.5/"MIN_MATCH_SCORE": 0.3/' src/tools/knowledge_search_tool.py
sed -i 's/"LOW_MATCH": 0.5/"LOW_MATCH": 0.3/' src/tools/knowledge_search_tool.py
```

### 测试验证
```bash
# 运行测试
python -m pytest tests/test_agent.py -v
```

### 长期解决（方案一）
1. 准备领导力测评书籍文档
2. 运行导入脚本
3. 恢复阈值到原始设置

---

## 知识库导入最佳实践

### 准备工作
1. **文档格式**：Word (.docx) 或 纯文本 (.txt)
2. **内容质量**：
   - 章节结构清晰
   - 每个主题有完整描述
   - 包含理论+实践案例

3. **内容结构示例**：
   ```
   第一章 领导力基础理论
      1.1 什么是领导力
      1.2 领导力测评方法
      1.3 常见测评工具
   
   第二章 情境领导模型
      2.1 模型介绍
      2.2 四种领导风格
      2.3 应用场景案例
   ```

### 导入脚本使用
```bash
# 基础导入
python scripts/import_word.py \
  --file assets/领导力测评书籍.docx

# 完整清洗（去除页眉、页脚、页码）
python scripts/import_word.py \
  --file assets/领导力测评书籍.docx \
  --clean-header \
  --clean-footer \
  --clean-page-numbers

# 导入到指定集合（可选）
python scripts/import_word.py \
  --file assets/领导力测评书籍.docx \
  --collection leadership_assessment
```

---

## 验证知识库状态

### 检查知识库内容
```bash
# 查看已导入的文档
python -c "
from coze_coding_dev_sdk import KnowledgeBaseClient
kb = KnowledgeBaseClient()
docs = kb.list_documents()
print(f'知识库文档数量: {len(docs)}')
for doc in docs[:5]:
    print(f'- {doc[\"name\"]}: {doc[\"size\"]} bytes')
"
```

### 测试搜索功能
```bash
# 搜索测试
python -c "
from coze_coding_dev_sdk import KnowledgeBaseClient
kb = KnowledgeBaseClient()
results = kb.search('领导力测评', top_k=5)
for r in results:
    print(f'评分: {r[\"score\"]:.2f} | {r[\"content\"][:100]}...')
"
```

---

## 总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 预设问题全部转人工 | 知识库内容是"教练技术"，不是"领导力测评" | 方案一：导入正确的知识库内容 |
| 相关性评分0.39 | 内容不匹配 | 方案二：调整阈值到0.3 |
| 回答质量低 | 阈值过低 | 方案三：混合方案 |

**推荐方案**：方案三（混合方案）- 立即调整阈值，同时准备正确的内容导入。
