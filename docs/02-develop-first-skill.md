# 02 - 创建第一个技能

本指南将手把手教你创建你的第一个 Claude Code 技能。

---

## 目录

1. [准备工作](#准备工作)
2. [创建技能目录](#创建技能目录)
3. [编写 skill.json](#编写-skilljson)
4. [编写 prompt.md](#编写-promptmd)
5. [编写 description.md](#编写-descriptionmd)
6. [测试技能](#测试技能)
7. [常见问题](#常见问题)

---

## 准备工作

### 确定技能功能

在开始之前，先想清楚你的技能要做什么。例如：

- 代码格式化助手
- 测试用例生成器
- 文档更新工具
- 配置文件转换器

### 使用的工具

Claude Code 提供以下工具供技能使用：

| 工具 | 用途 |
|------|------|
| `Read` | 读取文件内容 |
| `Write` | 创建或覆盖文件 |
| `Edit` | 编辑文件特定部分 |
| `Glob` | 搜索文件路径 |
| `Grep` | 搜索文件内容 |
| `Bash` | 执行系统命令 |

---

## 创建技能目录

### 使用模板（推荐）

项目提供了 `skills/templates/basic-skill/` 模板，直接复制：

```bash
# Windows
xcopy /E /I skills\templates\basic-skill skills\builtin\my-skill

# Linux/Mac
cp -r skills/templates/basic-skill skills/builtin/my-skill
```

### 手动创建

```bash
# 创建目录
mkdir skills/builtin/my-skill

# 创建文件
touch skills/builtin/my-skill/skill.json
touch skills/builtin/my-skill/prompt.md
touch skills/builtin/my-skill/description.md
```

---

## 编写 skill.json

让我们创建一个简单的「代码计数器」技能，统计代码行数。

```json
{
  "name": "code-counter",
  "displayName": "Code Counter",
  "description": "统计代码文件的行数和字符数",
  "version": "1.0.0",
  "author": "Your Name",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "要统计的文件或目录路径"
      },
      "pattern": {
        "type": "string",
        "description": "文件匹配模式，如 *.ts",
        "default": "*.*"
      }
    },
    "required": ["path"]
  }
}
```

### 逐行解释

```json
{
  // 技能名称，调用时使用 /code-counter
  "name": "code-counter",

  // 显示名称
  "displayName": "Code Counter",

  // 简短描述
  "description": "统计代码文件的行数和字符数",

  // 版本号
  "version": "1.0.0",

  // 作者
  "author": "Your Name",

  // 参数定义
  "parameters": {
    "type": "object",
    "properties": {
      // path 参数：文件路径
      "path": {
        "type": "string",
        "description": "要统计的文件或目录路径"
      },
      // pattern 参数：文件匹配模式
      "pattern": {
        "type": "string",
        "description": "文件匹配模式，如 *.ts",
        "default": "*.*"  // 默认值
      }
    },
    // 必需参数
    "required": ["path"]
  }
}
```

---

## 编写 prompt.md

这是技能的核心，定义 AI 如何工作：

```markdown
# Code Counter

你是一个代码统计助手，帮助用户统计代码文件的行数和字符数。

## 参数说明

{{if path}}
目标路径: `{{path}}`
{{endif}}

{{if pattern}}
文件模式: `{{pattern}}`
{{endif}}

---

## 操作指南

### 统计单个文件

1. 使用 Read 工具读取文件内容
2. 计算行数和字符数
3. 输出统计结果

### 统计目录

1. 使用 Glob 工具查找匹配的文件
2. 对每个文件进行统计
3. 汇总总行数和总字符数
4. 以表格形式展示

---

## 输出格式

### 单个文件

```
✓ 统计完成

文件: src/main.ts
行数: 150
字符数: 4500
空白行: 20
```

### 多个文件

```
✓ 统计完成

找到 5 个匹配文件:

| 文件       | 路径        | 行数 | 字符数 |
|-----------|------------|------|--------|
| main.ts   | src/       | 150  | 4500   |
| utils.ts  | src/utils/ | 80   | 2400   |

总计:
- 文件数: 5
- 总行数: 650
- 总字符数: 19500
```

### 错误输出

```
✗ 统计失败

错误信息: 文件不存在

建议: 请检查路径是否正确
```
```

### 关键点解释

1. **参数引用**：`{{path}}` 和 `{{pattern}}` 会替换为用户输入的值
2. **条件判断**：`{{if path}}` 确保只有提供了参数才显示相关信息
3. **工具使用**：明确使用 Read 和 Glob 工具
4. **输出格式**：定义清晰的输出模板

---

## 编写 description.md

这是给用户看的文档：

```markdown
# Code Counter - 使用说明

## 概述

`code-counter` 是一个代码统计技能，用于统计代码文件的行数和字符数。

## 使用方法

### 统计单个文件

```
/code-counter path:src/main.ts
```

### 统计目录

```
/code-counter path:src/ pattern:"*.ts"
```

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| path | string | 是 | - | 文件或目录路径 |
| pattern | string | 否 | *.* | 文件匹配模式 |

## 示例输出

```
✓ 统计完成

找到 5 个匹配文件:

| 文件       | 路径        | 行数 | 字符数 |
|-----------|------------|------|--------|
| main.ts   | src/       | 150  | 4500   |

总计:
- 文件数: 5
- 总行数: 650
- 总字符数: 19500
```

## 注意事项

- 支持相对路径和绝对路径
- 路径包含空格时请使用引号
```

---

## 测试技能

### 1. 查看技能列表

```
/help
```

确认 `code-counter` 在列表中。

### 2. 测试单个文件

```
/code-counter path:README.md
```

### 3. 测试目录

```
/code-counter path:docs/ pattern:"*.md"
```

### 4. 检查输出

验证输出格式是否符合预期。

---

## 调试技巧

### 输出更多调试信息

在 prompt.md 中添加调试输出：

```markdown
## 调试信息

参数:
- path: {{path}}
- pattern: {{pattern}}
```

### 使用 Read 工具优先

```markdown
优先使用 Read 工具而非 Bash cat 命令
```

### 分步骤输出

```markdown
步骤 1: 查找文件...
步骤 2: 读取内容...
步骤 3: 统计数据...
```

---

## 进阶功能

### 添加更多参数

```json
{
  "properties": {
    "path": { "type": "string" },
    "pattern": { "type": "string" },
    "exclude": {
      "type": "string",
      "description": "排除的文件模式，如 *.test.ts"
    },
    "includeComments": {
      "type": "boolean",
      "description": "是否统计注释行",
      "default": true
    }
  }
}
```

### 在 prompt.md 中使用

```markdown
{{if exclude}}
排除模式: {{exclude}}
{{endif}}

{{if includeComments}}
包含注释行统计
{{endif}}
```

---

## 常见问题

### Q: 参数没有传递进来？

A: 检查 skill.json 中的参数定义是否正确，确认参数名拼写一致。

### Q: 技能没有被识别？

A: 确保 `.claude/skills/` 链接正确，或重启 Claude Code。

### Q: 输出格式不对？

A: 检查 prompt.md 中的输出模板，确保使用正确的格式化语法。

---

## 下一步

完成了第一个技能后，可以：

1. 阅读 [高级主题](./03-advanced-topics.md)
2. 查看 [内置技能](../skills/builtin/) 源码学习
3. 尝试创建更复杂的技能

祝你开发顺利！
