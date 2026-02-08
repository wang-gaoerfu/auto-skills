# Find Skills 技能

## 功能说明

这个技能帮助你发现和安装来自开放代理技能生态系统的技能。

## 使用场景

当你需要以下帮助时，使用此技能：

- 寻找特定功能的技能（如 "如何做 X"）
- 搜索可用的技能包
- 了解如何使用 Skills CLI 管理技能

## 主要命令

```bash
# 搜索技能
npx skills find [查询关键词]

# 安装技能
npx skills add <owner/repo@skill>

# 检查更新
npx skills check

# 更新所有技能
npx skills update
```

## 技能来源

- 来源：[Vercel Labs - Skills](https://github.com/vercel-labs/skills)
- 浏览技能：https://skills.sh/

## 示例

```
你：有没有能帮我做代码审查的技能？
我：让我搜索一下...
npx skills find pr review

我找到了几个相关技能：
- vercel-labs/agent-skills@pr-review - 代码审查最佳实践
要安装它，运行：npx skills add vercel-labs/agent-skills@pr-review
```
