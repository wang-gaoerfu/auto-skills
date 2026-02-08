# 前端设计方案 v2.1

## 1. 整体布局架构

### 1.1 经典管理后台布局（推荐）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER 顶部导航栏                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  🔄 Spark    🔍 搜索知识库...         [+ 上传] [📁 知识库] [🏷️ 类别]    👤 │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│          │                                                                      │
│  SIDEBAR │                         主内容区域 (MAIN)                              │
│  左侧菜单 │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │                                                             │  │
│  ┌──────┐│  │         [根据当前菜单项显示不同内容]                          │  │
│  │ 💬   ││  │                                                             │  │
│  │对话  ││  │   对话 / 知识库管理 / 类别管理 / 仪表盘 / 设置                │  │
│  └──────┘│  │                                                             │  │
│          │  │                                                             │  │
│  ┌──────┐│  │                                                             │  │
│  │ 📚   ││  │                                                             │  │
│  │知识库││  │                                                             │  │
│  └──────┘│  │                                                             │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────┐│                                                                      │
│  │ 🏷️   ││                                                                      │
│  │类别  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ 📊   ││                                                                      │
│  │仪表盘││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ ⚙️   ││                                                                      │
│  │设置  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

**菜单顺序说明**：
- 🏠 **首页是对话页面**，打开应用即可直接开始问答
- 📁 顶部导航栏提供快速操作入口（上传文件、知识库、类别）
- 📊 仪表盘作为数据统计页面，放在后面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER 顶部导航栏                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  🔄 Spark    🔍 搜索知识库...    [+ 📁 上传] [📚 知识库] [🏷️ 类别] [⚙️] 👤   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│          │                                                                      │
│  SIDEBAR │                         主内容区域 (MAIN)                              │
│  左侧菜单 │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │                                                             │  │
│  ┌──────┐│  │         [根据当前菜单项显示不同内容]                          │  │
│  │ 📊   ││  │                                                             │  │
│  │仪表盘││  │   仪表盘 / 知识库管理 / 对话 / 类别管理 / 设置               │  │
│  └──────┘│  │                                                             │  │
│          │  │                                                             │  │
│  ┌──────┐│  │                                                             │  │
│  │ 📚   ││  │                                                             │  │
│  │知识库││  │                                                             │  │
│  └──────┘│  │                                                             │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────┐│                                                                      │
│  │ 💬   ││                                                                      │
│  │对话  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ 🏷️   ││                                                                      │
│  │类别  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ ⚙️   ││                                                                      │
│  │设置  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 1.2 布局组件结构

```typescript
// 前端整体布局结构

<DashboardLayout>
  <Header />
  <div class="layout-container">
    <Sidebar />
    <MainContent>
      {/* 根据 activeMenu 显示不同内容 */}
      {activeMenu === 'chat' && <ChatPage />}                    {/* 首页 */}
      {activeMenu === 'knowledge' && <KnowledgeManagementPage />}
      {activeMenu === 'categories' && <CategoryManagementPage />}
      {activeMenu === 'dashboard' && <DashboardPage />}
      {activeMenu === 'settings' && <SettingsPage />}
    </MainContent>
  </div>
</DashboardLayout>
```

---

## 2. 详细页面设计

