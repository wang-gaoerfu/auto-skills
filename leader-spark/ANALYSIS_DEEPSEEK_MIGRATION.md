# Leader-Spark 系统改造需求分析

## 1. 理解需求

### 1.1 项目概述
Leader-Spark 是一个从 Coze 平台下载的知识库系统，包含前端（Next.js）和后端（Python FastAPI）两个工程。当前系统使用豆包大模型，需要改造为使用 DeepSeek 大模型，并移除所有 Coze 相关依赖。

### 1.2 改造目标
1. 将大模型从豆包（doubao）替换为 DeepSeek
2. 移除所有 Coze 平台相关的依赖包
3. 在后端工程目录下创建 Python 虚拟环境（不使用全局安装）
4. 保持系统功能完整性，确保知识库搜索功能正常

---

## 2. 当前系统架构分析

### 2.1 后端架构
```
backend/
├── src/
│   ├── main.py                 # FastAPI 主入口
│   ├── agents/
│   │   └── agent.py            # Agent 构建逻辑（使用 LangChain）
│   ├── tools/
│   │   └── knowledge_search_tool.py  # 知识库搜索工具
│   ├── utils/
│   │   ├── openai/handler.py   # OpenAI 兼容接口
│   │   ├── log/loop_trace.py   # Coze Loop 追踪
│   │   └── helper/agent_helper.py
│   ├── storage/
│   │   ├── s3/s3_storage.py    # S3 存储（使用 Coze 身份认证）
│   │   └── database/db.py      # 数据库（使用 Coze 客户端）
│   └── graphs/                 # LangGraph 工作流
├── config/
│   └── agent_llm_config.json   # LLM 配置（豆包模型）
└── requirements.txt            # Python 依赖
```

### 2.2 前端架构
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx            # 主页面（聊天界面）
│   │   └── api/chat/route.ts   # 后端 API 代理
│   └── components/ui/          # UI 组件
```

---

## 3. 需要修改的内容和代码位置

### 3.1 Python 依赖包修改

**文件位置**: `backend/requirements.txt`

#### 需要移除的 Coze 相关包：
```
coze-coding-dev-sdk==0.5.8
coze-coding-utils==0.2.4
coze-workload-identity==0.1.4
cozeloop==0.1.25
```

#### 需要添加的 DeepSeek 包：
```
openai>=1.0.0           # DeepSeek 兼容 OpenAI API
python-dotenv>=1.0.0    # 环境变量管理
```

---

### 3.2 LLM 配置修改

**文件位置**: `backend/config/agent_llm_config.json`

#### 当前配置（豆包）：
```json
{
    "config": {
        "model": "doubao-seed-1-8-251228",
        ...
    }
}
```

#### 修改为（DeepSeek）：
```json
{
    "config": {
        "model": "deepseek-chat",
        ...
    }
}
```

---

### 3.3 后端代码修改

#### 3.3.1 主入口文件
**文件位置**: `backend/src/main.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 9 | `import cozeloop` | 删除此导入 |
| 18 | `from coze_coding_utils.runtime_ctx.context import new_context, Context` | 删除 Coze 导入，使用原生实现 |
| 183, 439, 576, 594 | `cozeloop.flush()` | 删除这些调用 |

#### 3.3.2 Agent 构建文件
**文件位置**: `backend/src/agents/agent.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 13 | `from coze_coding_utils.runtime_ctx.context import default_headers` | 删除此导入 |
| 36 | `workspace_path = os.getenv("COZE_WORKSPACE_PATH", "/workspace/projects")` | 改为本地路径或配置 |
| 42 | `api_key = os.getenv("COZE_WORKLOAD_IDENTITY_API_KEY")` | 改为 `DEEPSEEK_API_KEY` |
| 43 | `base_url = os.getenv("COZE_INTEGRATION_MODEL_BASE_URL")` | 改为 DeepSeek API 地址 |
| 57 | `default_headers=default_headers(ctx) if ctx else {}` | 删除 Coze headers |

#### 3.3.3 知识库搜索工具
**文件位置**: `backend/src/tools/knowledge_search_tool.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 6 | `from coze_coding_dev_sdk import KnowledgeClient, Config` | 替换为本地向量数据库实现 |
| 7 | `from coze_coding_utils.runtime_ctx.context import new_context` | 删除此导入 |
| 21-48 | 整个搜索函数 | 重写为使用本地向量库（如 FAISS、Chroma） |

