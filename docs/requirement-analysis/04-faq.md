# 需求分析系统 - 常见问题

## 通用问题

### Q1: 需求分析系统和 task-clarify 有什么区别？

**A**: 它们服务于不同的阶段：

| 特性 | task-clarify | req-clarify |
|------|-------------|-------------|
| **用途** | 任务拆解 | 需求分析 |
| **使用时机** | 需求明确后 | 需求不明确时 |
| **输出** | 任务清单 | 需求文档 |

**典型流程**:
```
需求不明确 → /req-clarify → 需求明确 → /task-clarify → 任务清单
```

### Q2: 可以直接用 doc-generator 吗？

**A**: 可以，但不推荐。doc-generator 需要结构化的输入，建议先使用 req-clarify 和 req-structure。

**不推荐**:
```
/doc-generator
→ 可能生成不完整的文档
```

**推荐**:
```
/req-clarify → /req-structure → /doc-generator
→ 生成完整、专业的文档
```

---

## req-clarify 问题

### Q3: skip-questions 什么时候用？

**A**: 以下情况适合使用 `skip-questions:true`：

- 你已经准备了完整的需求描述
- 不需要系统追问
- 想要快速生成需求结构

**示例**:
```
/req-clarify skip-questions:true

[粘贴你准备好的需求描述]
```

### Q4: project-type 如何选择？

**A**: 根据你的项目类型选择：

| 类型 | 适用项目 | 特殊追问 |
|------|----------|----------|
| `web` | Web 应用 | 前端框架、响应式、浏览器兼容 |
| `mobile` | 移动应用 | 平台选择、原生/跨平台、离线 |
| `desktop` | 桌面应用 | 操作系统、安装部署 |
| `api` | API 服务 | 接口设计、认证、文档 |
| `general` | 通用/不确定 | 综合性问题 |

**不确定时**：
```
/req-clarify project-type:general
或
/req-clarify  # 默认就是 general
```

### Q5: 9 要素框架是什么？

**A**: 9 要素框架是一个完整的需求分析结构：

1. 需求概述 - 项目基本信息
2. 业务背景 - 为什么要做
3. 目标用户 - 给谁用
4. 功能需求 - 做什么
5. 非功能需求 - 做多好
6. 技术约束 - 技术限制
7. 用户体验 - 交互体验
8. 验收标准 - 如何验收
9. 项目约束 - 时间、资源限制

---

## req-structure 问题

### Q6: 四种模板如何选择？

**A**:

```
srs-practical  →  大多数项目（推荐）
srs-formal     →  大型/外包/需要严格标准的
agile-backlog  →  敏捷开发/Scrum
user-story     →  小型项目/快速原型
```

### Q7: Mermaid 图表有什么用？

**A**: Mermaid 图表可以增强文档的可读性：

- **架构图** - 展示系统架构
- **流程图** - 展示业务流程
- **甘特图** - 展示时间规划
- **时序图** - 展示交互流程

**使用建议**:
- 文档较复杂时建议启用
- 简单文档可以禁用以减少篇幅

### Q8: 可以自定义模板吗？

**A**: 目前不支持，但你可以：

1. 使用 `srs-practical` 作为基础
2. 生成后手动编辑
3. 未来版本可能支持自定义模板

---

## doc-generator 问题

### Q9: output-path 如何写？

**A**: 支持相对路径和绝对路径：

```
# 相对路径（推荐）
/doc-generator output-path:requirements/project.md

# 绝对路径
/doc-generator output-path:D:/docs/project.md

# 带子目录
/doc-generator output-path:requirements/ecommerce/v1.0.md
```

**注意**: 相对路径相对于项目根目录。

### Q10: 如果文件已存在会怎样？

**A**: 系统会覆盖现有文件。建议：

1. 使用版本控制（Git）
2. 或者在文件名中包含版本号
3. 或者备份旧文件

### Q11: 可以生成其他格式吗？

**A**: 当前只支持 Markdown (.md)。但你可以：

1. 使用 Markdown 编辑器导出为 PDF/Word
2. 使用 Pandoc 转换格式
3. 未来版本可能支持其他格式

---

## 工作流问题

### Q12: 完整流程需要多久？

**A**: 取决于需求复杂度：

```
简单项目: 10-15 分钟
  - 需求澄清: 5-10 分钟（对话）
  - 结构化: <1 分钟
  - 文档生成: <1 分钟

复杂项目: 30-60 分钟
  - 需求澄清: 20-50 分钟（多轮对话）
  - 结构化: <2 分钟
  - 文档生成: <1 分钟
```

### Q13: 可以分多次完成吗？

**A**: 可以！建议方式：

```
# Session 1: 需求澄清
/req-clarify
[保存输出到临时文件]

# Session 2: 需求结构化
/req-structure
[使用之前保存的内容]

# Session 3: 文档生成
/doc-generator
```

### Q14: 如何更新已有需求文档？

**A**:

1. **小变更** - 直接编辑 Markdown 文件
2. **中变更** - 重新运行 `/req-structure` 并手动合并
3. **大变更** - 重新运行 `/req-clarify`

**建议**: 在文档末尾维护变更记录

---

## 技术问题

### Q15: 生成的文档可以编辑吗？

**A**: 完全可以！生成的 Markdown 文件是纯文本，你可以：

- 使用任何文本编辑器编辑
- 使用 Markdown 编辑器预览
- 提交到 Git 版本控制

### Q16: 支持哪些 Markdown 语法？

**A**: 支持标准 Markdown + GitHub 扩展：

- 标题、列表、表格
- 代码块、引用
- 任务列表
- Mermaid 图表

### Q17: 文档存储在哪里？

**A**: 由 `output-path` 参数决定：

- 默认：`requirements/` 目录
- 自定义：你指定的任何路径

**建议**: 将 `requirements/` 纳入版本控制。

---

## 故障排查

### Q18: 技能不可用怎么办？

**A**: 检查以下几点：

```
1. 检查符号链接是否正确
   ls .claude/skills/builtin

2. 确认技能文件存在
   ls skills/builtin/req-clarify

3. 尝试重新加载
   /help
```

### Q19: 输出不符合预期？

**A**:

1. **检查参数** - 确认参数拼写和值正确
2. **检查输入** - 确认输入信息充分
3. **使用标准流程** - 按推荐流程使用三个技能

### Q20: 找不到生成的文档？

**A**:

1. 检查 `output-path` 参数
2. 查看项目根目录的 `requirements/` 文件夹
3. 使用搜索工具查找 `.md` 文件

---

## 更多帮助

- 项目 GitHub: [auto-skills](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 贡献指南: [CONTRIBUTING.md](../../CONTRIBUTING.md)
