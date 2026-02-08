# 领导力测评与发展专家客服 Agent 使用指南

## 概述

本 Agent 是一个专业的领导力测评与发展智能客服系统，基于内置知识库提供权威的咨询服务，具备严格的边界控制和转人工能力。

## 核心功能

### 1. 智能问答
- 基于知识库内容提供专业、准确的解答
- 支持领导力测评、发展模型、组织行为学等领域问题
- 自动判断问题相关性，超出范围转人工

### 2. 边界控制
- **专业范围**：领导力测评工具、领导力发展模型、组织行为学、人才发展策略、情商领导力、变革管理、团队建设
- **转人工触发条件**：
  - 知识库中未找到相关内容（相关性评分 < 0.5）
  - 问题超出专业领域范围
  - 需要个性化深度分析的具体案例
  - 涉及不道德或不专业的内容

### 3. 短期记忆
- 保留最近 20 轮对话（40 条消息）
- 支持多轮上下文对话
- 滑动窗口机制，防止上下文过长

## 完整工作流程（SOP）

### 第一阶段：知识库准备

#### 步骤 1：准备书籍内容
由于您提到的是**书籍扫描版PDF（图片型）**，需要先将PDF转换为文本：

**方案 A：使用 OCR 工具**
```bash
# 如果您有PDF文件，使用OCR工具提取文本
# 例如使用 Tesseract OCR 或其他在线OCR服务
```

**方案 B：使用在线转换服务**
1. 访问在线PDF OCR转换网站（如 Smallpdf、PDF24等）
2. 上传扫描版PDF
3. 选择OCR选项（支持中文）
4. 下载转换后的文本文件（.txt格式）

#### 步骤 2：导入知识库
将书籍内容导入到知识库中：

**方式 1：使用命令行工具（推荐用于一次性导入）**

```bash
# 导入文本文件内容
coze-coding-ai knowledge add \
  --dataset "leadership_knowledge" \
  --content "$(cat /path/to/your/book.txt)"

# 或者分块导入（如果文件很大，建议分批导入）
# 方法：将大文件按章节或页码分割成多个小文件，逐个导入
coze-coding-ai knowledge add \
  --dataset "leadership_knowledge" \
  --content "$(cat /path/to/book_part1.txt)"

coze-coding-ai knowledge add \
  --dataset "leadership_knowledge" \
  --content "$(cat /path/to/book_part2.txt)"

# 继续导入其他部分...
```

**方式 2：使用Python脚本（推荐用于批量导入）**

创建一个导入脚本 `import_book.py`：

```python
from coze_coding_dev_sdk import KnowledgeClient, Config, KnowledgeDocument, DataSourceType, ChunkConfig

# 读取书籍文本文件
with open('/path/to/your/book.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# 初始化知识库客户端
config = Config()
client = KnowledgeClient(config=config)

# 创建文档
document = KnowledgeDocument(
    source=DataSourceType.TEXT,
    raw_data=content
)

# 配置分块参数（根据书籍内容调整）
chunk_config = ChunkConfig(
    separator="\n\n",  # 按段落分割
    max_tokens=2000,   # 每块最大2000 token
    remove_extra_spaces=True
)

# 导入到知识库
response = client.add_documents(
    documents=[document],
    table_name="leadership_knowledge",
    chunk_config=chunk_config
)

if response.code == 0:
    print(f"✅ 成功导入书籍！文档ID: {response.doc_ids}")
else:
    print(f"❌ 导入失败：{response.msg}")
```

运行导入脚本：
```bash
python import_book.py
```

#### 步骤 3：验证知识库导入
使用搜索命令验证内容是否成功导入：

```bash
coze-coding-ai knowledge search \
  --query "领导力测评" \
  --top-k 3
```

如果返回相关内容，说明导入成功！

---

### 第二阶段：使用 Agent

#### 启动 Agent
Agent 已经通过 `build_agent()` 方法构建完成，可以直接使用。

#### 测试问答

**测试 1：专业领域问题**
```
用户：领导力测评的主要方法有哪些？
```
期望行为：
- Agent 调用 `check_knowledge_relevance` 检查相关性
- Agent 调用 `search_leadership_knowledge` 搜索知识库
- 如果找到相关内容，返回专业解答
- 如果未找到内容，引导转人工

**测试 2：超出范围问题**
```
用户：如何学习编程？
```
期望行为：
- Agent 判断问题超出专业领域
- 直接返回转人工提示

**测试 3：模糊问题**
```
用户：我想提高我的领导能力
```
期望行为：
- Agent 检索知识库中关于领导力发展的内容
- 提供相关建议
- 如果内容有限，建议补充信息或转人工

---

## System Prompt 设计说明