**说明**：这是最复杂的改造点，需要用本地向量数据库替代 Coze 知识库服务。

#### 3.3.4 日志追踪
**文件位置**: `backend/src/utils/log/loop_trace.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 2-3 | `import cozeloop` 和 `from cozeloop.integration.langchain.trace_callback import LoopTracer` | 删除 Coze 导入 |
| 8-18 | Coze Loop 客户端初始化代码 | 删除或替换为标准日志库 |
| 25-35 | `LoopTracer.get_callback_handler` | 替换为 LangChain 标准回调 |

#### 3.3.5 S3 存储
**文件位置**: `backend/src/storage/s3/s3_storage.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 39-42 | `from coze_workload_identity import Client as CozeEnvClient` | 删除，改用标准环境变量 |
| 66-75 | `from coze_workload_identity import Client as CozeClient` | 删除，改用标准认证 |
| 108 | `os.environ.get("COZE_BUCKET_NAME")` | 改为 `BUCKET_NAME` |
| 238-244 | Coze 认证获取 token | 删除，使用标准 AWS 认证 |

#### 3.3.6 OpenAI Handler
**文件位置**: `backend/src/utils/openai/handler.py`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 11 | `from coze_coding_utils.runtime_ctx.context import Context` | 删除此导入，使用原生类型 |

---

### 3.4 前端代码修改

#### 3.4.1 API 路由
**文件位置**: `frontend/src/app/api/chat/route.ts`

**需要修改的内容**：
| 行号 | 当前代码 | 修改内容 |
|------|---------|---------|
| 3 | `const API_URL = 'https://sqpmnrpf6b.coze.site/stream_run';` | 改为本地后端地址，如 `http://localhost:5000/stream_run` |
| 4 | `const API_TOKEN = 'eyJhbG...'` | 删除或改为本地认证 |
| 5 | `const SESSION_ID = '-_K4h_MqxJFDKGJzA-xct';` | 改为可配置的会话 ID |
| 6 | `const PROJECT_ID = 7603199597850296339;` | 删除，不需要项目 ID |
| 19-20 | `'Authorization': \`Bearer ${API_TOKEN}\`` | 如果需要认证，改为本地 token |

#### 3.4.2 主页面
**文件位置**: `frontend/src/app/page.tsx`

**需要修改的内容**：
此文件主要是前端 UI，不需要重大修改。如果需要支持会话管理，可能需要添加会话 ID 的生成和管理逻辑。

---

### 3.5 环境变量修改

**文件位置**: 创建 `backend/.env` 文件

#### 需要删除的 Coze 环境变量：
```bash
COZE_WORKSPACE_PATH
COZE_WORKLOAD_IDENTITY_API_KEY
COZE_INTEGRATION_MODEL_BASE_URL
COZE_PROJECT_TYPE
COZE_PROJECT_ENV
COZE_PROJECT_SPACE_ID
COZE_LOOP_API_TOKEN
COZE_LOOP_BASE_URL
COZE_BUCKET_ENDPOINT_URL
COZE_BUCKET_NAME
COZE_PROJECT_ID
COZE_LOG_DIR
COZE_PROJECT_COMMIT_HASH
COZE_WORKLOAD_IDENTITY_TOKEN
```

#### 需要添加的新环境变量：
```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 本地配置
WORKSPACE_PATH=./workspace
LOG_LEVEL=INFO

# 向量数据库配置（选择一种）
# Chroma
CHROMA_PERSIST_DIRECTORY=./data/chroma
# 或 FAISS
FAISS_INDEX_PATH=./data/faiss

# S3 存储配置（如果仍需要）
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=cn-beijing
BUCKET_NAME=your_bucket
ENDPOINT_URL=your_s3_endpoint

# 数据库配置（如果仍需要）
DATABASE_URL=postgresql://user:password@localhost/dbname
```

