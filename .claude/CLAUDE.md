# Auto-Skills 项目上下文

## 项目概述

Auto-Skills 是一个 Claude Code 技能合集项目，目标是：
- 提供实用、易用的自定义技能
- 帮助新手学习技能开发
- 构建开源共享的技能库

---

## 目录结构

```
auto-skills/
├── README.md                    # 项目首页
├── LICENSE                      # MIT 开源协议
├── CONTRIBUTING.md              # 贡献指南
├── package.json                 # npm 包配置
├── skills/                      # skills 核心目录
│   ├── builtin/                 # 自编技能
│   │   ├── file-ops/           # 文件操作助手
│   │   ├── git-helper/         # Git 操作助手
│   │   └── search-helper/      # 代码搜索助手（计划中）
│   ├── community/               # 社区技能
│   └── templates/               # 新技能模板
│       └── basic-skill/        # 基础技能模板
├── docs/                        # 文档目录
│   ├── plans/                   # 项目规划
│   ├── 00-getting-started.md   # 快速开始
│   ├── 01-skill-structure.md   # 技能结构详解
│   ├── 02-develop-first-skill.md # 创建第一个技能
│   ├── 03-advanced-topics.md   # 高级主题
│   └── 04-faq.md               # 常见问题
├── examples/                    # 使用示例
└── .claude/                     # Claude 配置
    └── CLAUDE.md               # 本文件
```

---

## 技能文件结构

每个技能目录包含以下文件：

```
skill-name/
├── skill.json      # 【必需】技能元数据配置
├── SKILL.md       # 【必需】核心提示词
└── description.md  # 【推荐】使用说明文档
```

### skill.json 说明

定义技能的基本信息和参数结构：
- `name`: 技能名称（kebab-case）
- `displayName`: 显示名称
- `description`: 简短描述
- `version`: 版本号（语义化）
- `author`: 作者信息
- `parameters`: 参数定义

### SKILL.md 说明

核心提示词，定义技能的行为：
- 角色定义
- 操作指南
- 输出格式
- 错误处理

使用 `{{param}}` 引用参数，`{{if}}` 进行条件判断。

---

## 开发指南

### 新技能开发步骤

1. 复制模板 `skills/templates/basic-skill/`
2. 重命名为新的技能名称
3. 编辑 `skill.json` 配置参数
4. 编写 `SKILL.md` 定义行为
5. 编写 `description.md` 使用说明
6. 测试技能功能
7. 更新相关文档

### 命名规范

- 技能目录名：kebab-case（如 `file-ops`）
- 参数名：kebab-case（如 `dryRun`）
- 文件名：kebab-case

### 输出格式

成功操作：
```
✓ 操作成功

[结果]
```

失败操作：
```
✗ 操作失败

错误信息: [具体错误]
```

警告：
```
⚠️ 警告

[警告内容]
```

---

## 文档说明

- `00-getting-started.md`: 从零开始的快速入门
- `01-skill-structure.md`: 详细解释每个文件和字段
- `02-develop-first-skill.md`: 手把手教程
- `03-advanced-topics.md`: 高级开发技巧
- `04-faq.md`: 常见问题解答

---

## 注意事项

1. **优先使用专用工具**：
   - 文件操作：Read、Write、Edit
   - 搜索：Glob、Grep
   - 仅在必要时使用 Bash

2. **危险操作确认**：
   - 删除、重置等操作前提醒用户
   - 提供 dryRun 预演选项

3. **错误处理**：
   - 捕获并友好提示错误
   - 提供可行的解决建议

---

## 当前状态

### 已完成的技能

| 技能名称 | 状态 | 说明 |
|---------|------|------|
| file-ops | ✅ 完成 | 文件搜索、读取、编辑操作 |
| git-helper | ✅ 完成 | Git 状态、提交、分支操作 |

### 计划中的技能

| 技能名称 | 优先级 | 说明 |
|---------|--------|------|
| search-helper | 中 | 代码搜索助手 |
| code-review | 高 | 代码审查助手 |
| test-runner | 中 | 测试运行助手 |

---

## 相关链接

- README: [README.md](../README.md)
- 贡献指南: [CONTRIBUTING.md](../CONTRIBUTING.md)
- 开发路线图: [docs/plans/roadmap.md](../docs/plans/roadmap.md)
