# 需求分析系统 - 快速开始

## 5 分钟上手

让我们通过一个实际案例快速了解需求分析系统的使用。

---

## 案例：在线笔记应用

### 第一步：需求澄清

```
/req-clarify project-type:web
```

**系统提示**:

> 你好！我是需求分析师。请告诉我你想要开发什么？

**你的输入**:

```
我想做一个在线笔记应用，类似于 Notion。
```

**系统追问**:

> 1. 与 Notion 相比，你希望有什么特色？
> 2. 核心功能是什么？

**你的回答**:

```
特色是支持 AI 辅助写作和团队协作。
核心功能包括：笔记编辑、文件夹管理、搜索。
```

**系统继续追问**:

> 1. 目标用户是谁？
> 2. 有技术栈偏好吗？
> 3. 期望什么时候上线？

**你的回答**:

```
目标用户是大学生和知识工作者。
希望用 React + Node.js。
期望 3 个月内上线 MVP。
```

---

### 第二步：查看输出

系统会输出 9 要素需求结构：

```markdown
=== 1) 需求概述 ===
• 需求名称: AI 智能笔记应用
• 需求类型: 新开发
• 优先级: P1
• 一句话描述: 支持 AI 辅助写作的在线协作笔记平台

=== 2) 业务背景 ===
• 问题陈述:
  现有笔记工具缺乏 AI 辅助，写作效率低

• 业务目标:
  打造一个提升写作效率的智能笔记平台

=== 3) 目标用户 ===
• 用户画像:
  - 大学生（笔记整理、学习笔记）
  - 知识工作者（知识管理、协作）

=== 4) 功能需求 ===
• 核心功能 (P0):
  1. 笔记编辑（富文本）
  2. 文件夹管理
  3. 搜索功能
  4. 用户注册登录

• 重要功能 (P1):
  1. AI 辅助写作
  2. 团队协作
  3. 版本历史

[... 省略其他要素]
```

---

### 第三步：需求结构化

```
/req-structure
```

系统会输出标准的 SRS 文档结构，包含：
- 文档元信息
- 章节目录
- 格式化的表格
- Mermaid 架构图建议

---

### 第四步：生成文档

```
/doc-generator output-path:requirements/ai-notes.md
```

系统会：
1. 创建 `requirements/` 目录（如果不存在）
2. 生成 Markdown 文件
3. 返回成功消息

```markdown
✓ 文档生成成功

文件路径: requirements/ai-notes.md
文件大小: 12 KB
章节数: 8
```

---

## 参数速查

### req-clarify 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `project-type` | web, mobile, desktop, api, general | 项目类型 |
| `skip-questions` | true, false | 跳过追问 |
| `output-format` | concise, standard, detailed | 输出详细度 |

### req-structure 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `template` | srs-practical, srs-formal, agile-backlog, user-story | 文档模板 |
| `include-diagrams` | true, false | 包含图表 |

### doc-generator 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `output-path` | [路径] | 输出文件路径 |
| `include-toc` | true, false | 包含目录 |
| `include-metadata` | true, false | 包含元信息 |
| `add-mermaid` | true, false | 添加图表 |

---

## 常见命令组合

### 快速生成需求文档

```
/req-clarify skip-questions:true → /doc-generator
```

### 敏捷项目需求

```
/req-clarify → /req-structure template:agile-backlog
```

### 正式 SRS 文档

```
/req-clarify → /req-structure template:srs-formal include-diagrams:true → /doc-generator
```

---

## 下一步

- 查看 [02-examples.md](./02-examples.md) 了解更多示例
- 查看 [03-best-practices.md](./03-best-practices.md) 学习最佳实践
