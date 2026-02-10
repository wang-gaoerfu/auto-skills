# Auto-Tools 自动化工具平台

Auto-Tools 是一个面向用户的自动化工具集合平台，提供上百种实用工具，采用会员订阅制进行访问控制。

## 功能特性

### 用户功能
- ✅ 用户注册/登录（邮箱+密码）
- ✅ 会员购买（虚拟购买+管理员审核）
- ✅ 工具使用（会员专享+免费工具）
- ✅ 个人中心
- ✅ 工具使用历史

### 管理功能
- ✅ 用户管理
- ✅ 会员审核
- ✅ 工具管理
- ✅ 统计分析

### 工具分类
- 文本处理（6个工具）
- 数据转换（6个工具）
- 开发工具（4个工具）
- 时间日期（1个工具）

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI**: Tailwind CSS 4
- **状态管理**: Zustand
- **数据库**: SQLite + Prisma 5
- **认证**: NextAuth.js 4
- **密码加密**: bcrypt

## 快速开始

### 1. 安装依赖
```bash
cd auto-tools
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并修改配置：
```bash
cp .env.example .env
```

### 3. 初始化数据库
```bash
npm run db:push
npm run db:seed
```

默认管理员账户：
- 邮箱: `admin@auto-tools.com`
- 密码: `admin123456`

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
auto-tools/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证页面组
│   ├── (dashboard)/         # 主应用页面组
│   ├── (admin)/             # 管理后台页面组
│   ├── api/                 # API 路由
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
├── lib/                     # 工具库
│   ├── auth.ts             # 认证配置
│   ├── db.ts               # 数据库工具
│   ├── membership.ts       # 会员逻辑
│   ├── tools/              # 工具实现
│   │   ├── executor.ts     # 工具执行框架
│   │   ├── text-tools.ts   # 文本处理工具
│   │   ├── data-conversion-tools.ts  # 数据转换工具
│   │   └── dev-tools.ts    # 开发工具
│   └── validations.ts      # 验证规则
├── prisma/                  # 数据库
│   ├── schema.prisma       # 数据库模式
│   └── seed.ts             # 初始数据
├── types/                   # TypeScript 类型
└── middleware.ts            # 中间件
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run db:push` | 推送数据库模式 |
| `npm run db:seed` | 填充初始数据 |
| `npm run db:studio` | 打开 Prisma Studio |

## 默认账户

### 管理员
- 邮箱: `admin@auto-tools.com`
- 密码: `admin123456`
- 权限: 全部功能

### 新注册用户
- 初始会员: 免费版
- 可使用: 所有标记为"免费"的工具

## 会员套餐

| 套餐 | 价格 | 说明 |
|------|------|------|
| 免费版 | ¥0 | 仅免费工具 |
| 基础版 | ¥29/月 | 全部工具 |
| 专业版 | ¥99/月 | 全部工具 + 优先支持 |
| 企业版 | ¥299/月 | 全部功能 |

## 已实现工具

### 文本处理
1. 字数统计 - 统计文本的字数、字符数、行数等
2. 大小写转换 - 转换文本大小写
3. 文本去重 - 去除重复行
4. 文本排序 - 对文本行排序
5. Markdown转HTML - Markdown转HTML
6. HTML转Markdown - HTML转Markdown

### 数据转换
1. JSON格式化 - 格式化/压缩JSON
2. XML转JSON - XML转JSON
3. CSV转JSON - CSV转JSON
4. Base64编解码 - Base64编码/解码
5. URL编解码 - URL编码/解码
6. 进制转换 - 二进制/十进制/十六进制转换

### 开发工具
1. UUID生成器 - 生成UUID
2. Hash生成器 - 生成MD5/SHA哈希
3. 颜色转换 - HEX/RGB/HSL转换
4. Crontab解析 - 解析Crontab表达式

### 时间日期
1. 时间戳转换 - 时间戳与日期转换

## 开发说明

### 添加新工具

1. 在 `lib/tools/` 下创建工具文件
2. 实现 `ToolExecutor` 接口
3. 在 `lib/tools/index.ts` 中注册工具
4. 在数据库中添加工具记录（通过管理后台或seed文件）

### 工具执行流程

1. 用户通过API执行工具
2. 检查用户权限（免费/会员）
3. 验证输入参数
4. 执行工具逻辑
5. 记录使用历史
6. 返回结果

## License

MIT
