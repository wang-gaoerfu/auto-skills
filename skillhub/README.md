# SkillHub

> Skills 管理中心 - 管理和应用你的 Claude Code 技能

## 项目简介

SkillHub 是一个 Web 应用，用于管理和使用 Auto-Skills 项目中的所有技能。提供技能浏览、MCP 管理、工具集等功能。

## 技术栈

- **前端**: Next.js 14 + React + TypeScript
- **UI**: Tailwind CSS + shadcn/ui 风格组件
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **状态管理**: Zustand

## 开发计划

### Phase 1: 基础框架 ✅
- [x] 项目初始化
- [x] 配置 Next.js + TypeScript
- [x] 配置 Tailwind CSS
- [x] 配置 Prisma + SQLite
- [x] 创建基础布局和侧边栏

### Phase 2: Skills 管理 🚧
- [x] Skills API Routes
- [x] Skills 列表页面
- [ ] Skills 详情页面
- [ ] 创建/编辑技能
- [ ] 删除技能

### Phase 3: MCP 管理
- [ ] MCP 配置读取
- [ ] MCP 配置编辑
- [ ] MCP 服务器管理

### Phase 4: 工具集
- [ ] 需求分析工具
- [ ] 工作流编排
- [ ] 架构设计工具

## 快速开始

### 安装依赖

```bash
cd skillhub
npm install
```

### 初始化数据库

```bash
npx prisma generate
npx prisma db push
npm run seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
skillhub/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── skills/        # Skills API
│   ├── skills/            # Skills 页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # 组件
│   ├── ui/               # 基础 UI 组件
│   ├── layout/           # 布局组件
│   ├── sidebar/          # 侧边栏组件
│   └── skills/           # Skills 组件
├── lib/                  # 工具函数
│   ├── db.ts            # Prisma 客户端
│   ├── utils.ts         # 通用工具
│   └── skills.ts        # Skills 操作
├── prisma/              # Prisma 配置
│   ├── schema.prisma    # 数据模型
│   └── seed.ts          # 初始数据
├── types/               # TypeScript 类型
└── public/              # 静态资源
```

## 开发指南

### 添加新页面

1. 在 `app/` 目录下创建页面文件
2. 使用 `MainLayout` 包裹内容
3. 在侧边栏添加导航链接

### 添加新 API

1. 在 `app/api/` 目录下创建路由
2. 使用 Prisma 操作数据库
3. 返回 JSON 响应

## 许可证

MIT
