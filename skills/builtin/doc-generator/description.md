# doc-generator - 需求文档生成器

## 功能说明

将结构化的需求内容生成为格式化的 Markdown 文档文件，支持自定义输出路径和格式选项。

## 使用场景

- 将需求分析结果保存为文档
- 生成可分享的需求规格说明书
- 归档需求文档

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `output-path` | string | 自动生成 | 输出文件路径 |
| `include-toc` | boolean | `true` | 是否包含目录 |
| `include-metadata` | boolean | `true` | 是否包含文档元信息 |
| `add-mermaid` | boolean | `true` | 是否添加 Mermaid 图表 |

## 使用示例

### 默认配置生成文档

```
/doc-generator
```

使用默认配置，自动生成路径和包含所有要素。

### 指定输出路径

```
/doc-generator output-path:docs/requirements/my-project.md
```

将文档生成到指定路径。

### 精简格式（不含目录和元信息）

```
/doc-generator include-toc:false include-metadata:false
```

生成精简版文档，不含目录和元信息头部。

### 不含图表

```
/doc-generator add-mermaid:false
```

生成不含 Mermaid 图表的纯文本文档。

## 输出路径规则

### 用户指定路径

如果指定了 `output-path`，使用该路径：
- 绝对路径：直接使用
- 相对路径：相对于项目根目录

### 自动生成路径

如果未指定 `output-path`，按以下规则生成：

1. 优先从需求内容中提取项目名称
2. 使用 `requirements/[项目名称].md`
3. 如果无项目名称，使用 `requirements/[日期]-需求文档.md`

## 文档格式

### 标准格式包含：

- **元信息头部**（可选）：项目名称、版本、日期、状态
- **目录**（可选）：自动生成的章节目录
- **正文内容**：
  - 项目概述
  - 功能需求
  - 非功能需求
  - 技术要求
  - 用户体验
  - 验收标准
  - 项目约束
  - 里程碑规划
- **Mermaid 图表**（可选）：架构图、流程图等

## 文件命名建议

| 项目类型 | 建议命名 |
|----------|----------|
| 单项目 | `requirements/[项目名称].md` |
| 多项目 | `requirements/[项目名]/[模块名].md` |
| 版本管理 | `requirements/[项目名]-v[版本].md` |
| 日期归档 | `requirements/[YYYY-MM-DD]-[项目名].md` |

## 配套技能

- `req-clarify` - 需求澄清（前置）
- `req-structure` - 需求结构化（前置）

## 完整工作流

```
原始需求 → /req-clarify → 结构化需求 → /req-structure → 文档结构 → /doc-generator → Markdown 文件
```

## 注意事项

1. 文件如果已存在会提示覆盖确认
2. 确保有目标目录的写入权限
3. 建议定期版本控制生成的文档
