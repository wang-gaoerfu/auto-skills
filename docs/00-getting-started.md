# 00 - 快速开始

欢迎来到 Auto-Skills！本指南将带你从零开始，快速上手使用 Claude Code 技能。

---

## 目录

1. [什么是 Claude Code Skills](#什么是-claude-code-skills)
2. [安装 Auto-Skills](#安装-auto-skills)
3. [配置环境](#配置环境)
4. [你的第一个技能](#你的第一个技能)
5. [常见问题](#常见问题)

---

## 什么是 Claude Code Skills

### 概念解释

**Claude Code Skills** 是一种扩展 Claude Code 功能的方式，通过简单的文本文件定义自定义命令。

打个比方：
- Claude Code 就像一个智能助手
- Skills 就像是给这个助手配备的"工具箱"
- 每个技能就是一件专门的工具（如扳手、螺丝刀等）

### 为什么需要 Skills

- **提高效率**：常用操作一键完成
- **个性化定制**：根据你的需求定制功能
- **可复用**：一次编写，多次使用
- **可分享**：与他人分享你的技能

---

## 安装 Auto-Skills

### 前提条件

确保你已经安装了：
- Git
- Node.js（可选，用于运行项目脚本）
- Claude Code CLI

### 克隆仓库

```bash
# 克隆仓库到本地
git clone https://github.com/your-username/auto-skills.git

# 进入项目目录
cd auto-skills
```

### 验证安装

```bash
# 查看项目文件
ls

# 应该能看到以下结构：
# - README.md
# - skills/
# - docs/
# - package.json
```

---

## 配置环境

### 方法一：项目级安装（推荐）

1. 确保 Auto-Skills 目录已添加到 Claude Code 的项目列表

2. 在项目根目录下创建 `.claude/skills/` 链接：

```bash
# Windows PowerShell
New-Item -ItemType SymbolicLink -Path .claude/skills -Target skills/builtin

# Linux/Mac
ln -s skills/builtin .claude/skills
```

### 方法二：全局安装

将技能复制到全局技能目录：

```bash
# Windows
xcopy /E /I skills\builtin %USERPROFILE%\.claude\skills

# Linux/Mac
cp -r skills/builtin ~/.claude/skills/
```

---

## 你的第一个技能

### 查看可用技能

```bash
/help
```

这将显示所有可用的技能列表。

### 使用 file-ops 技能

file-ops 是文件操作助手，让我们试试搜索文件：

```
/file-ops action:search pattern:"*.js"
```

### 使用 git-helper 技能

git-helper 是 Git 操作助手，让我们查看当前状态：

```
/git-helper action:status
```

---

## 技能命令格式

### 基本语法

```
/技能名 参数名:值 参数名:值
```

### 示例

```
# 基本调用
/file-ops action:list

# 带参数调用
/file-ops action:search pattern:"*.ts" recursive:true

# 使用引号包含值
/git-helper action:commit message:"修复了一个 bug"
```

---

## 下一步

恭喜你已经完成了基础配置！接下来：

1. 阅读 [技能结构详解](./01-skill-structure.md) - 了解技能的工作原理
2. 学习 [创建第一个技能](./02-develop-first-skill.md) - 动手编写自己的技能
3. 探索 [高级主题](./03-advanced-topics.md) - 掌握更复杂的技能开发

---

## 常见问题

### Q: 技能没有生效怎么办？

A: 检查以下几点：
1. 确认 `.claude/skills/` 目录链接正确
2. 尝试重新启动 Claude Code
3. 使用 `/help` 查看技能列表

### Q: 如何更新技能？

A: 使用 Git 拉取最新代码：

```bash
git pull origin main
```

### Q: 可以在多个项目使用同一个技能吗？

A: 可以。推荐使用全局安装方式，或者在每个项目中创建符号链接。

### Q: 如何卸载技能？

A: 删除对应的文件或符号链接：

```bash
# Windows
Remove-Item .claude/skills -Recurse

# Linux/Mac
rm -rf .claude/skills
```

---

需要更多帮助？查看 [常见问题](./04-faq.md) 或提交 [Issue](https://github.com/your-username/auto-skills/issues)。
