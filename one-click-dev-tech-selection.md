# 技术栈选择指南

## 目录

1. [前端框架选择](#前端框架选择)
2. [后端框架选择](#后端框架选择)
3. [数据库选择](#数据库选择)
4. [部署平台选择](#部署平台选择)
5. [决策树](#决策树)

---

## 前端框架选择

### React

**适用场景**:
- 单页应用 (SPA)
- 复杂交互界面
- 需要丰富生态系统
- 团队熟悉 React

**推荐技术栈**:
```
React + TypeScript + Vite + Tailwind CSS
```

**对应技能**: `react-best-practices`, `typescript-best-practices`

---

### Vue

**适用场景**:
- 快速原型开发
- 中小型项目
- 团队熟悉 Vue
- 需要渐进式采用

**推荐技术栈**:
```
Vue 3 + TypeScript + Vite + Tailwind CSS
```

---

### Next.js

**适用场景**:
- SEO 重要的网站
- 需要服务端渲染
- 全栈应用
- 内容驱动网站

**推荐技术栈**:
```
Next.js + TypeScript + Tailwind CSS + Prisma
```

**对应技能**: `react-best-practices`, `typescript-best-practices`

---

## 后端框架选择

### Node.js

**适用场景**:
- REST API
- 实时应用
- 微服务
- 全栈 JavaScript

**推荐技术栈**:
```
Express/Fastify + TypeScript + Prisma
```

**对应技能**: `typescript-best-practices`

---

### Python

**适用场景**:
- 数据处理
- AI/ML 应用
- 快速原型
- 脚本工具

**推荐技术栈**:
```
FastAPI + SQLAlchemy + Pydantic
```

**对应技能**: `python-best-practices`

---

### Go

**适用场景**:
- 高性能服务
- 微服务
- CLI 工具
- 系统编程

---

## 数据库选择

### PostgreSQL

**适用场景**:
- 关系型数据
- 复杂查询
- ACID 事务
- 企业应用

---

### MongoDB

**适用场景**:
- 文档型数据
- 灵活 Schema
- 快速迭代
- 内容管理

---

### SQLite

**适用场景**:
- 小型应用
- 本地工具
- 嵌入式系统
- 开发测试

---

## 部署平台选择

### Vercel

**适用场景**:
- Next.js 应用
- 静态网站
- Serverless 函数
- 快速部署

---

### Railway

**适用场景**:
- 全栈应用
- 需要数据库
- Docker 部署
- 中小型项目

---

### GitHub Pages

**适用场景**:
- 静态网站
- 文档站点
- 个人博客
- 开源项目

---

## 决策树

```
开始
  │
  ├─ 需要 Web 界面?
  │   ├─ 是 → 需要服务端渲染?
  │   │        ├─ 是 → Next.js
  │   │        └─ 否 → React/Vue + Vite
  │   │
  │   └─ 否 → 纯 CLI 工具?
  │            ├─ 是 → Python/Go/Node CLI
  │            └─ 否 → 纯后端服务
  │
  ├─ 需要后端?
  │   ├─ 是 → 数据密集型?
  │   │        ├─ 是 → Python + FastAPI
  │   │        └─ 否 → Node.js + Express
  │   │
  │   └─ 否 → 前端应用 (Vercel/Netlify)
  │
  └─ 需要数据库?
       ├─ 是 → 关系型数据?
       │        ├─ 是 → PostgreSQL
       │        └─ 否 → MongoDB
       │
       └─ 否 → SQLite/无数据库
```

---

## 项目模板推荐

### Web 应用

```
project/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── public/
├── tests/
├── package.json
└── README.md
```

### CLI 工具

```
project/
├── src/
│   ├── commands/
│   ├── utils/
│   └── index.ts
├── tests/
├── package.json
└── README.md
```

### API 服务

```
project/
├── src/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── index.ts
├── tests/
├── package.json
└── README.md
```
