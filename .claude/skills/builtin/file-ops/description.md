# File Operations Helper - 使用说明

## 概述

`file-ops` 是一个文件操作助手技能，提供常用的文件管理功能，包括搜索、读取、编辑、创建、删除、重命名和列出文件。

---

## 支持的操作

| 操作 | 说明 | 参数 |
|------|------|------|
| `search` | 搜索文件 | `pattern`（必需）, `recursive`（可选） |
| `read` | 读取文件内容 | `path`（必需） |
| `edit` | 编辑文件 | `path`（必需）, `content`（可选） |
| `create` | 创建新文件 | `path`（必需）, `content`（可选） |
| `delete` | 删除文件 | `path`（必需） |
| `rename` | 重命名文件 | `path`（必需，格式：旧路径:新路径） |
| `list` | 列出目录内容 | `path`（可选，默认当前目录）, `recursive`（可选） |

---

## 使用示例

### 1. 搜索文件

按文件名搜索：
```
/file-ops action:search pattern:"*.js"
```

递归搜索：
```
/file-ops action:search pattern:"*.ts" recursive:true
```

按文件名和内容搜索：
```
/file-ops action:search pattern:"README"
```

### 2. 读取文件

```
/file-ops action:read path:src/main.ts
```

### 3. 编辑文件

使用预演模式（推荐先试运行）：
```
/file-ops action:edit path:src/config.json dryRun:true
```

实际编辑：
```
/file-ops action:edit path:src/config.json
```

### 4. 创建文件

创建空文件：
```
/file-ops action:create path:src/utils/helper.ts
```

创建带内容的文件：
```
/file-ops action:create path:src/config.json content:'{"name": "my-app"}'
```

### 5. 删除文件

先预演（安全起见）：
```
/file-ops action:delete path:old-file.js dryRun:true
```

确认后删除：
```
/file-ops action:delete path:old-file.js
```

### 6. 重命名文件

```
/file-ops action:rename path:"old-name.js:new-name.js"
```

### 7. 列出目录

列出当前目录：
```
/file-ops action:list
```

列出指定目录：
```
/file-ops action:list path:src/
```

递归列出：
```
/file-ops action:list path:src/ recursive:true
```

---

## 参数详解

### 通用参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型 |
| `dryRun` | boolean | 否 | 预演模式，不实际执行修改操作 |

### 各操作所需参数

| 操作 | 必需参数 | 可选参数 |
|------|---------|---------|
| search | pattern | recursive |
| read | path | - |
| edit | path | content |
| create | path | content |
| delete | path | - |
| rename | path | - |
| list | - | path, recursive |

---

## 安全建议

1. **删除操作前先预演**：
   ```
   /file-ops action:delete path:test.js dryRun:true
   ```

2. **编辑前先读取确认**：
   ```
   /file-ops action:read path:config.json
   ```

3. **使用相对路径**：便于项目迁移

---

## 注意事项

- 删除操作不可逆，请谨慎使用
- 编辑操作会覆盖文件现有内容
- 路径包含空格时请使用引号
- 大文件读取可能需要较长时间

---

## 相关资源

- [技能结构详解](../../../docs/01-skill-structure.md)
- [创建第一个技能](../../../docs/02-develop-first-skill.md)
- [常见问题](../../../docs/04-faq.md)
