# skill-manager - 使用说明

## 概述

`skill-manager` 是一个 Skills 管理助手技能，提供本地 skills 的增删改查功能，支持智能推荐、快速创建、编辑和删除技能。

---

## 支持的操作

| 操作 | 说明 | 命令格式 |
|------|------|----------|
| list | 列出所有技能 | `/skill-manager action:list` |
| recommend | 智能推荐技能 | `/skill-manager action:recommend query:"需求描述"` |
| create | 创建新技能 | `/skill-manager action:create query:"技能名称"` |
| delete | 删除技能 | `/skill-manager action:delete query:"技能名称"` |
| edit | 编辑技能 | `/skill-manager action:edit query:"技能名称" file:"文件名"` |

---

## 快速开始

### 列出所有技能

```
/skill-manager action:list
```

显示所有本地技能的名称、描述、版本和路径。

### 智能推荐技能

```
/skill-manager action:recommend query:"帮我管理 git 提交"
```

根据你的需求描述，AI 自动推荐最相关的技能。

### 创建新技能

```
/skill-manager action:create query:"my-skill"
```

基于模板快速创建新技能，交互式引导填写信息。

### 删除技能

```
/skill-manager action:delete query:"old-skill"
```

删除指定技能（需确认）。

### 编辑技能

```
/skill-manager action:edit query:"git-helper" file:"SKILL.md"
```

编辑技能的指定文件。

---

## 参数详解

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `action` | string | 是 | - | 操作类型：list/recommend/create/delete/edit |
| `query` | string | 否* | - | 需求描述（recommend）或技能名称（create/delete/edit） |
| `file` | string | 否 | - | 要编辑的文件：skill.json/SKILL.md/description.md |
| `dry-run` | boolean | 否 | false | 预演模式，只显示操作不执行 |

*注：query 参数在 create/delete/edit 操作中为必需

---

## 使用示例

### 示例 1：查看所有技能

```
/skill-manager action:list
```

输出：
```
✓ 找到 6 个技能

| 名称 | 显示名称 | 描述 | 版本 | 路径 |
|------|----------|------|------|------|
| doc-generator | 需求文档生成器 | 生成结构化的 Markdown... | 1.0.0 | builtin/ |
| file-ops | File Operations Helper | 文件操作助手... | 1.0.0 | builtin/ |
| git-helper | Git Operations Helper | Git 操作助手... | 1.0.0 | builtin/ |
| req-clarify | 需求分析助手 | 通过对话收集和分析... | 1.0.0 | builtin/ |
| req-structure | 需求结构化 | 将需求要素整理为... | 1.0.0 | builtin/ |
| task-clarify | Task Clarify | 任务澄清与拆解助手... | 1.0.0 | builtin/ |
```

### 示例 2：推荐技能

```
/skill-manager action:recommend query:"我需要分析一个新功能的需求"
```

输出：
```
✓ 推荐技能

根据你的需求"我需要分析一个新功能的需求"，推荐以下技能：

1. req-clarify
   理由: 专门用于需求收集和分析，通过对话输出结构化需求

2. task-clarify
   理由: 如果需求已经明确，可以继续使用此技能拆解任务

3. req-structure
   理由: 将需求整理为标准的需求规格说明书结构
```

### 示例 3：创建新技能

```
/skill-manager action:create query:"code-review"
```

输出：
```
✓ 创建技能模板

正在创建技能: code-review

请输入以下信息：
1. 显示名称: Code Reviewer
2. 描述: 代码审查助手，帮助检查代码质量
3. 作者: Your Name

✓ 技能创建成功

名称: code-review
显示名称: Code Reviewer
描述: 代码审查助手，帮助检查代码质量

路径: builtin/code-review/
文件:
  - skill.json
  - SKILL.md
  - description.md

下一步：编辑 SKILL.md 定义技能行为
```

### 示例 4：删除技能

```
/skill-manager action:delete query:"old-skill"
```

输出：
```
⚠️ 即将删除技能

技能名称: old-skill
显示名称: Old Skill
描述: 这是一个过时的技能
路径: builtin/old-skill/
文件数: 3

确认删除? (yes/no): yes

✓ 技能已删除

已删除: builtin/old-skill/
```

### 示例 5：编辑技能

```
/skill-manager action:edit query:"git-helper" file:"SKILL.md"
```

输出：
```
✓ 文件编辑成功

文件: builtin/git-helper/SKILL.md
修改: 更新了提交流程说明
```

---

## 输出示例

### 成功输出

```
✓ 操作成功

处理完成：
- 扫描技能: 6
- 显示技能: 6
```

### 错误输出

```
✗ 操作失败

错误信息: 技能不存在

原因分析:
找不到指定的技能 "unknown-skill"

解决建议:
1. 使用 /skill-manager list 查看所有可用技能
2. 检查技能名称拼写是否正确
```

---

## 注意事项

1. **技能命名**：创建技能时，名称必须使用 kebab-case 格式（小写字母和连字符）
2. **删除确认**：删除操作需要确认，请仔细查看要删除的技能信息
3. **模板保护**：不允许删除 templates 目录下的模板技能
4. **community 只读**：community 目录为只读，不能修改或删除

---

## 故障排除

### 问题 1：技能创建失败

**症状**：创建技能时报错

**解决方法**：
1. 检查技能名称格式是否正确（kebab-case）
2. 确认是否已存在同名技能
3. 检查 templates/basic-skill/ 模板是否存在

### 问题 2：删除被拒绝

**症状**：删除技能时提示"无法删除"

**解决方法**：
1. 确认不是 templates 目录下的技能
2. 检查是否有删除权限

### 问题 3：推荐结果不准确

**症状**：推荐的技能与需求不符

**解决方法**：
1. 使用更详细的需求描述
2. 尝试不同的关键词
3. 使用 list 查看所有技能，手动选择

---

## 相关资源

- [技能结构详解](../../../docs/01-skill-structure.md)
- [创建第一个技能](../../../docs/02-develop-first-skill.md)
- [高级主题](../../../docs/03-advanced-topics.md)
- [常见问题](../../../docs/04-faq.md)
