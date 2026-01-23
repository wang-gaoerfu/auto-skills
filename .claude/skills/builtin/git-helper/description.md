# Git Operations Helper - 使用说明

## 概述

`git-helper` 是一个 Git 操作助手技能，提供常用的版本控制功能，包括状态查看、提交、分支、推送等操作。

---

## 支持的操作

| 操作 | 说明 | 常用参数 |
|------|------|---------|
| `status` | 查看当前状态 | - |
| `add` | 添加文件到暂存区 | `files` |
| `commit` | 提交更改 | `message` |
| `push` | 推送到远程 | `remote` |
| `pull` | 从远程拉取 | `remote` |
| `branch` | 分支操作 | `branch` |
| `checkout` | 切换分支 | `branch` |
| `merge` | 合并分支 | `branch` |
| `log` | 查看提交历史 | - |
| `diff` | 查看差异 | - |
| `reset` | 重置操作 | - |
| `clean` | 清理未跟踪文件 | - |
| `stash` | 暂存更改 | - |

---

## 使用示例

### 1. 查看状态

```
/git-helper action:status
```

### 2. 添加文件

添加所有文件：
```
/git-helper action:add files:.
```

添加指定文件：
```
/git-helper action:add files:"src/main.ts,README.md"
```

### 3. 提交更改

```
/git-helper action:commit message:"添加新功能"
```

多行提交信息：
```
/git-helper action:commit message:"添加新功能

实现了用户登录功能
优化了性能"
```

### 4. 推送到远程

```
/git-helper action:push
```

推送到指定远程：
```
/git-helper action:push remote:upstream
```

### 5. 从远程拉取

```
/git-helper action:pull
```

### 6. 分支操作

列出所有分支：
```
/git-helper action:branch
```

创建新分支：
```
/git-helper action:branch branch:feature/new-feature
```

### 7. 切换分支

```
/git-helper action:checkout branch:main
```

创建并切换到新分支：
```
/git-helper action:checkout branch:feature/new-feature
```

### 8. 合并分支

```
/git-helper action:merge branch:feature/new-feature
```

### 9. 查看提交历史

```
/git-helper action:log
```

### 10. 查看差异

查看工作区差异：
```
/git-helper action:diff
```

查看暂存区差异：
```
/git-helper action:diff --cached
```

### 11. 重置操作

先预演（安全起见）：
```
/git-helper action:reset dryRun:true
```

### 12. 清理未跟踪文件

先预览：
```
/git-helper action:clean dryRun:true
```

---

## 参数详解

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `files` | string | 否 | 文件列表（add 操作） |
| `message` | string | 否 | 提交信息（commit 操作） |
| `branch` | string | 否 | 分支名称 |
| `remote` | string | 否 | 远程仓库名称（默认 origin） |
| `force` | boolean | 否 | 强制执行（⚠️ 危险） |
| `dryRun` | boolean | 否 | 预演模式 |

---

## 常见工作流程

### 日常开发流程

```bash
# 1. 查看状态
/git-helper action:status

# 2. 添加更改
/git-helper action:add files:.

# 3. 提交
/git-helper action:commit message:"完成新功能"

# 4. 推送
/git-helper action:push
```

### 功能开发流程

```bash
# 1. 创建并切换到新分支
/git-helper action:checkout branch:feature/new-feature

# 2. 开发代码...

# 3. 提交更改
/git-helper action:add files:.
/git-helper action:commit message:"实现新功能"

# 4. 推送
/git-helper action:push

# 5. 合并到主分支
/git-helper action:checkout branch:main
/git-helper action:merge branch:feature/new-feature
```

---

## 安全建议

1. **提交前检查状态**：确认只添加需要提交的文件
2. **使用预演模式**：危险操作前先 dryRun 预演
3. **避免强制推送**：除非确信需要，否则不要使用 force:true
4. **定期拉取**：保持与远程仓库同步

---

## 注意事项

- `force` 参数会强制执行操作，可能导致数据丢失
- `reset` 和 `clean` 是破坏性操作，请谨慎使用
- 合并冲突需要手动解决

---

## 相关资源

- [技能结构详解](../../../docs/01-skill-structure.md)
- [创建第一个技能](../../../docs/02-develop-first-skill.md)
- [常见问题](../../../docs/04-faq.md)
