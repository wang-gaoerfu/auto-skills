# 03 - 高级主题

本指南介绍技能开发的高级概念和技巧。

---

## 目录

1. [参数高级用法](#参数高级用法)
2. [条件逻辑](#条件逻辑)
3. [错误处理](#错误处理)
4. [技能组合](#技能组合)
5. [性能优化](#性能优化)
6. [最佳实践](#最佳实践)

---

## 参数高级用法

### 多类型参数

使用 `oneOf` 或灵活的类型定义：

```json
{
  "properties": {
    "target": {
      "type": "string",
      "description": "目标：可以是文件路径、目录路径或 URL"
    }
  }
}
```

### 数组参数

虽然 JSON Schema 支持数组，但技能参数通常使用字符串数组表示：

```json
{
  "properties": {
    "files": {
      "type": "string",
      "description": "文件列表，用逗号分隔",
      "example": "file1.ts,file2.ts,file3.ts"
    }
  }
}
```

在 SKILL.md 中处理：

```markdown
{{if files}}
文件列表:
{{#each (split files ',') }}
- {{this}}
{{/each}}
{{endif}}
```

### 复合参数

```json
{
  "properties": {
    "options": {
      "type": "string",
      "description": "JSON 格式的选项对象",
      "example": '{"verbose":true,"dryRun":false}'
    }
  }
}
```

---

## 条件逻辑

### 基本条件

```markdown
{{if verbose}}
详细模式已启用
{{endif}}
```

### 多条件

```markdown
{{if verbose}}
{{if mode == "detailed"}}
详细 + 详细模式
{{endif}}
{{endif}}
```

### 条件嵌套

```markdown
{{if action}}
执行操作: {{action}}

{{if action == "search"}}
搜索模式...
{{endif}}

{{if action == "edit"}}
编辑模式...
{{endif}}
{{endif}}
```

### else 分支

虽然 Claude 的模板引擎可能不支持 `{{else}}`，但可以通过嵌套实现：

```markdown
{{if mode == "fast"}}
快速模式
{{endif}}

{{if mode != "fast"}}
非快速模式
{{endif}}
```

---

## 错误处理

### 错误检测

```markdown
## 错误处理

{{if path}}
检查文件是否存在...
{{endif}}

如果文件不存在，显示错误：
```

✗ 操作失败

错误信息: 找不到指定的文件

建议: 检查路径拼写是否正确
```
```

### 错误分类

```markdown
## 错误类型

| 错误类型 | 说明 | 处理方式 |
|---------|------|---------|
| 文件不存在 | 找不到指定文件 | 提示检查路径 |
| 权限不足 | 无访问权限 | 提示检查权限 |
| 格式错误 | 文件格式不正确 | 提示使用正确格式 |
```

### 用户友好的错误提示

```markdown
错误信息要：

1. **明确指出问题**
   ```
   ✗ 文件读取失败
   找不到文件: src/config.json
   ```

2. **提供解决建议**
   ```
   建议：
   - 检查文件路径拼写
   - 确认文件是否存在
   - 尝试使用完整路径
   ```

3. **避免技术术语**
   ```
   ❌ "File not found, error code: ENOENT"
   ✓ "找不到指定的文件，请检查路径"
   ```
```

---

## 技能组合

### 调用其他技能

```markdown
## 工作流程

1. 使用 file-ops 搜索相关文件
2. 读取文件内容
3. 进行处理
4. 使用 file-ops 写入结果
```

### 共享配置

在多个技能中使用相同的参数命名规范：

```json
// 通用参数
{
  "verbose": { "type": "boolean" },
  "dryRun": { "type": "boolean" },
  "path": { "type": "string" }
}
```

---

## 性能优化

### 减少不必要的操作

```markdown
❌ 低效方式：
- 读取整个文件
- 处理
- 再次读取文件

✓ 高效方式：
- 读取文件一次
- 处理
- 使用缓存结果
```

### 使用合适的工具

| 场景 | 推荐工具 | 避免使用 |
|------|---------|---------|
| 读取文件 | Read | Bash cat |
| 搜索文件 | Glob | Bash find |
| 搜索内容 | Grep | Bash grep |
| 写入文件 | Write | Bash echo |

### 限制输出

```markdown
{{if verbose}}
详细输出...
{{else}}
简要输出...
{{endif}}
```

---

## 最佳实践

### 1. 参数命名

使用统一的命名规范：

```markdown
- ✅ path, file, target
- ❌ filePath, fileName, targetPath
```

### 2. 输出格式

使用一致的输出格式：

```markdown
成功操作:
✓ 操作成功
[结果]

失败操作:
✗ 操作失败
[错误信息]
```

### 3. 用户确认

危险操作前确认：

```markdown
{{if action == "delete"}}
⚠️ 危险操作警告

即将删除: {{path}}

确认后继续执行，或使用 dryRun:true 预演
{{endif}}
```

### 4. 文档完整

每个技能都应包含：

- `skill.json` - 元数据
- `SKILL.md` - 核心逻辑
- `description.md` - 使用说明

### 5. 版本管理

使用语义化版本号：

```markdown
1.0.0 - 初始版本
1.1.0 - 添加新功能（向下兼容）
1.1.1 - 修复 bug
2.0.0 - 重大更新（可能不兼容）
```

---

## 调试技巧

### 添加调试输出

```markdown
## 调试信息

{{if verbose}}
参数:
- action: {{action}}
- path: {{path}}
- verbose: {{verbose}}
{{endif}}
```

### 分步验证

```markdown
步骤 1: 检查输入
[验证逻辑]

步骤 2: 执行操作
[操作逻辑]

步骤 3: 验证结果
[验证逻辑]
```

---

## 常见模式

### 文件处理模式

```markdown
1. 检查文件是否存在
2. 读取文件内容
3. 处理内容
4. 验证结果
5. 输出反馈
```

### 搜索模式

```markdown
1. 接收搜索条件
2. 使用 Glob/Grep 搜索
3. 过滤结果
4. 格式化输出
```

### 批量操作模式

```markdown
1. 收集目标列表
2. {{if dryRun}}预演{{else}}执行{{endif}}
3. 统计结果
4. 输出汇总
```

---

## 下一步

掌握了高级主题后，你可以：

1. 创建复杂的组合技能
2. 优化现有技能的性能
3. 贡献你的技能到社区

查看 [常见问题](./04-faq.md) 获取更多帮助。
