---
name: one-click-dev
description: |
  一键开发 - 从想法到部署的完整自动化软件开发流程。

  触发条件:
  - 用户说 "一键开发" - 完全自动从想法到部署
  - 用户说 "一键开发 一个XX工具/应用" - 指定方向自动开发
  - 用户说 "验证想法：做一个XX" - 先验证想法再决定是否开发
  - 用户说 "全自动开发" 或 "从零开发"
  - 用户想要一个完整的开发工作流
---

# 一键开发

完整的自动化软件开发流程，从想法生成到最终部署。

## 工作模式

| 模式 | 触发指令 | 流程 |
|------|----------|------|
| 完整模式 | `一键开发` | Phase 0 → 7 全流程 |
| 指定方向 | `一键开发 一个XX工具` | Phase 1 → 7 (跳过想法生成) |
| 验证模式 | `验证想法：做一个XX` | Phase 0 → 1 (输出验证报告) |

## 完整流程

### Phase 0: 💡 想法生成

**目标**: 生成并验证创意想法

**执行步骤**:
1. 使用热点趋势分析，获取当前热门方向
2. 验证想法的技术可行性和市场价值
3. 输出: 想法描述 + 可行性评估

**关键产出**:
- 产品定位
- 目标用户
- 核心功能列表 (3-5个)

---

### Phase 1: 📝 需求分析

**目标**: 明确需求，制定计划

**执行步骤**:
1. 探索需求细节，识别边界情况
2. 创建结构化规划文件
3. 输出: 需求文档 + 任务清单

**关键产出**:
- `task_plan.md` - 任务计划
- `findings.md` - 发现记录
- `progress.md` - 进度跟踪

---

### Phase 2: 🏗️ 架构设计

**目标**: 设计技术架构和实现方案

**执行步骤**:
1. 根据项目类型选择技术栈 (参考 [references/tech-selection.md](references/tech-selection.md))
2. 编写详细实现计划
3. 设计数据模型和 API

**技术栈决策**:
| 项目类型 | 推荐技术栈 | 对应技能 |
|----------|-----------|----------|
| Web 应用 | React + TypeScript + Vite | react-best-practices, typescript-best-practices |
| API 服务 | Python + FastAPI | python-best-practices |
| CLI 工具 | Python/TypeScript | python-best-practices, typescript-best-practices |
| 全栈应用 | Next.js + TypeScript | react-best-practices, typescript-best-practices |

---

### Phase 3: 💻 开发实现

**目标**: 按计划实现功能代码

**执行步骤**:
1. 创建项目目录结构
2. 实现核心功能
3. 遵循对应语言的 best-practices

**目录结构模板**:
```
project/
├── src/
│   ├── components/  (UI组件)
│   ├── services/    (业务逻辑)
│   ├── utils/       (工具函数)
│   └── types/       (类型定义)
├── tests/
├── docs/
├── package.json
└── README.md
```

---

### Phase 3.5: 🔄 代码优化

**目标**: 优化代码质量

**执行步骤**:
1. 移除冗余代码
2. 优化代码结构
3. 统一命名规范
4. 提升可读性

---

### Phase 4: 🔍 质量检查

**目标**: 全面检查代码质量

**检查项**:
1. **代码审查** - 代码质量、设计模式
2. **安全扫描** - 漏洞检测
3. **密钥扫描** - 敏感信息泄露
4. **测试验证** - E2E 测试 (如需要)

**通过标准**:
- 无 Critical 级别问题
- 无安全漏洞
- 无密钥泄露

**检查清单**: 参考 [references/checklists.md](references/checklists.md)

---

### Phase 5: 🐛 问题修复

**目标**: 修复检查发现的问题

**执行步骤**:
1. 使用系统化调试方法定位问题
2. 修复所有 Critical 和 Warning 级别问题
3. 再次优化代码
4. 回归测试

**循环条件**: 如有未解决的 Critical 问题，返回 Phase 4

---

### Phase 6: 📚 文档生成

**目标**: 生成项目文档

**执行步骤**:
1. 生成 README.md
2. 生成 API 文档 (如需要)
3. 添加使用示例

**README 必备内容**:
- 项目简介
- 安装说明
- 使用方法
- 配置说明
- 贡献指南

---

### Phase 7: 🚀 部署发布

**目标**: 配置 CI/CD 并准备部署

**执行步骤**:
1. 生成 GitHub Actions 工作流
2. 配置环境变量模板
3. 准备部署配置

**工作流类型**:
- CI: 代码检查、测试
- CD: 自动构建、部署

---

## 流程图

```
Phase 0 (想法) → Phase 1 (需求) → Phase 2 (架构)
                                         ↓
Phase 7 (部署) ← Phase 6 (文档) ← Phase 3-5 (开发+质量)
```

## 快速启动示例

**完整模式**:
```
用户: 一键开发
AI: 🚀 启动完整开发流程...

    Phase 0: 💡 想法生成
    → 分析热点趋势...
    → 生成创意: [智能待办助手]

    Phase 1: 📝 需求分析
    → 核心功能: 任务管理、智能提醒、数据统计
    → 创建任务计划...

    Phase 2: 🏗️ 架构设计
    → 技术栈: React + TypeScript + Vite
    → 设计数据模型...

    ... (继续各阶段)

    ✅ 开发完成！
    📦 项目已就绪，可执行部署
```

**指定方向**:
```
用户: 一键开发 一个Markdown编辑器
AI: 🚀 开始开发 Markdown 编辑器...

    Phase 1: 📝 需求分析
    → 核心功能: 实时预览、语法高亮、导出功能

    Phase 2: 🏗️ 架构设计
    → 技术栈: React + TypeScript + CodeMirror

    ... (继续开发)
```

**验证模式**:
```
用户: 验证想法：做一个AI写作助手
AI: 🔍 验证想法中...

    Phase 0: 💡 想法分析
    → 市场趋势: AI工具持续热门 ⬆️
    → 竞品分析: 已有多款产品，但细分市场有机会

    Phase 1: 📝 可行性评估
    → 技术可行性: ✅ (API成熟)
    → 开发难度: 中等
    → 建议方向: 聚焦特定垂直领域

    📋 验证报告已生成
    是否继续开发？(y/n)
```

## 依赖技能

| 技能 | 阶段 | 状态 |
|------|------|------|
| hot-topics | Phase 0 | ✅ 已安装 |
| content-strategy | Phase 0 | ✅ 已安装 |
| brainstorming | Phase 0-1 | ✅ 内置 |
| planning-with-files | Phase 1 | ✅ 内置 |
| writing-plans | Phase 2 | ✅ 内置 |
| executing-plans | Phase 3 | ✅ 内置 |
| react-best-practices | Phase 2-3 | ✅ 已安装 |
| typescript-best-practices | Phase 2-3 | ✅ 已安装 |
| python-best-practices | Phase 2-3 | ✅ 已安装 |
| simplify | Phase 3.5 | ✅ 已安装 |
| code-review-expert | Phase 4 | ✅ 已安装 |
| ghost-scan-code | Phase 4 | ✅ 已安装 |
| ghost-scan-secrets | Phase 4 | ✅ 已安装 |
| playwright-skill | Phase 4 | ✅ 已安装 |
| systematic-debugging | Phase 5 | ✅ 已安装 |
| documentation-writer | Phase 6 | ✅ 已安装 |
| github-actions-templates | Phase 7 | ✅ 已安装 |
