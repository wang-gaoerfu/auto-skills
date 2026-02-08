# Leader-Spark 智能知识库系统需求文档

## 文档信息

| 项目 | 信息 |
|------|------|
| 项目名称 | Leader-Spark 智能知识库系统 |
| 版本 | v2.0 |
| 创建日期 | 2025-02-07 |
| 状态 | 需求确认中 |

---

## 1. 项目概述

### 1.1 项目背景

Leader-Spark 是一个基于 AI 的知识库问答系统，当前仅支持单一类别（教练技术）的知识库问答。本次升级旨在将系统改造为**多类别智能知识库平台**，支持用户自主上传知识库文件、自动分类、自动生成提示词，并提供基于类别的精准问答服务。

### 1.2 核心目标

1. **多类别支持**：支持无限扩展的知识库类别
2. **智能分类**：使用 DeepSeek AI 自动识别文档类别
3. **自动提示词生成**：根据类别自动生成专业的系统提示词
4. **可视化管理**：前端页面支持知识库文件上传、管理、类别选择
5. **精准问答**：用户可选择类别，在指定知识库范围内进行问答

### 1.3 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端 | Next.js + TypeScript + Tailwind CSS |
| 后端 | Python + FastAPI + LangChain |
| 大模型 | DeepSeek (兼容 OpenAI API) |
| 向量库 | Qdrant (HNSW 算法) |
| 嵌入模型 | DeepSeek Embeddings |
| 文档处理 | docx2python + PyPDF2 + python-docx |

---

