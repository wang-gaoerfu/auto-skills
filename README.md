# Auto-Skills

> Claude Code 技能合集 - 开源共享的常用工具技能集合

一个精心整理的 Claude Code skills 合集，包含自编技能和精选的社区技能。目标是帮助开发者提高效率，同时为新手提供学习和贡献的起点。

---

## 项目简介

Auto-Skills 是一个面向 Claude Code 用户的开源技能库，提供：

- **自编技能** - 原创的实用技能，附带详细注释和学习文档
- **社区技能** - 精选的优质社区技能整合
- **技能模板** - 帮助新手快速创建自己的技能
- **完整文档** - 从入门到进阶的学习资料

### 当前包含的技能

| 技能名称 | 功能描述 | 状态 |
|---------|---------|------|
| `/file-ops` | 文件操作助手 - 搜索、读取、编辑文件 | 开发中 |
| `/git-helper` | Git 操作助手 - 提交、分支、推送 | 开发中 |
| `/search-helper` | 代码搜索助手 - 智能代码查找 | 计划中 |

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

---

## 目录结构

```
auto-skills/
├── README.md           # 项目说明
├── LICENSE             # MIT 开源协议
├── CONTRIBUTING.md     # 贡献指南
├── package.json        # npm 配置
├── skills/             # skills 核心目录
│   ├── builtin/        # 自编技能
│   ├── community/      # 社区技能
│   └── templates/      # 技能模板
├── docs/               # 文档目录
├── examples/           # 使用示例
└── .claude/            # Claude 配置
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
