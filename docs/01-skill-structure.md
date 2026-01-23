# 01 - 技能结构详解

本指南详细解释 Claude Code 技能的每个组成部分，帮助你理解技能的工作原理。

---

## 目录

1. [技能目录结构](#技能目录结构)
2. [skill.json 详解](#skilljson-详解)
3. [prompt.md 详解](#promptmd-详解)
4. [description.md 详解](#descriptionmd-详解)
5. [可选文件](#可选文件)

---

## 技能目录结构

一个标准的技能目录如下：

```
my-skill/
├── skill.json      # 【必需】技能元数据配置
├── prompt.md       # 【必需】核心提示词
├── description.md  # 【推荐】使用说明文档
├── examples/       # 【可选】使用示例
│   └── example1.md
└── schema.json     # 【可选】参数的 JSON Schema
```

### 文件说明

| 文件 | 必需 | 作用 |
|------|------|------|
| `skill.json` | 是 | 定义技能的基本信息和参数 |
| `prompt.md` | 是 | 核心提示词，定义技能的行为 |
| `description.md` | 否 | 对用户的详细使用说明 |
| `examples/` | 否 | 使用示例集合 |
| `schema.json` | 否 | 参数的 JSON Schema 定义 |

---

## skill.json 详解

### 基本结构

```json
{
  "name": "my-skill",
  "displayName": "My First Skill",
  "description": "简短描述技能功能",
  "version": "1.0.0",
  "author": "Your Name",
  "parameters": { ... }
}
```

### 字段详解

#### name（技能名称）

- **类型**：string
- **必需**：是
- **说明**：调用技能时使用的命令名（不含 `/` 前缀）
- **规则**：
  - 使用 kebab-case（小写字母和连字符）
  - 不能包含空格或特殊字符
  - 不要与内置命令冲突

**示例**：
```json
"name": "code-review"     // ✓ 正确
"name": "git_helper"      // ✗ 错误（应使用 git-helper）
"name": "My Skill"        // ✗ 错误（包含空格）
```

#### displayName（显示名称）

- **类型**：string
- **必需**：否
- **说明**：在帮助信息中显示的名称

**示例**：
```json
"displayName": "Code Reviewer"
```

#### description（描述）

- **类型**：string
- **必需**：是
- **说明**：简短描述技能的功能

**示例**：
```json
"description": "对代码进行全面审查，发现潜在问题"
```

#### version（版本号）

- **类型**：string
- **必需**：是
- **格式**：语义化版本号 `MAJOR.MINOR.PATCH`

**版本规则**：
- `MAJOR`：不兼容的 API 修改
- `MINOR`：向下兼容的功能性新增
- `PATCH`：向下兼容的问题修正

**示例**：
```json
"version": "1.0.0"   // 初始版本
"version": "1.1.0"   // 添加新功能
"version": "2.0.0"   // 重大更新
```

#### author（作者）

- **类型**：string
- **必需**：否
- **说明**：技能作者信息

**示例**：
```json
"author": "张三 <zhangsan@example.com>"
```

#### parameters（参数定义）

- **类型**：object
- **必需**：否（但推荐）
- **说明**：定义用户可以传递给技能的参数

**完整示例**：
```json
{
  "parameters": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": ["fast", "slow"],
        "description": "操作模式"
      },
      "count": {
        "type": "number",
        "description": "数量",
        "default": 10
      }
    },
    "required": ["mode"]
  }
}
```

##### properties（参数列表）

每个参数可以包含以下字段：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 参数类型：string/number/boolean/array/object |
| `description` | string | 否 | 参数描述 |
| `default` | 任意 | 否 | 默认值 |
| `enum` | array | 否 | 可选值列表 |

##### required（必需参数）

指定哪些参数是必须提供的：

```json
"required": ["mode", "target"]
```

---

## prompt.md 详解

### 基本结构

```markdown
# 技能标题

角色定义...

## 参数说明

{{if mode}}
当前模式: {{mode}}
{{endif}}

## 操作指南

操作步骤...

## 输出格式

成功/失败/警告的输出格式
```

### 关键概念

#### 1. 角色定义

在开头定义 AI 的角色：

```markdown
你是一个专业的代码审查专家，职责包括：
- 分析代码质量
- 发现潜在 bug
- 提供改进建议
```

#### 2. 参数引用

使用 `{{参数名}}` 引用参数值：

```markdown
{{if target}}
分析目标: {{target}}
{{endif}}
```

#### 3. 条件判断

使用 `{{if}}` 进行条件判断：

```markdown
{{if verbose}}
详细模式已启用...
{{endif}}
```

嵌套判断：

```markdown
{{if mode}}
{{if mode == "fast"}}
快速模式...
{{endif}}
{{endif}}
```

#### 4. 操作指南

详细说明如何处理不同情况：

```markdown
## 操作指南

### 快速模式

1. 读取文件
2. 快速分析
3. 输出摘要

### 详细模式

1. 读取文件
2. 深度分析
3. 输出完整报告
```

---

## description.md 详解

这是给用户看的详细使用说明，格式可以自由组织。

### 推荐结构

```markdown
# 技能名称 - 使用说明

## 概述
简短介绍

## 支持的操作
表格列出所有操作

## 参数详解
表格列出所有参数

## 使用示例
具体的调用示例

## 注意事项
重要提醒

## 相关资源
相关文档链接
```

---

## 可选文件

### examples/ 目录

存放使用示例：

```
examples/
├── basic-example.md
└── advanced-example.md
```

### schema.json

参数的 JSON Schema 定义，用于验证和文档生成：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "mode": { "type": "string" },
    "count": { "type": "number" }
  },
  "required": ["mode"]
}
```

---

## 最佳实践

1. **命名规范**：统一使用 kebab-case
2. **版本管理**：使用语义化版本号
3. **文档完整**：提供详细的 description.md
4. **参数清晰**：每个参数都有描述
5. **输出友好**：使用图标和表格格式化输出

---

## 下一步

理解了技能结构后，开始 [创建你的第一个技能](./02-develop-first-skill.md)！
