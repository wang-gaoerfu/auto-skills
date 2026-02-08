# Leader-Spark 项目

> **当前状态**: 后端第一阶段完成 ✅ | 前端待开发 ⏳
> **最后更新**: 2025-01-15

## 快速了解

Leader-Spark 是一个基于 DeepSeek 的多分类智能知识库系统，支持：
- 📚 多分类知识库管理
- 💬 AI 智能对话（RAG 检索增强）
- 👥 用户权限管理（管理员/普通用户）
- 📊 Token 使用统计（为收费提供数据）
- 🔍 文档 AI 自动分类

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python + FastAPI + SQLAlchemy + PostgreSQL |
| AI | DeepSeek (LLM + Embeddings) |
| 向量库 | Qdrant |
| 前端 | Next.js 14 + TypeScript + Tailwind CSS |
| 部署 | Docker + Docker Compose |

## 快速开始

### 查看开发进度

详细进度请查看 **[PROGRESS.md](./PROGRESS.md)**，包含：
- ✅ 已完成工作清单
- ⏳ 待办事项列表
- 📁 文件结构说明
- 🚀 开发命令速查

### 后端开发

```bash
cd backend

# 激活虚拟环境
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写 DEEPSEEK_API_KEY 等必填项

# 启动服务
cd src
python app.py

# 访问 API 文档
# http://localhost:8000/docs
```

### 数据库启动

```bash
cd deploy

# 启动 PostgreSQL 和 Qdrant
docker-compose up -d postgres qdrant

# 初始化数据库
psql -h localhost -U leader_spark -d leader_spark -f init-db.sql
```

## 项目结构

```
leader-spark/
├── backend/               # 后端（Python/FastAPI）
│   ├── src/
│   │   ├── models/       # 数据库模型
│   │   ├── api/v1/       # API 路由
│   │   ├── auth/         # 认证模块
│   │   ├── services/     # 业务服务
│   │   └── app.py        # 应用入口
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/             # 前端（Next.js）- 待开发
│
├── deploy/               # 部署配置
│   ├── docker-compose.yml
│   ├── init-db.sql
│   └── DEPLOYMENT.md
│
├── docs/                 # 文档
│   ├── FRONTEND_DESIGN_V3.md
│   └── REQUIREMENTS_V2.md
│
└── PROGRESS.md           # 📌 开发进度（重要！）
```

## 默认账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | Admin@9000 |

## 部署相关

完整的部署指南请查看 **[deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md)**

## 需求文档

- [前端设计 V3](./docs/FRONTEND_DESIGN_V3.md) - 双端前端架构设计
- [需求文档 V2](./docs/REQUIREMENTS_V2.md) - 完整系统需求规格

## 下一步

1. ✅ 后端开发已完成
2. ⏳ 开始前端 Next.js 项目初始化
3. ⏳ 前后端联调测试
4. ⏳ 部署上线

---

**继续开发前，请务必阅读 [PROGRESS.md](./PROGRESS.md)**
