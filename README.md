# Auto-Skills

> Claude Code 多项目工作空间 - 共享技能库和开发工具集

一个精心组织的 Claude Code 工作空间，提供共享技能库、开发工具和完整文档，支持多项目并行开发。

---

## 项目简介

Auto-Skills 是一个面向 Claude Code 用户的工作空间，提供：

- **共享技能库** - 9+ 实用技能，所有项目可复用
- **多项目支持** - 并行管理多个独立项目
- **开发工具** - 技能验证、列表等管理脚本
- **完整文档** - 从入门到进阶的学习资料
- **Web 管理界面** - SkillHub 提供可视化的技能管理

### 当前包含的技能

| 技能名称 | 功能描述 | 状态 |
|---------|---------|------|
| `/file-ops` | 文件操作助手 - 搜索、读取、编辑文件 | ✅ 完成 |
| `/git-helper` | Git 操作助手 - 提交、分支、推送 | ✅ 完成 |
| `/task-clarify` | 任务澄清助手 - 通过对话明确任务目标 | ✅ 完成 |
| `/req-clarify` | 需求分析助手 - 通过对话收集软件需求 | ✅ 完成 |
| `/req-structure` | 需求结构化 - 整理为标准文档格式 | ✅ 完成 |
| `/doc-generator` | 文档生成器 - 生成 Markdown 需求文档 | ✅ 完成 |
| `/skill-manager` | 技能管理助手 - 管理本地技能的增删改查 | ✅ 完成 |
| `/skill-creator` | 技能创建工具 - 引导创建新技能 | ✅ 完成 |

### 专题系统

#### 需求分析系统

完整的需求分析解决方案，包含三个协作技能：

```
原始需求 → /req-clarify → /req-structure → /doc-generator → 需求文档
```

- [需求分析概述](docs/requirement-analysis/00-overview.md)
- [快速开始](docs/requirement-analysis/01-quick-start.md)
- [使用示例](docs/requirement-analysis/02-examples.md)

---

## 快速开始

### 安装

将此仓库克隆到本地：

```bash
git clone https://github.com/your-username/auto-skills.git
cd auto-skills
```

### 使用技能

确保 Claude Code 已识别到项目中的 skills：

```bash
# 查看可用技能
/help

# 使用技能
/file-ops --search "pattern"
/git-helper --status
```

### 管理工具

```bash
# 列出所有技能
npm run list:skills

# 验证技能配置
npm run validate:skills
```

---

## 目录结构

```
auto-skills/                      # 工作空间根目录
├── README.md                     # 项目说明
├── LICENSE                       # MIT 开源协议
├── CONTRIBUTING.md               # 贡献指南
├── package.json                  # 工作空间配置
│
├── skills/                       # 【共享】Claude Code 技能库
│   ├── builtin/                  # 内置技能 (7个)
│   │   ├── file-ops/            # 文件操作助手
│   │   ├── git-helper/          # Git 操作助手
│   │   ├── task-clarify/        # 任务澄清助手
│   │   ├── req-clarify/         # 需求分析助手
│   │   ├── req-structure/       # 需求结构化
│   │   ├── doc-generator/       # 文档生成器
│   │   └── skill-manager/       # 技能管理助手
│   ├── community/                # 社区技能 (1个)
│   │   └── skill-creator/       # 技能创建工具
│   └── templates/                # 技能模板
│       └── basic-skill/         # 基础技能模板
│
├── skillhub/                     # 【独立项目】SkillHub Web 应用
│   └── (Next.js 技能管理界面)
│
├── scripts/                      # 【共享】管理脚本
│   ├── validate-skills.js       # 验证技能配置
│   └── list-skills.js           # 列出所有技能
│
├── docs/                         # 【共享】项目文档
│   ├── 00-getting-started.md    # 快速开始指南
│   ├── 01-skill-structure.md    # 技能结构详解
│   ├── 02-develop-first-skill.md # 创建第一个技能
│   ├── 03-advanced-topics.md    # 高级主题
│   ├── 04-faq.md                # 常见问题
│   ├── mcp-setup.md             # MCP 配置指南
│   ├── prd.md                   # 产品需求文档
│   ├── requirement-analysis/    # 需求分析专题文档
│   └── plans/                   # 项目规划
│
├── knowledge/                    # 【共享】知识库
│   └── *.pdf                    # 参考资料文件
│
├── examples/                     # 【共享】使用示例
├── tests/                        # 【共享】测试目录
├── data/                         # 【共享】数据文件
├── requirements/                 # 【共享】需求文档
│
├── .claude/                      # Claude Code 配置
│   ├── CLAUDE.md                # 项目上下文
│   ├── mcp.json                 # MCP 服务器配置
│   └── skills -> ../skills      # 技能符号链接
│
└── your-project/                 # 【新建项目】未来的项目目录
```

---

## 创建新项目

在工作空间中创建新项目：

```bash
# 1. 创建项目目录
mkdir your-new-project
cd your-new-project

# 2. 初始化项目
npm init -y

# 3. 创建符号链接到共享技能
mkdir .claude
cd .claude
# Windows: mklink /D skills ..\skills
# Linux/Mac: ln -s ../skills skills
```

---

## 学习资源

### 新手入门

- [快速开始指南](docs/00-getting-started.md) - 从零开始配置
- [技能结构详解](docs/01-skill-structure.md) - 理解每个文件的作用
- [创建第一个技能](docs/02-develop-first-skill.md) - 手把手教程

### 进阶学习

- [高级主题](docs/03-advanced-topics.md) - 参数、条件、组合
- [常见问题](docs/04-faq.md) - 答疑解惑

### 专题系统

- [需求分析系统](docs/requirement-analysis/00-overview.md) - 完整的需求分析解决方案

---

## 开发规划

查看 [开发路线图](docs/plans/roadmap.md) 了解项目进展和未来计划。

---

## 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

---

## 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

---

## 联系方式

- 提交 Issue: [GitHub Issues](https://github.com/your-username/auto-skills/issues)
- 讨论交流: [GitHub Discussions](https://github.com/your-username/auto-skills/discussions)

---

**Made with ❤️ for the Claude Code Community**