### 角色定位
- **身份**：领导力测评与发展领域的资深专家顾问
- **语气**：专业、权威、友好
- **专业性**：基于知识库内容，不编造不臆测

### 工作流程
1. **问题分析**：理解用户需求，判断关键词
2. **知识库检索**：使用工具检查相关性和搜索内容
3. **内容组织**：基于检索结果，用专业易懂的语言组织回答
4. **边界控制**：超出范围时引导转人工

### 回答格式
**标准问答格式**：
```markdown
### 专业解答
【核心结论或回答】

### 知识依据
基于知识库内容：
- 【引用知识库关键信息】

### 详细说明
【展开解释核心概念或方法】

### 实践建议
1. 【可操作建议1】
2. 【可操作建议2】
3. 【可操作建议3】

### 注意事项
【重要提醒或注意事项】
```

**转人工格式**：
```markdown
### 服务说明
关于您的问题，经过检索，我的知识库中没有找到足够的相关信息。

### 原因说明
【说明为什么无法回答】

### 转接建议
建议您转接人工专家服务，获取更精准的个性化解答。请问您需要我为您安排转接吗？
```

---

## 配置参数说明

### 模型配置（config/agent_llm_config.json）
```json
{
  "config": {
    "model": "doubao-seed-1-6-251015",  // 均衡性能模型
    "temperature": 0.7,                  // 平衡创造性和准确性
    "top_p": 0.9,                        // 核采样参数
    "max_completion_tokens": 10000,      // 最大输出token数
    "timeout": 600,                      // 超时时间（秒）
    "thinking": "disabled"               // 禁用思考模式
  }
}
```

### 工具配置
- `search_leadership_knowledge`：知识库搜索工具
  - 参数：query（用户问题）
  - 返回：检索到的知识库内容片段（Top 5，相似度 ≥ 0.5）

- `check_knowledge_relevance`：相关性检查工具
  - 参数：query（用户问题）
  - 返回：相关性评分和匹配类型
    - HIGH_MATCH（≥ 0.7）：高质量匹配
    - MEDIUM_MATCH（0.5-0.7）：中等质量匹配
    - LOW_MATCH（< 0.5）：低质量匹配
    - NO_MATCH：无匹配

---

## 注意事项

### 1. 扫描版PDF处理
由于您的书籍是扫描版PDF（图片型），必须先进行OCR文字识别：
- 推荐使用支持中文的OCR工具
- 转换后检查文本质量，确保准确率
- 建议分章节导入，避免单次导入过大

### 2. 知识库优化
- **分块策略**：根据书籍内容调整 `max_tokens` 参数（推荐 1500-2000）
- **分割符**：使用段落分隔符 `\n\n` 以保持内容完整性
- **去重**：如果导入后发现重复内容，可重新导入并去重

### 3. 边界控制
- Agent 会自动判断问题相关性
- 评分低于 0.5 时自动触发转人工流程
- 建议定期审查转人工日志，优化知识库内容

### 4. 性能优化
- 首次导入大文件可能需要较长时间
- 搜索时设置合理的 `top_k` 和 `min_score`
- 如需加快响应速度，可降低 `top_k` 值

---

## 常见问题

### Q1：导入PDF后搜索不到内容怎么办？
**A：**
1. 检查PDF是否已转换为文本格式
2. 确认导入时没有报错
3. 尝试用书中关键词进行搜索测试
4. 检查分块参数是否合理

### Q2：Agent回答不准确怎么办？
**A：**
1. 检查知识库中是否有相关内容
2. 确认System Prompt是否准确传达了边界控制要求
3. 调整相关性评分阈值
4. 补充知识库内容

### Q3：如何添加更多书籍或资料？
**A：**
重复"知识库准备"阶段的步骤，导入新的文档即可。知识库会自动整合所有内容。

### Q4：如何判断是否需要转人工？
**A：**
Agent 会自动判断。您可以：
- 查看检索结果的相关性评分
- 检查转人工日志
- 根据业务需求调整转人工阈值

---

## 文件结构

```
.
├── config/
│   └── agent_llm_config.json          # Agent配置文件
├── src/
│   ├── agents/
│   │   └── agent.py                   # Agent核心代码
│   └── tools/
│       └── knowledge_search_tool.py   # 知识库搜索工具
└── docs/
    └── LEADERSHIP_AGENT_GUIDE.md      # 本使用指南
```

---

## 总结

本 Agent 具备以下核心能力：

✅ **专业咨询**：基于知识库提供权威的领导力测评与发展咨询服务
✅ **边界控制**：严格判断问题范围，超出范围自动转人工
✅ **智能检索**：向量语义搜索，精准定位相关内容
✅ **记忆能力**：保留20轮对话历史，支持多轮交互
✅ **规范回答**：统一的回答格式，专业且易懂

按照本指南完成知识库导入后，即可开始使用！