---

## 4. Python 虚拟环境配置

**文件位置**: `backend/`

### 4.1 创建虚拟环境步骤
```bash
# 在 backend 目录下
cd backend

# 创建虚拟环境（Windows）
python -m venv venv

# 激活虚拟环境（Windows）
venv\Scripts\activate

# 激活虚拟环境（Linux/Mac）
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 4.2 更新 .gitignore
在 `.gitignore` 中添加：
```
# Python 虚拟环境
venv/
env/
.venv/

# 本地配置
.env
.env.local

# 本地数据
data/
workspace/
```

---

## 5. 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                        │
│  page.tsx → api/chat/route.ts → 后端 API                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 (FastAPI)                            │
│  main.py → GraphService → Agent                              │
│                      ↓                                        │
│              ┌──────────────────────┐                         │
│              │    LangChain Agent   │                         │
│              └──────────────────────┘                         │
│                      ↓                                        │
│         ┌────────────┴────────────┐                          │
│         ↓                         ↓                          │
│  ChatOpenAI (DeepSeek)    KnowledgeClient (需替换)            │
│         ↓                         ↓                          │
│   DeepSeek API          本地向量数据库                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 改造优先级

### 高优先级（核心功能）
1. ✅ 创建 Python 虚拟环境
2. ✅ 修改 LLM 配置（豆包 → DeepSeek）
3. ✅ 修改 Agent 构建代码
4. ✅ 更新 requirements.txt
5. ✅ 移除 Coze SDK 导入

### 中优先级（兼容性）
6. ⚠️ 重写知识库搜索工具（替换向量数据库）
7. ⚠️ 修改环境变量配置
8. ⚠️ 更新前端 API 地址

### 低优先级（优化）
9. 📝 简化日志追踪（移除 Coze Loop）
10. 📝 清理 S3 存储中的 Coze 认证代码
11. 📝 更新文档

---

## 7. 风险评估

| 风险项 | 严重程度 | 缓解措施 |
|--------|---------|---------|
| 知识库迁移复杂 | 高 | 优先实现向量数据库方案，充分测试 |
| API 兼容性问题 | 中 | 使用 DeepSeek 的 OpenAI 兼容接口 |
| 前后端通信问题 | 中 | 保持接口格式一致，测试流式响应 |
| 环境变量配置遗漏 | 低 | 创建 .env 模板文件 |

---

## 8. 测试计划

### 8.1 单元测试
- [ ] Agent 构建测试
- [ ] LLM 调用测试
- [ ] 知识库搜索测试

### 8.2 集成测试
- [ ] 前后端通信测试
- [ ] 流式响应测试
- [ ] 会话管理测试

### 8.3 端到端测试
- [ ] 完整对话流程测试
- [ ] 知识库检索测试
- [ ] 错误处理测试

---

## 9. 后续步骤

**当前状态**: 等待用户确认后开始改造

**下一步行动**:
1. 用户确认需求分析文档
2. 创建 Python 虚拟环境
3. 修改 LLM 配置和 Agent 代码
4. 实现本地向量数据库
5. 测试验证

---

## 10. 附录

### 10.1 DeepSeek API 参考
- 官方文档: https://platform.deepseek.com/api-docs/
- 兼容 OpenAI API，使用 `ChatOpenAI` 类即可
- API 端点: `https://api.deepseek.com`

### 10.2 向量数据库选项
| 选项 | 优点 | 缺点 |
|------|------|------|
| Chroma | 简单易用，支持持久化 | 性能一般 |
| FAISS | 高性能 | 需要手动管理持久化 |
| Qdrant | 功能丰富 | 学习曲线较陡 |
| Pinecone | 云服务 | 需要付费 |

---

*文档创建时间: 2025-02-07*
*状态: 待确认*