### 2.1 对话页面 - 首页 (Chat)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                          │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│   MENU   │  📊 知识库仪表盘                                                       │
│          │                                                                      │
│  📊 仪表盘│  ┌──────────────────────────────────────────────────────────────┐  │
│  📚 知识库│  │  统计概览                                                      │  │
│  💬 对话  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  🏷️ 类别  │  │  │ 📚 415   │  │ 📄 12.5M │  │ 🏷️ 5     │  │ 💬 1.2K  │      │  │
│  ⚙️ 设置  │  │  │  总文档数  │  │  总字符数  │  │  类别数   │  │  对话数   │      │  │
│          │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│          │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │  📈 最近活动                                                  │  │
│          │  │  ┌────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 📄 今天 10:30  上传了"教练技术工具手册.docx"             │  │  │
│          │  │  │ 🏷️ 今天 09:15  创建了新类别"沟通技巧"                   │  │  │
│          │  │  │ 💬 昨天 18:20  完成了 23 次对话                         │  │  │
│          │  │  │ 📚 昨天 14:00  添加了 15 个文档到"领导力测评"           │  │  │
│          │  │  └────────────────────────────────────────────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│          │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │  🏷️ 类别概览                                                  │  │
│          │  │  ┌────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 🎯 教练技术    ████████████████░░░░  150 文档            │  │  │
│          │  │  │ 📊 领导力测评  ██████████████░░░░░░  120 文档            │  │  │
│          │  │  │ 👥 团队管理    ████████████░░░░░░░░  80 文档             │  │  │
│          │  │  │ 💬 沟通技巧    ████████░░░░░░░░░░░░  65 文档             │  │
│          │  │  └────────────────────────────────────────────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.2 知识库管理页面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                          │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│   MENU   │  📚 知识库管理              [+ 上传新文件]  [批量导入]  [刷新]        │
│          │                                                                      │
│  📊 仪表盘│  ┌──────────────────────────────────────────────────────────────┐  │
│  📚 知识库│  │  🔍 搜索: [输入文件名...]  筛选: [全部类别 ▼]  排序: [上传时间 ▼] │  │
│  💬 对话  │  └──────────────────────────────────────────────────────────────┘  │
│  🏷️ 类别  │                                                                      │
│  ⚙️ 设置  │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │  文档列表                                                      │  │
│          │  │  ┌────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 📄 教练技术工具手册.docx                                 │  │
│          │  │  │    🎯 教练技术  |  3.1 MB  |  2025-02-07  |  [👁️] [🗑️]   │  │
│          │  │  ├────────────────────────────────────────────────────────┤  │  │
│          │  │  │ 📄 领导力测评指南.pdf                                    │  │
│          │  │  │    📊 领导力测评  |  2.8 MB  |  2025-02-06  |  [👁️] [🗑️]  │  │
│          │  │  ├────────────────────────────────────────────────────────┤  │  │
│          │  │  │ 📄 团队激励方法.docx                                    │  │
│          │  │  │    👥 团队管理  |  1.5 MB  |  2025-02-05  |  [👁️] [🗑️]  │  │
│          │  │  └────────────────────────────────────────────────────────┘  │  │
│          │  │                                                              │  │
│          │  │  [显示 1-10 / 共 415 个文档]  [◀] [1] [2] [3] ... [42] [▶]   │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.3 类别管理页面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                          │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│   MENU   │  🏷️ 类别管理                       [+ 创建新类别]                         │
│          │                                                                      │
│  📊 仪表盘│  ┌──────────────────────────────────────────────────────────────┐  │
│  📚 知识库│  │  类别卡片                                                      │  │
│  💬 对话  │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │  │
│  🏷️ 类别  │  │  │  🎯 教练技术   │  │  📊 领导力测评  │  │  👥 团队管理   │      │  │
│  ⚙️ 设置  │  │  │  150 个文档    │  │  120 个文档    │  │  80 个文档     │      │  │
│          │  │  │  [管理] [编辑] │  │  [管理] [编辑] │  │  [管理] [编辑] │      │  │
│          │  │  └───────────────┘  └───────────────┘  └───────────────┘      │  │
│          │  │                                                              │  │
│          │  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │  │
│          │  │  │  💬 沟通技巧   │  │  🔄 变革管理   │  │  ➕ 添加新类别 │      │  │
│          │  │  │  65 个文档     │  │  45 个文档     │  │                │      │  │
│          │  │  │  [管理] [编辑] │  │  [管理] [编辑] │  │                │      │  │
│          │  │  └───────────────┘  └───────────────┘  └───────────────┘      │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│          │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │  📝 类别详情（点击卡片显示）                                   │  │
│          │  │  ┌────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 类别名称: 教练技术                                       │  │
│          │  │  │ 描述: 教练技术工具、方法和实践                           │  │
│          │  │  │ 图标: 🎯  颜色: #4A90E2                                  │  │
│          │  │  │ 子分类: GROW模型, 360度评估, 强有力问题...               │  │
│          │  │  │                                                         │  │
│          │  │  │ 📊 统计信息                                              │  │
│          │  │  │   • 文档数: 150                                         │  │
│          │  │  │   • 总字符: 1.25M                                        │  │
│          │  │  │   • 对话数: 23                                          │  │
│          │  │  │                                                         │  │
│          │  │  │ [📝 编辑提示词] [📄 管理文档] [📊 查看统计]               │  │
│          │  │  └────────────────────────────────────────────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.4 设置页面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                          │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│   MENU   │  ⚙️ 系统设置                                                           │
│          │                                                                      │
│  📊 仪表盘│  ┌──────────────────────────────────────────────────────────────┐  │
│  📚 知识库│  │  设置分类                                                      │  │
│  💬 对话  │  │  ┌───────────────┬─────────────────────────────────────────┐  │  │
│  🏷️ 类别  │  │  │ 🤖 AI 设置    │  │ 📁 存储设置                         │  │  │
│  ⚙️ 设置  │  │  │               │  │                                     │  │  │
│          │  │  │ DeepSeek API │  │ 向量库路径: ./data/qdrant            │  │  │
│          │  │  │ 密钥: [••••]  │  │ 最大文件: 50 MB                      │  │  │
│          │  │  │ 模型: deepseek│  │ 临时目录: ./temp                     │  │  │
│          │  │  │ [测试连接]    │  │ [清理缓存]                          │  │  │
│          │  │  └───────────────┘  └─────────────────────────────────────────┘  │  │
│          │  │                                                              │  │
│          │  │  ┌───────────────┬─────────────────────────────────────────┐  │  │
│          │  │  │ 📝 提示词设置  │  │ 🎨 界面设置                         │  │  │
│          │  │  │               │  │                                     │  │  │
│          │  │  │ 默认模板     │  │ 主题: [浅色 ▼]                      │  │  │
│          │  │  │ [编辑模板]   │  │ 语言: [中文 ▼]                      │  │  │
│          │  │  │               │  │ 消息密度: [中等 ▼]                  │  │  │
│          │  │  └───────────────┘  └─────────────────────────────────────────┘  │  │
│          │  │                                                              │  │
│          │  │  ┌────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 🔐 安全与权限                                           │  │  │
│          │  │  │  API 访问: [启用] [禁用]                               │  │  │
│          │  │  │  数据导出: [备份数据] [恢复数据]                        │  │  │
│          │  │  └────────────────────────────────────────────────────────┘  │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 上传文件弹窗设计