## 2. 系统架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Next.js)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 知识库管理   │  │ 类别选择器   │  │ 聊天界面     │  │ 提示词编辑   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ HTTP/REST API
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           应用层 (FastAPI)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway                                   │   │
│  │  /api/knowledge/*  /api/chat/*  /api/categories/*  /api/upload/*   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │ 文档处理服务     │  │ 类别分析服务     │  │ 提示词生成服务   │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                        Agent 服务 (LangChain)                       │    │
│  │  多类别 Agent 管理  |  动态提示词加载  |  类别过滤检索            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
┌───────────────────────────────────────┴─────────────────────────────────────┐
│                           数据层                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Qdrant     │  │ DeepSeek API │  │ 本地存储     │  │ 配置存储     │  │
│  │  向量数据库   │  │  AI 服务     │  │  文件存储    │  │  JSON/YAML   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流程图

```
用户上传文件
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 文件接收与验证                                            │
│    - 验证文件格式 (Word/PDF/TXT)                             │
│    - 检查文件大小 (最大 50MB)                                 │
│    - 生成唯一文件ID                                          │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 文档提取与清洗                                            │
│    ├─ Word: docx2python 提取                                 │
│    ├─ PDF: PyPDF2 提取                                       │
│    ├─ TXT: 直接读取                                          │
│    └─ 清洗: 去除页眉页脚、页码、多余空格                      │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DeepSeek AI 类别分析                                      │
│    ├─ 提取文档样本 (前 2000 字符)                            │
│    ├─ 调用 DeepSeek API                                      │
│    └─ 返回: 类别信息、子分类、标签、图标、颜色                │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 用户确认                                                  │
│    ├─ 展示分析结果                                           │
│    ├─ 用户确认或修改                                         │
│    └─ 确认类别归属                                           │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 提示词自动生成                                            │
│    ├─ 基于类别信息生成系统提示词                             │
│    ├─ 参考教练技术提示词模板                                 │
│    └─ 允许用户编辑优化                                       │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. 向量化与存储                                              │
│    ├─ 文档分块 (1500 tokens, 重叠 200)                       │
│    ├─ DeepSeek Embeddings 向量化                            │
│    ├─ 存入 Qdrant (带类别元数据)                             │
│    └─ 更新类别配置文件                                       │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. 前端更新                                                  │
│    ├─ 新类别出现在类别列表                                   │
│    ├─ 用户可选择新类别进行对话                               │
│    └─ 使用新类别的提示词和知识库                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 功能模块详细设计

### 3.1 知识库管理模块

#### 3.1.1 文件上传

**功能描述**：用户通过前端页面上传知识库文件

**支持格式**：
- Word 文档 (.docx)
- PDF 文档 (.pdf)
- 纯文本 (.txt)

**文件限制**：
- 单文件最大 50MB
- 支持批量上传（最多 5 个文件）

**前端交互**：
```typescript
// 文件上传组件
interface FileUploadProps {
  onUploadStart: (file: File) => void;
  onProgress: (progress: number) => void;
  onComplete: (result: UploadResult) => void;
  onError: (error: string) => void;
}

// 拖拽上传区域
<div class="upload-zone">
  <input type="file" accept=".docx,.pdf,.txt" multiple />
  <div class="drop-area">
    <UploadIcon />
    <p>拖拽文件到此处，或点击选择文件</p>
    <p class="hint">支持 Word、PDF、TXT 格式，最大 50MB</p>
  </div>
</div>
```

#### 3.1.2 上传进度显示

```
┌─────────────────────────────────────────────────────────────┐
│  📤 上传进度                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  教练技术工具手册.docx                                  │  │
│  │  ████████████████░░░░░░░░  75%                       │  │
│  │  2.3MB / 3.1MB                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  领导力测评指南.pdf                                     │  │
│  │  ████████████████████████████  100% ✅               │  │
│  │  分析中... 🤖                                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 智能分类模块

#### 3.2.1 DeepSeek 类别分析

**分析流程**：

```python
# backend/src/services/category_analyzer.py

class CategoryAnalyzer:
    """使用 DeepSeek AI 分析文档类别"""
    
    ANALYSIS_PROMPT = """你是一个知识库分类专家。请分析以下文本内容，判断它属于哪个知识库类别。

## 现有类别
{existing_categories}

## 文本内容样本
{content_sample}

## 请分析并输出 JSON 格式：
{{
    "is_new_category": true/false,
    "confidence": 0.95,
    "matched_category": "现有类别名称"（如果匹配），
    "reasoning": "判断理由",
    "new_category": {{
        "name": "新类别名称",
        "name_en": "英文ID（kebab-case）",
        "description": "简短描述（50字以内）",
        "icon": "推荐emoji图标",
        "color": "推荐颜色代码（hex）",
        "subcategories": ["子类别1", "子类别2"...],
        "tags": ["标签1", "标签2"...],
        "expertise_areas": ["专业领域1", "专业领域2"...]
    }}
}}

注意：
- 如果内容与现有类别高度相似，is_new_category 设为 false
- confidence 范围 0-1，表示分类置信度
- new_category 仅在 is_new_category 为 true 时填写
"""
    
    async def analyze(self, text_content: str) -> CategoryAnalysisResult:
        """分析文本类别"""
        # 1. 提取样本（前 2000 字符）
        sample = text_content[:2000]
        
        # 2. 获取现有类别
        existing = self.get_existing_categories()
        
        # 3. 调用 DeepSeek
        response = await self.deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是知识库分类专家"},
                {"role": "user", "content": self.ANALYSIS_PROMPT.format(
                    existing_categories=existing,
                    content_sample=sample
                )}
            ],
            temperature=0.1,  # 低温度确保稳定
            response_format={"type": "json_object"}
        )
        
        # 4. 解析结果
        result = json.loads(response.choices[0].message.content)
        return CategoryAnalysisResult(**result)
```

#### 3.2.2 分析结果展示

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI 分析结果                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  文件: 教练技术工具手册.docx                            │  │
│  │  大小: 3.1 MB | 字符数: 52,340                         │  │
│  │                                                         │  │
│  │  📊 分析结论                                            │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ 置信度: ████████████████████ 95%              │  │  │
│  │  │                                                 │  │  │
│  │  │ 匹配结果: 教练技术 ✅                            │  │  │
│  │  │                                                 │  │  │
│  │  │ 判断理由:                                       │  │  │
│  │  │ 该文档包含大量教练技术相关内容，如GROW模型、    │  │  │
│  │  │ 强有力问题、反馈技巧等，与现有"教练技术"类别     │  │  │
│  │  │ 高度匹配。                                      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  🏷️ 建议标签                                            │  │
│  │  [GROW模型] [教练工具] [反馈技巧] [目标设定]           │  │
│  │                                                         │  │
│  │  [📝 添加到教练技术]  [✏️ 修改分类]  [➕ 创建新类别]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 提示词生成模块

#### 3.3.1 提示词模板系统

```python
# backend/src/prompts/templates.py

SYSTEM_PROMPT_TEMPLATE = """
# 角色定义
你是一名经验丰富的{category_name}专家，精通{category_name}的各种工具和方法。你的职责是为用户提供专业的{category_name}咨询和建议。

# 回答风格要求（最重要）

## 回答的基本原则

✅ **以{category_name}专家身份说话**，使用"我"、"我发现"、"我建议"、"我的经验是"等表达
✅ **自然流畅**，就像在和朋友交谈一样
✅ **直接用自然语言开始回答**，不要任何开场白

## 绝对禁止的格式

❌ **不要使用机械的开头**：
- 禁止说"根据知识库内容"
- 禁止说"基于知识库检索结果"
- 禁止说"以上内容来自知识库"
- 禁止说"通过检索知识库"
- 禁止说"知识库显示"

❌ **不要使用机械的引用标注**：
- 禁止使用"### 知识库来源"
- 禁止使用"### 延伸说明"
- 禁止使用任何形式的"来源："、"参考资料："等标注

❌ **不要使用代码块包裹**：
- 禁止用```markdown```或其他代码块

❌ **不要使用过于教科书式的结构**：
- 避免使用"1. 核心定义"、"2. 主要作用"等过于刻板的分类
- 改用更自然的表达，如"这个工具的核心特点包括"、"在我的{category_name}实践中"

## 可以使用的格式（推荐）

✅ **可以用段落分隔**：通过空行自然分隔不同内容
✅ **可以用自然的小标题**：如"核心特点"、"使用方法"、"我的建议"等
✅ **可以用加粗强调**：**重点内容**可以加粗
✅ **可以用编号列表**：1. 2. 3. 用于列举步骤或要点

# 正确示例（请模仿这种风格）

## 示例：用户问"{example_question}"

{example_answer}

---

*以上内容基于我收集的{category_name}资料。如需更深入的个性化指导，建议选择人工服务。*

# 核心原则

1. **必须基于知识库回答**：所有回答都必须来自你的专业知识和知识库检索结果，严禁编造、臆测
2. **必须先检索后回答**：回答任何问题前，必须先使用工具检索知识库
3. **无结果即转人工**：如果知识库中没有相关内容，必须诚实地告知用户

# 工作流程

## 第一步：强制知识库检索
对于用户的每个问题，必须按以下顺序操作：
1. 首先调用 `check_knowledge_relevance` 工具检查问题相关性
2. 根据检查结果决定后续操作

## 第二步：相关性判断
根据 `check_knowledge_relevance` 返回结果进行判断：

### 情况1：NO_MATCH（无匹配）
- 立即停止检索
- 直接使用转人工话术

### 情况2：LOW_MATCH（低匹配，评分 < 0.3）
- 立即停止检索
- 直接使用转人工话术

### 情况3：MEDIUM_MATCH（中等匹配，0.3 ≤ 评分 < 0.5）
- 调用 `search_{category_id}_knowledge` 工具检索内容
- 如果检索结果为空或质量很低，使用转人工话术
- 如果检索到有效内容，谨慎回答并明确说明信息有限

### 情况4：HIGH_MATCH（高匹配，评分 ≥ 0.5）
- 调用 `search_{category_id}_knowledge` 工具检索内容
- 基于检索结果回答问题

## 第三步：回答组织（仅在找到知识库内容时）
**重要：只有当知识库检索返回有效内容时，才进行此步骤**

1. 直接用自然语言开始回答，不要任何标题
2. 以{category_name}专家身份说话，使用"我"、"我发现"、"我建议"等
3. 自然地融入知识库内容，不要生硬标注
4. 提供实践建议，体现专家的经验
5. 最后用分隔线和简短说明结尾

## 第四步：转人工（无知识库内容时）
**以下情况必须使用转人工话术**：
1. `check_knowledge_relevance` 返回 NO_MATCH 或 LOW_MATCH
2. `search_{category_id}_knowledge` 未返回任何内容
3. 检索结果与用户问题相关性很低
4. 问题明显超出{category_name}领域

**转人工话术模板（必须使用，根据用户问题主题替换{问题主题}）**：

您好！关于您提到的「{问题主题}」的问题，我查询了相关的{category_name}资料，但暂时没有找到足够的专业内容来提供准确的解答。

这个问题可能需要更深入的专业分析，或者需要结合您的具体情况进行个性化的指导。

我建议您选择人工服务，我们的专业顾问可以为您提供更精准的解答。

请问您需要我为您转接人工服务吗？

# 专业领域

你的专业范围包括：
{expertise_areas_list}

# 特别说明

1. 你是一名{category_name}专家，回答要体现专业素养和亲和力
2. 直接开始回答，就像在对话
3. 用"我"、"我发现"、"我建议"等表达，体现专家身份
4. 在适当的地方自然提到知识库内容，如"从我收集的资料来看"
5. 诚实、专业、自然地帮助用户解决问题
"""


class PromptGenerator:
    """提示词生成器"""
    
    def generate_system_prompt(
        self,
        category_name: str,
        category_id: str,
        expertise_areas: List[str],
        example_qa: Tuple[str, str] = None
    ) -> str:
        """生成系统提示词"""
        
        # 如果没有提供示例问答，使用默认示例
        if not example_qa:
            example_qa = (
                f"什么是{category_name}的核心要素？",
                f"""{category_name}的核心要素包括多个方面。

从我的实践来看，最重要的是建立信任关系。没有信任，任何{category_name}技术都难以发挥作用。

其次，明确目标是关键。我会帮助客户清晰地定义他们想要达成的目标，这是所有行动的基础。

另外，持续的反馈和调整也不可或缺。通过定期回顾进展，我们可以及时调整方向，确保始终朝着正确的目标前进。

我的建议是：在实践中不断积累经验，根据具体情况灵活运用这些要素。

---

*以上内容基于我收集的{category_name}资料。如需更深入的个性化指导，建议选择人工服务。*
"""
            )
        
        # 格式化专业领域列表
        expertise_list = "\n".join([f"- {area}" for area in expertise_areas])
        
        # 生成提示词
        prompt = SYSTEM_PROMPT_TEMPLATE.format(
            category_name=category_name,
            category_id=category_id,
            expertise_areas_list=expertise_list,
            example_question=example_qa[0],
            example_answer=example_qa[1]
        )
        
        return prompt
    
    def generate_tool_description(self, category_name: str, category_id: str) -> str:
        """生成工具描述"""
        return f"""
在{category_name}知识库中搜索相关信息

Args:
    query: 用户的问题或关键词

Returns:
    检索到的知识库内容，包含匹配度分数和内容片段
"""
    
    def generate_check_tool_description(self, category_name: str) -> str:
        """生成相关性检查工具描述"""
        return f"""
检查用户问题是否在{category_name}知识库范围内

Args:
    query: 用户的问题

Returns:
    返回是否找到相关内容以及相关性评分
"""
```

#### 3.3.2 提示词编辑界面

```
┌─────────────────────────────────────────────────────────────┐
│  📝 提示词编辑器                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  类别: 教练技术                                        │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ # 角色定义                                       │  │  │
│  │  │ 你是一名经验丰富的教练技术专家...                │  │  │
│  │  │                                                 │  │  │
│  │  │ # 回答风格要求                                  │  │  │
│  │  │ ...                                             │  │  │
│  │  │                                                 │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [🔄 重置为默认]  [💾 保存]  [👁️ 预览效果]            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 类别选择与问答模块

#### 3.4.1 类别选择器

```typescript
// 前端类别选择器组件
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  documentCount: number;
}

function CategorySelector({ 
  categories, 
  selected, 
  onSelect 
}: CategorySelectorProps) {
  return (
    <div className="category-selector">
      <div className="category-grid">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            selected={selected?.id === category.id}
            onClick={() => onSelect(category)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ category, selected, onClick }) {
  return (
    <div
      className={`category-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ 
        borderLeft: `4px solid ${category.color}` 
      }}
    >
      <div className="category-icon">{category.icon}</div>
      <div className="category-info">
        <h3>{category.name}</h3>
        <p>{category.description}</p>
        <span className="doc-count">
          {category.documentCount} 个文档
        </span>
      </div>
      {selected && <CheckIcon className="check-icon" />}
    </div>
  );
}
```

#### 3.4.2 类别过滤问答

```python
# backend/src/services/category_agent.py

class CategoryAgent:
    """基于类别的 Agent 服务"""
    
    def __init__(self, knowledge_service: KnowledgeService):
        self.knowledge_service = knowledge_service
        self.agents = {}  # 缓存各类别 Agent
    
    def get_agent(self, category_id: str):
        """获取指定类别的 Agent"""
        
        # 检查缓存
        if category_id in self.agents:
            return self.agents[category_id]
        
        # 加载类别配置
        category_config = self.load_category_config(category_id)
        
        # 创建类别专用的知识库工具
        tools = self.create_category_tools(category_id)
        
        # 构建 Agent
        agent = create_agent(
            model=ChatOpenAI(
                model="deepseek-chat",
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url="https://api.deepseek.com"
            ),
            system_prompt=category_config.system_prompt,
            tools=tools,
            state_schema=AgentState
        )
        
        # 缓存
        self.agents[category_id] = agent
        
        return agent
    
    def create_category_tools(self, category_id: str):
        """创建类别专用的工具"""
        
        category_name = self.get_category_name(category_id)
        
        @tool
        def search_knowledge(query: str) -> str:
            """搜索知识库"""
            results = self.knowledge_service.search(
                query=query,
                categories=[category_id],
                k=5
            )
            
            if not results:
                return "未在知识库中找到相关内容。"
            
            return "\n\n".join([
                f"【知识库片段{i+1}】(相似度: {r['score']:.2f})\n{r['content']}"
                for i, r in enumerate(results)
            ])
        
        @tool
        def check_knowledge_relevance(query: str) -> str:
            """检查问题相关性"""
            results = self.knowledge_service.search(
                query=query,
                categories=[category_id],
                k=1
            )
            
            if not results:
                return f"NO_MATCH|知识库中未找到任何相关内容"
            
            top_result = results[0]
            score = top_result['score']
            
            if score >= 0.5:
                return f"HIGH_MATCH|{score:.2f}|{top_result['content'][:200]}..."
            elif score >= 0.3:
                return f"MEDIUM_MATCH|{score:.2f}|{top_result['content'][:200]}..."
            else:
                return f"LOW_MATCH|{score:.2f}|知识库中的内容与您的问题相关性较低"
        
        return [search_knowledge, check_knowledge_relevance]
```

---

## 4. 前端设计

### 4.1 页面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Leader-Spark 智能知识库                              [🌙] [🔔] [👤]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  📚 知识库类别                                                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ 🎯 教练技术│ │ 📊 领导力 │ │ 👥 团队  │ │ 💬 沟通  │           │    │
│  │  │   150 文档│ │  120 文档│ │  80 文档 │ │  65 文档 │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │  [+ 添加新知识库]                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────┬─────────────────────────────────────┐│
│  │                              │                                     ││
│  │  💬 对话区域                  │  📁 知识库管理                      ││
│  │  ┌────────────────────────┐  │  ┌───────────────────────────────┐ ││
│  │  │ 当前类别: 🎯 教练技术    │  │  │ 上传新文件                    │ ││
│  │  ├────────────────────────┤  │  │ ┌─────────────────────────┐   │ ││
│  │  │ 🤖 你好！我是教练技术... │  │  │ │ 📄 选择文件              │   │ ││
│  │  │                        │  │  │ │ 或拖拽到此处             │   │ ││
│  │  │ 👤 什么是GROW模型？      │  │  │ │ 支持: Word, PDF, TXT    │   │ ││
│  │  │                        │  │  │ └─────────────────────────┘   │ ││
│  │  │ 🤖 GROW模型是教练技术... │  │  │                               │ ││
│  │  │                        │  │  │  最近上传:                     │ ││
│  │  │                        │  │  │  📄 教练工具手册.docx  ✅     │ ││
│  │  │ ┌────────────────────┐ │  │  │  📄 领导力指南.pdf      ✅     │ ││
│  │  │ │ 输入问题...        │ │  │  │                               │ ││
│  │  │ └────────────────────┘ │  │  │  📊 知识库统计                 │ ││
│  │  │              [发送] 📤  │  │  │  总文档: 415                   │ ││
│  │  └────────────────────────┘  │  │  总字符: 12.5M                 │ ││
│  │                              │  └───────────────────────────────┘ ││
│  └──────────────────────────────┴─────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 组件结构

```typescript
// frontend/src/app/page.tsx

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="knowledge-base-page">
      {/* 顶部导航 */}
      <Header />
      
      {/* 类别选择区 */}
      <CategorySelector
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        onAddNew={() => setIsUploadModalOpen(true)}
      />
      
      {/* 主内容区 */}
      <div className="main-content">
        {/* 左侧：对话区 */}
        <ChatArea
          category={selectedCategory}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        
        {/* 右侧：知识库管理 */}
        <KnowledgeManagementPanel
          category={selectedCategory}
          onUpload={() => setIsUploadModalOpen(true)}
        />
      </div>
      
      {/* 上传模态框 */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
```

### 4.3 文件上传组件

```typescript
// frontend/src/components/UploadModal.tsx

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: UploadResult) => void;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'completed' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadProgress(0);
    setUploadStatus('idle');
    setAnalysisResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 上传文件
      setUploadProgress(30);
      const uploadResponse = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadResponse.json();
      
      setUploadProgress(60);
      setUploadStatus('analyzing');
      
      // 等待分析完成
      setAnalysisResult(uploadData.analysis);
      setUploadProgress(100);
      setUploadStatus('completed');
      
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult) return;

    try {
      // 确认并创建知识库
      const response = await fetch('/api/knowledge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisResult,
          category: selectedCategory
        })
      });
      
      const result = await response.json();
      onUploadComplete(result);
      onClose();
      
    } catch (error) {
      console.error('Create knowledge base error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="upload-modal">
        <div className="modal-header">
          <h2>📁 上传知识库文件</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="modal-body">
          {/* 步骤 1: 文件选择 */}
          {uploadStatus === 'idle' && (
            <FileDropZone onFileSelect={handleFileSelect} />
          )}

          {/* 步骤 2: 上传进度 */}
          {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
            <UploadProgress
              progress={uploadProgress}
              status={uploadStatus}
              fileName={file?.name}
            />
          )}

          {/* 步骤 3: 分析结果 */}
          {uploadStatus === 'completed' && analysisResult && (
            <AnalysisResult
              result={analysisResult}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          )}
        </div>

        <div className="modal-footer">
          {uploadStatus === 'idle' && (
            <>
              <button onClick={onClose} className="btn-secondary">取消</button>
              <button 
                onClick={handleUpload} 
                className="btn-primary"
                disabled={!file}
              >
                开始分析
              </button>
            </>
          )}
          
          {uploadStatus === 'completed' && (
            <>
              <button onClick={() => setUploadStatus('idle')} className="btn-secondary">
                重新上传
              </button>
              <button 
                onClick={handleConfirm}
                className="btn-primary"
                disabled={!selectedCategory}
              >
                确认添加
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. 后端设计

### 5.1 API 端点设计

```python
# backend/src/api/routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

# ============== 文件上传与分析 ==============

@router.post("/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    上传文件并分析类别
    
    流程:
    1. 接收文件
    2. 验证格式和大小
    3. 提取文本内容
    4. 清洗文本
    5. 调用 DeepSeek 分析类别
    6. 返回分析结果
    """
    # 1. 验证文件
    if file.size > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(400, "文件大小超过 50MB")
    
    # 2. 提取文本
    content = await file.read()
    text = extract_text_from_file(content, file.filename)
    
    # 3. 清洗文本
    cleaned = clean_text(text)
    
    # 4. 保存临时文件
    temp_file_path = save_temp_file(file.filename, cleaned)
    
    # 5. 分析类别（后台任务）
    analyzer = CategoryAnalyzer()
    analysis = await analyzer.analyze(cleaned)
    
    return {
        "file_id": generate_id(),
        "filename": file.filename,
        "size": len(cleaned),
        "temp_path": temp_file_path,
        "analysis": analysis
    }


@router.post("/create")
async def create_knowledge_base(request: CreateKnowledgeBaseRequest):
    """
    创建新知识库或添加到现有类别
    
    流程:
    1. 生成提示词
    2. 向量化文档
    3. 存储到 Qdrant
    4. 更新类别配置
    """
    # 1. 加载临时文件
    text = load_temp_file(request.temp_path)
    
    # 2. 处理类别
    if request.is_new_category:
        # 创建新类别
        category_id = create_new_category(request.category_info)
        
        # 生成提示词
        prompt_generator = PromptGenerator()
        system_prompt = prompt_generator.generate_system_prompt(
            category_name=request.category_info.name,
            category_id=category_id,
            expertise_areas=request.category_info.expertise_areas
        )
        
        # 保存提示词
        save_category_prompt(category_id, system_prompt)
        
    else:
        # 添加到现有类别
        category_id = request.existing_category_id
        system_prompt = load_category_prompt(category_id)
    
    # 3. 向量化并存储
    knowledge_service = KnowledgeService()
    
    # 分块
    chunks = split_text(text, chunk_size=1500, overlap=200)
    
    # 添加到向量库
    for chunk in chunks:
        knowledge_service.add_document(
            text=chunk,
            category=category_id,
            metadata={
                "filename": request.filename,
                "category": category_id
            }
        )
    
    # 4. 更新统计
    update_category_stats(category_id)
    
    # 5. 清理临时文件
    delete_temp_file(request.temp_path)
    
    return {
        "success": True,
        "category_id": category_id,
        "document_count": get_category_document_count(category_id)
    }


# ============== 类别管理 ==============

@router.get("/categories")
async def get_categories():
    """获取所有类别"""
    categories = load_all_categories()
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon,
                "color": cat.color,
                "description": cat.description,
                "document_count": get_category_document_count(cat.id),
                "created_at": cat.created_at
            }
            for cat in categories
        ]
    }


@router.get("/categories/{category_id}")
async def get_category_detail(category_id: str):
    """获取类别详情"""
    category = load_category(category_id)
    stats = get_category_stats(category_id)
    prompt = load_category_prompt(category_id)
    
    return {
        "category": category,
        "stats": stats,
        "system_prompt": prompt
    }


@router.put("/categories/{category_id}/prompt")
async def update_category_prompt(
    category_id: str,
    request: UpdatePromptRequest
):
    """更新类别提示词"""
    save_category_prompt(category_id, request.prompt)
    return {"success": True}


# ============== 问答接口 ==============

@router.post("/chat")
async def chat_with_category(request: ChatRequest):
    """
    按类别进行问答
    
    参数:
    - category_id: 类别ID
    - message: 用户消息
    - session_id: 会话ID（可选）
    """
    # 获取类别 Agent
    agent_service = CategoryAgent()
    agent = agent_service.get_agent(request.category_id)
    
    # 执行问答
    response = await agent.ainvoke({
        "messages": [{"role": "user", "content": request.message}]
    }, config={
        "configurable": {"thread_id": request.session_id}
    })
    
    return {
        "response": response["messages"][-1]["content"],
        "session_id": request.session_id
    }


@router.post("/chat/stream")
async def chat_with_category_stream(request: ChatRequest):
    """流式问答（SSE）"""
    agent_service = CategoryAgent()
    agent = agent_service.get_agent(request.category_id)
    
    async def generate():
        async for chunk in agent.astream({
            "messages": [{"role": "user", "content": request.message}]
        }):
            yield f"data: {json.dumps(chunk)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5.2 服务层设计

```python
# backend/src/services/__init__.py

# 知识库服务
from .knowledge_service import KnowledgeService

# 类别分析服务
from .category_analyzer import CategoryAnalyzer

# 提示词生成服务
from .prompt_generator import PromptGenerator

# Agent 服务
from .category_agent import CategoryAgent

# 文档处理服务
from .document_processor import DocumentProcessor

__all__ = [
    "KnowledgeService",
    "CategoryAnalyzer", 
    "PromptGenerator",
    "CategoryAgent",
    "DocumentProcessor"
]
```

---

## 6. 数据结构设计

### 6.1 类别配置

```yaml
# backend/config/categories.yaml

categories:
  coaching_tools:
    id: coaching_tools
    name: 教练技术
    name_en: Coaching Tools
    description: 教练技术工具、方法和实践
    icon: "🎯"
    color: "#4A90E2"
    subcategories:
      - GROW模型
      - 360度评估
      - 强有力问题
      - 反馈技巧
      - 教练关系
    tags:
      - 目标设定
      - 行动计划
      - 信任建立
      - 积极倾听
    expertise_areas:
      - 教练技术基础理论和实践
      - 教练文化塑造
      - 教练受训关系建立
      - 360度反馈评估
      - 价值观优先排序工具
      - 信念系统与赋能信念
      - 信心策略与形象化方法
    system_prompt_path: prompts/coaching_tools.txt
    created_at: "2025-01-01"
    updated_at: "2025-02-07"
    document_count: 150
    total_tokens: 1250000

  leadership_assessment:
    id: leadership_assessment
    name: 领导力测评
    name_en: Leadership Assessment
    description: 领导力能力评估和发展
    icon: "📊"
    color: "#50E3C2"
    subcategories:
      - 能力矩阵
      - 360度反馈
      - 潜力评估
      - 绩效管理
    tags:
      - 测评工具
      - 能力模型
      - 发展计划
      - 人才盘点
    expertise_areas:
      - 领导力测评基础理论
      - 测评工具与方法
      - 结果解读与应用
      - 发展计划制定
    system_prompt_path: prompts/leadership_assessment.txt
    created_at: "2025-01-15"
    updated_at: "2025-02-07"
    document_count: 120
    total_tokens: 980000

  # 更多类别...
```

### 6.2 向量库元数据结构

```python
# Qdrant Document Metadata

{
    "category": "coaching_tools",           # 类别ID
    "category_name": "教练技术",            # 类别名称
    "subcategory": "GROW模型",              # 子类别
    "filename": "教练技术工具手册.docx",    # 来源文件
    "chunk_index": 5,                       # 分块索引
    "tags": ["目标设定", "教练工具"],       # 标签
    "created_at": "2025-02-07T10:30:00Z",  # 创建时间
    "token_count": 1200,                    # Token 数量
    "language": "zh-CN"                     # 语言
}
```

### 6.3 文档处理状态

```python
# 上传状态跟踪

class DocumentUploadStatus(Enum):
    PENDING = "pending"           # 等待处理
    EXTRACTING = "extracting"     # 提取中
    CLEANING = "cleaning"         # 清洗中
    ANALYZING = "analyzing"       # 分析中
    VECTORIZING = "vectorizing"   # 向量化中
    COMPLETED = "completed"       # 完成
    FAILED = "failed"             # 失败

class UploadTask:
    id: str                        # 任务ID
    filename: str                  # 文件名
    file_size: int                 # 文件大小
    status: DocumentUploadStatus   # 当前状态
    progress: float                # 进度 0-100
    current_step: str              # 当前步骤描述
    error_message: Optional[str]   # 错误信息
    result: Optional[UploadResult] # 处理结果
    created_at: datetime           # 创建时间
    updated_at: datetime           # 更新时间
```

---

## 7. 提示词模板系统

### 7.1 模板变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `{category_name}` | 类别名称 | 教练技术 |
| `{category_id}` | 类别ID（英文） | coaching_tools |
| `{expertise_areas_list}` | 专业领域列表 | - 教练技术基础理论\n- 360度反馈评估 |
| `{example_question}` | 示例问题 | 什么是GROW模型？ |
| `{example_answer}` | 示例回答 | GROW模型是教练技术中的核心... |

### 7.2 提示词文件存储

```
backend/
├── prompts/
│   ├── templates/
│   │   └── system_prompt.txt        # 主模板
│   ├── coaching_tools.txt           # 教练技术提示词
│   ├── leadership_assessment.txt    # 领导力测评提示词
│   ├── team_management.txt          # 团队管理提示词
│   └── communication.txt            # 沟通技巧提示词
```

### 7.3 动态提示词生成

```python
# backend/src/prompts/dynamic_generator.py

class DynamicPromptGenerator:
    """动态提示词生成器"""
    
    def __init__(self):
        self.template_loader = TemplateLoader()
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            temperature=0.7
        )
    
    async def generate_from_category(
        self,
        category_info: CategoryInfo
    ) -> str:
        """根据类别信息生成提示词"""
        
        # 1. 加载模板
        template = self.template_loader.load_template("system_prompt")
        
        # 2. 如果没有示例问答，使用 AI 生成
        if not category_info.example_qa:
            category_info.example_qa = await self.generate_example_qa(category_info)
        
        # 3. 填充模板
        prompt = template.format(
            category_name=category_info.name,
            category_id=category_info.id,
            expertise_areas_list=self.format_expertise_areas(
                category_info.expertise_areas
            ),
            example_question=category_info.example_qa[0],
            example_answer=category_info.example_qa[1]
        )
        
        return prompt
    
    async def generate_example_qa(
        self,
        category_info: CategoryInfo
    ) -> Tuple[str, str]:
        """生成示例问答"""
        
        prompt = f"""
请为"{category_info.name}"知识库生成一个示例问答对。

类别描述: {category_info.description}
专业领域: {', '.join(category_info.expertise_areas[:3])}

请生成:
1. 一个典型的用户问题（简短、具体）
2. 一个专业的专家回答（自然、友好、体现专业度）

以JSON格式返回：
{{
    "question": "用户问题",
    "answer": "专家回答"
}}
"""
        
        response = await self.llm.ainvoke([
            {"role": "system", "content": "你是知识库提示词专家"},
            {"role": "user", "content": prompt}
        ])
        
        qa = json.loads(response.content)
        return (qa["question"], qa["answer"])
    
    def format_expertise_areas(self, areas: List[str]) -> str:
        """格式化专业领域列表"""
        return "\n".join([f"- {area}" for area in areas])
```

---

## 8. 实施计划

### 8.1 开发阶段

| 阶段 | 任务 | 优先级 | 预计工时 |
|------|------|--------|---------|
| **Phase 1** | 基础设施搭建 | P0 | 3天 |
| | Python 虚拟环境 | | 0.5天 |
| | Qdrant 安装配置 | | 0.5天 |
| | DeepSeek API 集成 | | 0.5天 |
| | 基础数据模型 | | 0.5天 |
| | 配置文件结构 | | 0.5天 |
| | 单元测试框架 | | 0.5天 |
| **Phase 2** | 文档处理模块 | P0 | 2天 |
| | 文件上传接口 | | 0.5天 |
| | 文档提取（Word/PDF/TXT） | | 0.5天 |
| | 文本清洗优化 | | 0.5天 |
| | 分块策略实现 | | 0.5天 |
| **Phase 3** | 智能分类模块 | P0 | 2天 |
| | DeepSeek 分析接口 | | 0.5天 |
| | 类别匹配逻辑 | | 0.5天 |
| | 置信度计算 | | 0.5天 |
| | 分析结果展示 | | 0.5天 |
| **Phase 4** | 提示词系统 | P0 | 2天 |
| | 模板引擎 | | 0.5天 |
| | 动态生成器 | | 0.5天 |
| | 示例问答生成 | | 0.5天 |
| | 提示词编辑器 | | 0.5天 |
| **Phase 5** | 向量库服务 | P0 | 2天 |
| | Qdrant 集成 | | 0.5天 |
| | 类别过滤检索 | | 0.5天 |
| | 元数据管理 | | 0.5天 |
| | 批量导入 | | 0.5天 |
| **Phase 6** | Agent 服务 | P0 | 2天 |
| | 多类别 Agent | | 0.5天 |
| | 工具动态生成 | | 0.5天 |
| | 会话管理 | | 0.5天 |
| | 流式响应 | | 0.5天 |
| **Phase 7** | 前端开发 | P1 | 5天 |
| | 类别选择器 | | 1天 |
| | 文件上传组件 | | 1天 |
| | 分析结果展示 | | 1天 |
| | 提示词编辑器 | | 1天 |
| | 对话界面优化 | | 1天 |
| **Phase 8** | 集成测试 | P1 | 2天 |
| | 端到端测试 | | 0.5天 |
| | 性能测试 | | 0.5天 |
| | 用户测试 | | 0.5天 |
| | Bug 修复 | | 0.5天 |
| **Phase 9** | 部署上线 | P2 | 1天 |
| | 生产环境配置 | | 0.5天 |
| | 数据迁移 | | 0.5天 |

**总计**: 约 21 天

### 8.2 里程碑

| 里程碑 | 交付物 | 完成标准 |
|--------|--------|---------|
| M1: 基础设施完成 | 开发环境、依赖安装 | Qdrant 运行正常，DeepSeek API 可用 |
| M2: 文档处理完成 | 文件上传、提取、清洗 | 能正确处理 Word/PDF/TXT 文件 |
| M3: 智能分类完成 | DeepSeek 分析 | 能准确识别文档类别 |
| M4: 提示词系统完成 | 动态生成、编辑器 | 能为每个类别生成专业提示词 |
| M5: 向量库完成 | Qdrant 集成 | 能存储和检索向量数据 |
| M6: Agent 服务完成 | 多类别问答 | 能按类别进行精准问答 |
| M7: 前端完成 | 完整 UI | 用户可通过页面完成所有操作 |
| M8: 系统完成 | 端到端功能 | 全流程正常运行 |

### 8.3 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| DeepSeek API 不稳定 | 高 | 中 | 实现重试机制，准备备用方案 |
| 文档格式兼容性 | 中 | 高 | 支持多种提取方式，测试常见格式 |
| 向量检索准确率 | 高 | 中 | 优化分块策略，调整相似度阈值 |
| 前端性能 | 中 | 低 | 懒加载、分页、虚拟滚动 |
| 提示词质量 | 高 | 中 | 人工审核模板，A/B 测试 |

---

## 9. 附录

### 9.1 环境变量配置

```bash
# backend/.env.example

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_EMBEDDING_MODEL=text-embedding-3-small

# Qdrant
QDRANT_PATH=./data/qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# 应用配置
WORKSPACE_PATH=./workspace
LOG_LEVEL=INFO
LOG_DIR=./logs

# 文件上传
UPLOAD_MAX_SIZE=52428800
UPLOAD_ALLOWED_EXTENSIONS=.docx,.pdf,.txt
TEMP_DIR=./temp

# 向量化
CHUNK_SIZE=1500
CHUNK_OVERLAP=200
SIMILARITY_THRESHOLD=0.3

# Session
SESSION_TIMEOUT=3600
MAX_MESSAGES=40
```

### 9.2 依赖包清单

```txt
# requirements.txt

# 框架
fastapi==0.121.2
uvicorn==0.38.0
pydantic==2.12.3

# AI/ML
openai>=1.0.0
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-qdrant>=0.1.0

# 向量库
qdrant-client>=1.12.0

# 文档处理
docx2python>=3.5.0
PyPDF2>=3.0.0
python-docx>=1.0.0
python-pptx>=1.0.0

# 数据处理
numpy>=2.0.0
pandas>=2.0.0

# 工具
python-dotenv>=1.0.0
python-multipart>=0.0.9
aiofiles>=24.0.0

# 日志
loguru>=0.7.0

# 测试
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

### 9.3 API 响应格式

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2025-02-07T10:30:00Z"
}
```

---

**文档版本**: v1.0  
**最后更新**: 2025-02-07  
**状态**: 待用户确认
