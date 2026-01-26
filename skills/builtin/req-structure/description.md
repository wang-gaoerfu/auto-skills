# req-structure - 需求结构化

## 功能说明

将需求要素整理为标准的软件需求规格说明书（SRS）结构。支持多种模板，满足不同项目类型的需求文档规范。

## 使用场景

- 将 `/req-clarify` 的输出整理为正式文档
- 将零散的需求整理为结构化文档
- 生成符合特定标准的 SRS 文档

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `template` | enum | `srs-practical` | 文档模板类型 |
| `include-diagrams` | boolean | `true` | 是否包含 Mermaid 图表 |

## 模板类型

### srs-practical（推荐）
实用型 SRS 模板，平衡简洁性和完整性，适合大多数项目。

**特点**：
- 结构清晰，易于阅读
- 包含完整的需求要素
- 表格化呈现，便于查阅
- 可选的 Mermaid 图表

### srs-formal
符合 IEEE 830 标准的正式型 SRS，适合大型或关键项目。

**特点**：
- 严格遵循 IEEE 830 标准
- 适合需要正式文档的项目
- 适合外包、政府项目

### agile-backlog
敏捷开发 Backlog 模板，按用户故事和 Sprint 组织。

**特点**：
- 以用户故事为核心
- 包含优先级和故事点
- 适合敏捷开发团队

### user-story
简洁的用户故事模板。

**特点**：
- 极简格式
- 快速上手
- 适合小型项目

## 使用示例

### 生成实用型 SRS

```
/req-structure template:srs-practical
```

### 生成敏捷 Backlog（不含图表）

```
/req-structure template:agile-backlog include-diagrams:false
```

## 输入要求

该技能接受以下格式的输入：

1. **`/req-clarify` 的输出**（推荐）- 9 要素结构
2. **自由文本描述** - 需求的自然语言描述
3. **部分结构化信息** - 已有部分结构的需求

## 文档结构

### srs-practical 结构

```
1. 项目概述
2. 功能需求
   2.1 核心功能 (P0)
   2.2 重要功能 (P1)
   2.3 未来功能 (P2)
   2.4 功能边界
3. 非功能需求
   3.1 性能要求
   3.2 安全要求
   3.3 可用性要求
4. 技术要求
5. 用户体验
6. 验收标准
7. 项目约束
8. 里程碑规划
附录
```

## 配套技能

- `req-clarify` - 需求澄清（前置）
- `doc-generator` - 生成 Markdown 文档（后置）

## 使用流程建议

```
需求收集 → /req-clarify → 需求要素 → /req-structure → 文档结构 → /doc-generator → .md 文件
```