### 3.1 文件上传弹窗

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📁 上传知识库文件                                                   [✕ 关闭]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  步骤 1/4: 选择文件                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │        📄                                                          │  │
│  │                                                                     │  │
│  │     拖拽文件到此处，或点击选择文件                                   │  │
│  │                                                                     │  │
│  │     支持: Word (.docx), PDF (.pdf), 文本 (.txt)                     │  │
│  │     最大: 50 MB                                                      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  已选择文件:                                                             │
│  📄 教练技术工具手册.docx  (3.1 MB)                           [✕ 移除]   │
│                                                                          │
│                                    [取消]  [下一步 →]                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 AI 分析结果弹窗

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI 分析结果                                                     [✕ 关闭]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📄 文件: 教练技术工具手册.docx  (3.1 MB)                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  📊 分析结果                                                          │  │
│  │                                                                      │  │
│  │  置信度: ████████████████████ 95%                                  │  │
│  │                                                                      │  │
│  │  匹配结果: 🎯 教练技术 ✅                                           │  │
│  │                                                                      │  │
│  │  判断理由:                                                           │  │
│  │  该文档包含大量教练技术相关内容，如GROW模型、强有力问题、反馈技巧等， │  │
│  │  与现有"教练技术"类别高度匹配。                                       │  │
│  │                                                                      │  │
│  │  🏷️ 建议标签:                                                         │  │
│  │  [GROW模型] [教练工具] [反馈技巧] [目标设定]                           │  │
│  │                                                                      │  │
│  │  📝 建议添加到:                                                       │  │
│  │  ⦿ 添加到现有类别"教练技术"                                           │  │
│  │  ○ 创建为新类别                                                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                                    [← 上一步]  [确认并上传 →]               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 创建新类别弹窗

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ➕ 创建新类别                                                      [✕ 关闭]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🤖 AI 已为您生成类别信息，您可以直接使用或进行修改：                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  类别信息                                                            │  │
│  │                                                                      │  │
│  │  类别名称: [新类别名称                              ]                  │  │
│  │  英文ID:   [new-category-id                        ]                  │  │
│  │  描述:     [简短描述这个类别的用途...              ]                  │  │
│  │                                                                      │  │
│  │  图标: [🎯]  颜色: [#4A90E2]                                           │  │
│  │                                                                      │  │
│  │  子分类:                                                              │  │
│  │  [+ 子类别1] [+ 子类别2] [+ 添加子类别]                             │  │
│  │                                                                      │  │
│  │  标签:                                                                │  │
│  │  [标签1] [标签2] [+ 添加标签]                                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  📝 自动生成的系统提示词                                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ # 角色定义                                                      │  │
│  │  │ 你是一名经验丰富的新类别名称专家...                              │  │
│  │  │                                                                │  │
│  │  │ # 回答风格要求...                                               │  │
│  │  │                                                                │  │
│  │  │                                                                │  │
│  │  │                                      [预览效果] [重新生成] [编辑]  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                                    [← 返回]  [创建类别]                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 组件架构设计

### 4.1 目录结构

```typescript
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 主布局
│   │   ├── page.tsx                   # 仪表盘页
│   │   ├── dashboard/
│   │   │   └── page.tsx               # 仪表盘（可选）
│   │   ├── knowledge/
│   │   │   ├── page.tsx               # 知识库管理页
│   │   │   └── components/
│   │   │       ├── DocumentList.tsx   # 文档列表
│   │   │       ├── UploadModal.tsx    # 上传弹窗
│   │   │       └── AnalysisResult.tsx # 分析结果
│   │   ├── chat/
│   │   │   ├── page.tsx               # 对话页
│   │   │   └── components/
│   │   │       ├── ChatArea.tsx       # 对话区
│   │   │       ├── CategorySelector.tsx # 类别选择
│   │   │       └── MessageList.tsx    # 消息列表
│   │   ├── categories/
│   │   │   ├── page.tsx               # 类别管理页
│   │   │   └── components/
│   │   │       ├── CategoryCard.tsx   # 类别卡片
│   │   │       └── PromptEditor.tsx  # 提示词编辑器
│   │   ├── settings/
│   │   │   └── page.tsx               # 设置页
│   │   └── api/                       # API 路由
│   │       ├── knowledge/
│   │       │   ├── upload/route.ts
│   │       │   ├── create/route.ts
│   │       │   └── list/route.ts
│   │       ├── chat/
│   │       │   └── route.ts
│   │       └── categories/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx    # 主布局组件
│   │   │   ├── Header.tsx             # 顶部导航
│   │   │   ├── Sidebar.tsx            # 左侧菜单
│   │   │   └── SidebarItem.tsx        # 菜单项
│   │   └── ui/                        # UI 组件库
│   │
│   ├── lib/
│   │   ├── api.ts                     # API 客户端
│   │   ├── hooks.ts                   # 自定义 Hooks
│   │   └── utils.ts                   # 工具函数
│   │
│   └── types/
│       ├── category.ts                # 类型定义
│       ├── document.ts
│       └── chat.ts
```

### 4.2 布局组件代码

```typescript
// frontend/src/components/layout/DashboardLayout.tsx

'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar, MenuItem } from './Sidebar';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems: MenuItem[] = [
    { id: 'chat', icon: '💬', label: '对话', path: '/' },           // 首页
    { id: 'knowledge', icon: '📚', label: '知识库', path: '/knowledge' },
    { id: 'categories', icon: '🏷️', label: '类别', path: '/categories' },
    { id: 'dashboard', icon: '📊', label: '仪表盘', path: '/dashboard' },
    { id: 'settings', icon: '⚙️', label: '设置', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部导航 */}
      <Header />
      
      <div className="flex">
        {/* 左侧菜单 */}
        <Sidebar
          items={menuItems}
          active={activeMenu}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          onSelect={setActiveMenu}
        />
        
        {/* 主内容区 */}
        <main 
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/layout/Sidebar.tsx

'use client';

import { SidebarItem } from './SidebarItem';
import { usePathname, useRouter } from 'next/navigation';

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  items: MenuItem[];
  active: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onSelect: (id: string) => void;
}

export function Sidebar({ items, active, collapsed, onCollapse, onSelect }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (item: MenuItem) => {
    onSelect(item.id);
    router.push(item.path);
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-10 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {collapsed ? '→' : '←'}
      </button>

      {/* 菜单项 */}
      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={active === item.id}
            collapsed={collapsed}
            onClick={() => handleClick(item)}
          />
        ))}
      </nav>

      {/* 底部用户信息 */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">用户名</p>
              <p className="text-xs text-slate-500 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
```

```typescript
// frontend/src/components/layout/SidebarItem.tsx

'use client';

import { MenuItem } from './Sidebar';

interface SidebarItemProps {
  item: MenuItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

export function SidebarItem({ item, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
        active
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}
    >
      {/* 激活状态指示条 */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}

      {/* 图标 */}
      <span className="text-2xl flex-shrink-0">{item.icon}</span>

      {/* 标签 */}
      {!collapsed && (
        <>
          <span className="flex-1 text-left font-medium">{item.label}</span>
          
          {/* 徽章 */}
          {item.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* 折叠时的 Tooltip */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {item.label}
        </div>
      )}
    </button>
  );
}
```

```typescript
// frontend/src/components/layout/Header.tsx

'use client';

import { useState } from 'react';
import { Search, Bell, User, Settings } from 'lucide-react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-20">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-75 blur-sm"></div>
            <div className="relative w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center">
              🔄
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Leader-Spark
          </h1>
        </div>

        {/* 搜索框 */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-shadow"
            />
          </div>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-4">
          {/* 快速操作 */}
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* 用户信息 */}
          <button className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 5. 响应式设计

### 5.1 移动端适配

```
┌─────────────────────────────────┐
│  ☰  Leader-Spark        [🔔] 👤 │  ← 简化的顶部栏
├─────────────────────────────────┤
│                                 │
│  📱 移动端导航（底部 Tab）        │
│  ┌───────────────────────────┐  │
│  │ [📊] [📚] [💬] [👤]       │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   主内容区域               │  │
│  │   （全屏显示）             │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 5.2 断点配置

```css
/* 断点定义 */
$breakpoint-mobile: 640px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
$breakpoint-wide: 1280px;

/* 响应式行为 */
@media (max-width: $breakpoint-mobile) {
  /* 移动端：侧边栏隐藏，底部导航 */
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
}

@media (min-width: $breakpoint-tablet) {
  /* 平板：侧边栏可折叠 */
  .sidebar { width: 64px; }
  .sidebar.expanded { width: 256px; }
}

@media (min-width: $breakpoint-desktop) {
  /* 桌面：完整侧边栏 */
  .sidebar { width: 256px; }
}
```

---

## 6. 主题配置

### 6.1 颜色方案

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        // 主色调
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // 类别颜色
        'coaching': '#4A90E2',
        'leadership': '#50E3C2',
        'team': '#F5A623',
        'communication': '#9013FE',
        'change': '#FF6B6B',
      },
    },
  },
};
```

### 6.2 深色模式

```css
/* 深色模式样式 */
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}
```

---

## 7. 交互设计

### 7.1 加载状态

```
┌─────────────────────────────────────────────────────────────┐
│  正在处理您的请求...                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ████████████████░░░░░░░░  60%                        │  │
│  │  正在向量化文档...                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 空状态

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📚                                       │
│                                                             │
│              暂无知识库文档                                   │
│                                                             │
│         点击"上传文件"开始构建您的知识库                      │
│                                                             │
│                      [📁 上传文件]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 错误状态

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ❌                                       │
│                                                             │
│              上传失败：文件格式不支持                          │
│                                                             │
│         请上传 Word (.docx)、PDF (.pdf) 或文本文件            │
│                                                             │
│                      [🔄 重新上传]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 页面路由配置

```typescript
// frontend/src/app/app.tsx

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}

// 路由配置（对话页面为首页）
// / → 对话（首页）
// /knowledge → 知识库管理
// /categories → 类别管理
// /dashboard → 仪表盘
// /settings → 设置
```

---

**设计方案版本**: v2.1
**最后更新**: 2025-02-07
**状态**: 已更新（对话为首页）
