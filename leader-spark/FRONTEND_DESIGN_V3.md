# 前端设计方案 v3.0 - 双端架构

## 1. 双端架构概述

### 1.1 架构设计

```
                    ┌─────────────────────────────────────────┐
                    │           域名 /leader-spark             │
                    └─────────────────────────────────────────┘
                                        │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐   ┌───────────────────────────┐
        │   / 用户端 (Chat)       │   │   /management 管理端      │
        │   面向最终用户           │   │   面向管理员/运营         │
        │   简洁对话界面           │   │   完整管理功能            │
        └───────────────────────┘   └───────────────────────────┘
```

### 1.2 端口对比

| 特性 | 用户端 (/) | 管理端 (/management) |
|------|------------|---------------------|
| **目标用户** | 最终用户/客户 | 管理员/运营人员 |
| **访问路径** | `/leader-spark` | `/leader-spark/management` |
| **主要功能** | 智能问答 | 知识库管理 |
| **界面风格** | 类似 ChatGPT | 管理后台 |
| **历史记录** | ✅ 侧边栏 | ❌ |
| **类别选择** | 下拉菜单 | 菜单导航 |
| **主题切换** | ✅ 亮/暗模式 | ✅ 亮/暗模式 |
| **上传功能** | ❌ | ✅ |
| **类别管理** | 仅选择 | 完整管理 |
| **提示词编辑** | ❌ | ✅ |
| **数据统计** | ❌ | ✅ |

---

## 2. 用户端设计 (/leader-spark)

### 2.1 用户端页面布局（带历史记录侧边栏）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER - 极简顶部栏                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  🔄 Spark                     [🎯 教练技术 ▼]         [🌓] [⚙️] [👤]         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│          │                                                                      │
│  HISTORY │                         主内容区域 (MAIN)                              │
│  侧边栏  │                                                                      │
│ (可折叠)  │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │                                                             │  │
│  ┌──────┐ │  │  💬 对话区域                                        [全屏]          │  │
│  │ 💬   │ │  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │今天  │ │  │  │                                                          │  │  │
│  │昨天  │ │  │  │  🤖 你好！我是教练技术专家，很高兴为你服务。           │  │  │
│  │过去7天│ │  │  │  有什么我可以帮助你的吗？                             │  │  │
│  │      │ │  │  │                                                          │  │  │
│  │+ 新对话│ │  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  └──────┘ │  │  │ │ 👤 什么是GROW模型？                                    │  │  │  │
│          │  │  │  │                                                     │  │  │  │
│  │ ┌────┐ │  │  │  │ 🤖 GROW模型是教练技术中的核心工具，它代表...     │  │  │  │
│  │ │GROW│ │  │  │  │                                                     │  │  │  │
│  │ └────┘ │  │  │  │ 从我的教练实践来看，GROW模型最大的价值...     │  │  │  │
│  │ ┌────┐ │  │  │  │                                                     │  │  │  │
│  │ │360│ │  │  │  │                                                     │  │  │  │
│  │ └────┘ │  │  │  └─────────────────────────────────────────────────────────┘  │  │
│  │ ┌────┐ │  │  │                                                          │  │  │  │
│  │ │目标│ │  │  │  ┌─────────────────────────────────────────────────────────┐  │  │  │
│  │ └────┘ │  │  │  │ 🤖 360度评估包括以下关键维度...                     │  │  │  │
│  │ ┌────┐ │  │  │  │                                                     │  │  │  │
│  │ │反馈│ │  │  │  └─────────────────────────────────────────────────────────┘  │  │  │
│  │ └────┘ │  │  │                                                          │  │  │  │
│  │      │ │  │  ┌─────────────────────────────────────────────────────────┐  │  │  │
│  │[更多] │ │  │  │ 🤖 正在思考...                                          │  │  │  │
│  │      │ │  │  └─────────────────────────────────────────────────────────┘  │  │  │
│  │      │ │  │                                                          │  │  │  │
│  │      │ │  │  ┌─────────────────────────────────────────────────────────┐  │  │  │
│  │      │ │  │  │ [📎] [🎤]      [输入问题...]                [发送 📤] │  │  │  │
│  │      │ │  │  └─────────────────────────────────────────────────────────┘  │  │  │
│  │      │ │  │                                                          │  │  │  │
│  │      │ │  └──────────────────────────────────────────────────────────────┘  │  │
│  │      │  │                                                          │  │  │
│  │      │  └──────────────────────────────────────────────────────────────┘  │  │
│  │      │                                                            │  │
│  └──────┴──────────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

**布局说明**：
- 左侧：历史记录侧边栏（可折叠）
- 中间：对话主区域
- 支持亮/暗主题自动切换

### 2.2 用户端组件结构

```typescript
// 用户端目录结构
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 用户端布局
│   │   ├── page.tsx                   # 用户端首页（对话）
│   │   ├── globals.css                # 全局样式
│   │   └── api/                       # API 路由
│   │       └── chat/
│   │           └── route.ts
│   │
│   ├── components/
│   │   └── chat/                      # 对话相关组件
│   │       ├── ChatContainer.tsx       # 对话容器
│   │       ├── MessageList.tsx         # 消息列表
│   │       ├── MessageInput.tsx        # 输入框
│   │       ├── CategorySelector.tsx    # 类别选择器（下拉）
│   │       └── QuickQuestions.tsx      # 快速提问
│   │
│   └── lib/
│       └── hooks.ts                    # 自定义 Hooks
```

### 2.2 历史记录侧边栏设计

```
┌──────────────────────────────────────┐
│  📜 历史记录          [+]             │
├──────────────────────────────────────┤
│  🔍 搜索历史...                     │
├──────────────────────────────────────┤
│  ◆ 今天 2                         │
│    │  💬 GROW模型教练              │
│    │  💬 360度反馈应用            │
│    │  💬 目标设定技巧              │
│  ◇ 昨天 5                         │
│    │  💬 团队冲突管理              │
│    │  💬 领导力测评                │
│    │  💬 变革管理实践              │
│    │  💬 教练技术工具              │
│  ◇ 过去 7 天 12                    │
│    │  💬 沟通技巧培训              │
│    │  💬 强有力问题应用            │
│    │  │...                       │
│  ◇ 过去 30 天                      │
│    │  │...                       │
│  ◇ ...                             │
│                                      │
│  🗑️ 清空全部历史                   │
└──────────────────────────────────────┘
```

### 2.3 历史记录功能特性

| 功能 | 说明 |
|------|------|
| **分组展示** | 今天、昨天、过去7天、过去30天 |
| **自动命名** | 根据对话第一条消息自动命名 |
| **搜索功能** | 关键词搜索历史对话 |
| **快速切换** | 点击历史记录快速加载对话 |
| **新建对话** | "+ 新对话"按钮创建新会话 |
| **清空历史** | 删除所有历史记录 |
| **折叠状态** | 侧边栏可折叠，扩大对话区域 |

### 2.4 主题切换设计

#### 主题切换按钮

```
┌─────────────────────────────────────────┐
│  顶部栏右侧                              │
│  ┌─────────────────────────────────────┐ │
│  │  [🎯 教练技术 ▼]  [🌓] [⚙️] [👤] │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

点击 🌓 按钮切换主题：
- 🌙 亮色模式（默认）
- 🌚 暗色模式

#### 亮色模式

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  亮色模式背景: #ffffff                                                   │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │  文字颜色: #0f172a (深色)                                              │
│  │  边框颜色: #e2e8f0 (浅灰)                                              │
│  │  输入框背景: #f8fafc                                                   │
│  │  按钮: 渐变蓝色 from-blue-500 to-purple-600                            │
│  └─────────────────────────────────────────────────────────────────────────┘
```

#### 暗色模式

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  暗色模式背景: #0f172a / #0a0a0a                                           │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │  文字颜色: #f1f5f9 (浅色)                                              │
│  │  边框颜色: #334155 (深灰)                                              │
│  │  输入框背景: #1e293b                                                   │
│  │  按钮: 渐变蓝色 from-blue-500 to-purple-600                            │
│  └─────────────────────────────────────────────────────────────────────────┘
```

#### 主题切换实现

```typescript
// frontend/src/components/chat/ThemeSwitcher.tsx

'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主题
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  );
}
```

### 2.5 历史记录侧边栏组件

```typescript
// frontend/src/components/chat/HistorySidebar.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  messages: Message[];
  updatedAt: Date;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  currentConversationId?: string;
}

export function HistorySidebar({ isOpen, onClose, onConversationSelect, currentConversationId }: HistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedConversations, setGroupedConversations] = useState<{
    today: Conversation[];
    yesterday: Conversation[];
    past7Days: Conversation[];
    past30Days: Conversation[];
    older: Conversation[];
  }>({
    today: [],
    yesterday: [],
    past7Days: [],
    past30Days: [],
    older: [],
  });

  // 加载历史记录
  useEffect(() => {
    loadConversations();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // 重新分组
      groupConversations(filtered);
    } else {
      groupConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    // 从 API 加载历史对话
    const response = await fetch('/api/chat/history');
    const data = await response.json();
    setConversations(data.conversations);
    groupConversations(data.conversations);
  };

  const groupConversations = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const past7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      past7Days: [] as Conversation[],
      past30Days: [] as Conversation[],
      older: [] as Conversation[],
    };

    convs.forEach(conv => {
      const updatedAt = new Date(conv.updatedAt);
      if (updatedAt >= today) {
        groups.today.push(conv);
      } else if (updatedAt >= yesterday) {
        groups.yesterday.push(conv);
      } else if (updatedAt >= past7Days) {
        groups.past7Days.push(conv);
      } else if (updatedAt >= past30Days) {
        groups.past30Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    setGroupedConversations(groups);
  };

  const handleNewConversation = () => {
    // 创建新对话
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      category: 'coaching',
      categoryIcon: '🎯',
      categoryColor: '#4A90E2',
      messages: [],
      updatedAt: new Date(),
    };
    onConversationSelect(newConv);
    onClose(); // 移动端选择后关闭侧边栏
  };

  const handleClearHistory = async () => {
    if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
      await fetch('/api/chat/history', { method: 'DELETE' });
      setConversations([]);
      setGroupedConversations({
        today: [],
        yesterday: [],
        past7Days: [],
        past30Days: [],
        older: [],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">历史记录</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索历史..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* 新建对话按钮 */}
        <button
          onClick={handleNewConversation}
          className="w-full mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新对话
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 今天 */}
        {groupedConversations.today.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              今天
            </h3>
            <div className="space-y-1">
              {groupedConversations.today.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => {
                    onConversationSelect(conv);
                    onClose(); // 移动端选择后关闭侧边栏
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 昨天 */}
        {groupedConversations.yesterday.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              昨天
            </h3>
            <div className="space-y-1">
              {groupedConversations.yesterday.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => onConversationSelect(conv)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 过去7天 */}
        {groupedConversations.past7Days.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              过去 7 天
            </h3>
            <div className="space-y-1">
              {groupedConversations.past7Days.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => onConversationSelect(conv)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 过去30天 */}
        {groupedConversations.past30Days.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              过去 30 天
            </h3>
            <div className="space-y-1">
              {groupedConversations.past30Days.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => onConversationSelect(conv)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 更早 */}
        {groupedConversations.older.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              更早
            </h3>
            <div className="space-y-1">
              {groupedConversations.older.map((conv) => (
                <HistoryItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onClick={() => onConversationSelect(conv)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleClearHistory}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          清空全部历史
        </button>
      </div>
    </div>
  );
}

// 历史记录项组件
function HistoryItem({ conversation, isActive, onClick }: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all group ${
        isActive
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 类别图标 */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: isActive ? conversation.categoryColor : 'transparent' }}
        >
          {conversation.categoryIcon}
        </div>

        {/* 标题和预览 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{conversation.title}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate line-clamp-2">
            {conversation.messages[conversation.messages.length - 1]?.content || '新对话'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
          </p>
        </div>

        {/* 消息数量 */}
        <div className="flex-shrink-0 text-xs text-slate-400">
          {conversation.messages.length}
        </div>
      </div>
    </button  );
}
```

### 2.6 用户端完整布局组件（带历史记录）

```typescript
// frontend/src/app/(user)/layout.tsx - 带历史记录的用户端布局

'use client';

import { useState } from 'react';
import { CategorySelector } from '@/components/chat/CategorySelector';
import { ThemeSwitcher } from '@/components/chat/ThemeSwitcher';
import { HistorySidebar } from '@/components/chat/HistorySidebar';
import { SettingsModal } from '@/components/chat/SettingsModal';
import { UserMenu } from '@/components/chat/UserMenu';
import { Menu } from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <html lang="zh-CN">
      <body className="bg-white dark:bg-slate-950">
        <div className="flex h-screen overflow-hidden">
          {/* 历史记录侧边栏 */}
          <HistorySidebar
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            onConversationSelect={(conv) => {
              // 加载选中的对话
              console.log('Selected conversation:', conv.id);
            }}
          />

          {/* 主内容区 */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 极简顶部栏 */}
            <header className="h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-950">
              {/* 左侧：菜单按钮 + Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>

                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-blue-500/25">
                  🔄
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Spark
                </span>
              </div>

              {/* 中间：类别选择 */}
              <CategorySelector />

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ⚙️
                </button>
                <UserMenu />
              </div>
            </header>

            {/* 主内容区（对话） */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>

        {/* 设置弹窗 */}
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </body>
    </html>
  );
}
```

---

## 3. 管理端设计 (/leader-spark/management)

```typescript
// frontend/src/app/layout.tsx - 用户端布局

'use client';

import { CategorySelector } from '@/components/chat/CategorySelector';
import { SettingsModal } from '@/components/chat/SettingsModal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-white dark:bg-slate-950">
        <div className="min-h-screen flex flex-col">
          {/* 极简顶部栏 */}
          <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-950">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
                🔄
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Spark
              </span>
            </div>

            {/* 中间：类别选择 */}
            <CategorySelector />

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-2">
              <SettingsModal />
              <UserMenu />
            </div>
          </header>

          {/* 主内容区 */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

---

## 3. 管理端设计 (/leader-spark/management)

### 3.1 管理端页面布局

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER 顶部导航栏                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  🔄 Spark 管理后台    🔍 搜索...       [+ 上传] [📚 知识库] [⚙️ 设置]    👤 │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│          │                                                                      │
│  SIDEBAR │                         主内容区域 (MAIN)                              │
│  左侧菜单 │                                                                      │
│          │  ┌──────────────────────────────────────────────────────────────┐  │
│          │  │                                                             │  │
│  ┌──────┐│  │         [根据当前菜单项显示不同内容]                          │  │
│  │ 📚   ││  │                                                             │  │
│  │知识库││  │   知识库管理 / 类别管理 / 对话记录 / 数据统计 / 设置        │  │
│  └──────┘│  │                                                             │  │
│          │  │                                                             │  │
│  ┌──────┐│  │                                                             │  │
│  │ 🏷️   ││  │                                                             │  │
│  │类别  ││  │                                                             │  │
│  └──────┘│  │                                                             │  │
│          │  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────┐│                                                                      │
│  │ 💬   ││                                                                      │
│  │对话  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ 📊   ││                                                                      │
│  │统计  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
│  ┌──────┐│                                                                      │
│  │ ⚙️   ││                                                                      │
│  │设置  ││                                                                      │
│  └──────┘│                                                                      │
│          │                                                                      │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 3.2 管理端目录结构

```typescript
// 管理端目录结构
frontend/
├── src/
│   └── app/
│       └── management/                      # 管理端路由前缀
│           ├── layout.tsx                   # 管理端布局
│           ├── page.tsx                     # 管理端首页（知识库管理）
│           │
│           ├── knowledge/                   # 知识库管理
│           │   ├── page.tsx
│           │   └── components/
│           │       ├── DocumentList.tsx
│           │       ├── UploadModal.tsx
│           │       └── AnalysisResult.tsx
│           │
│           ├── categories/                  # 类别管理
│           │   ├── page.tsx
│           │   └── components/
│           │       ├── CategoryCard.tsx
│           │       └── PromptEditor.tsx
│           │
│           ├── conversations/               # 对话记录
│           │   └── page.tsx
│           │
│           ├── analytics/                   # 数据统计
│           │   └── page.tsx
│           │
│           ├── settings/                    # 设置
│           │   └── page.tsx
│           │
│           └── api/                        # 管理 API
│               └── ...
│
└── components/
    └── management/                          # 管理端共享组件
        ├── layout/
        │   ├── ManagementLayout.tsx
        │   ├── Header.tsx
        │   └── Sidebar.tsx
        └── ui/
```

### 3.3 管理端路由配置

```typescript
// 管理端路由配置

// 用户端路由（/leader-spark）
/                           → 用户对话页面
/api/chat                   → 对话 API

// 管理端路由（/leader-spark/management）
/management                 → 管理端首页（知识库管理）
/management/knowledge       → 知识库管理
/management/categories      → 类别管理
/management/conversations   → 对话记录
/management/analytics       → 数据统计
/management/settings        → 系统设置

// 管理 API
/api/management/           → 管理相关 API
/api/management/upload      → 文件上传
/api/management/categories  → 类别管理
/api/management/analytics   → 数据统计
```

---

## 4. Next.js 路由配置

### 4.1 App Router 结构

```typescript
// frontend/src/app/layout.tsx - 根布局（不使用，仅用于路由分组）

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

```typescript
// frontend/src/app/(user)/layout.tsx - 用户端布局

import { ChatContainer } from '@/components/chat/ChatContainer';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ChatContainer />
      </body>
    </html>
  );
}
```

```typescript
// frontend/src/app/(user)/page.tsx - 用户端首页（内容为空，由 ChatContainer 处理）

export default function UserPage() {
  return null; // ChatContainer 已经是完整页面
}
```

```typescript
// frontend/src/app/management/layout.tsx - 管理端布局

import { ManagementLayout } from '@/components/management/layout/ManagementLayout';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ManagementLayout>{children}</ManagementLayout>
      </body>
    </html>
  );
}
```

```typescript
// frontend/src/app/management/page.tsx - 管理端首页（知识库管理）

export default function ManagementHomePage() {
  // 重定向到 /management/knowledge
  redirect('/management/knowledge');
}
```

---

## 5. 页面对比

### 5.1 用户端 vs 管理端

| 特性 | 用户端 | 管理端 |
|------|------------|---------------------|
| **访问路径** | `/leader-spark` | `/leader-spark/management` |
| **布局** | 单栏对话界面 | 双栏（菜单+内容） |
| **顶部栏** | 极简（Logo+类别+设置） | 完整（Logo+搜索+操作） |
| **侧边栏** | ❌ 无 | ✅ 可折叠 |
| **类别选择** | 下拉菜单 | 菜单导航 |
| **对话功能** | ✅ 完整 | ✅ 仅记录查看 |
| **上传文档** | ❌ | ✅ |
| **类别管理** | 仅选择 | 完整CRUD |
| **提示词编辑** | ❌ | ✅ |
| **数据统计** | ❌ | ✅ |
| **主题切换** | ✅ | ✅ |
| **快速提问** | ✅ | ❌ |

---

## 6. 部署配置

### 6.1 环境变量

```bash
# .env.local

# API 基础路径
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# 应用配置
NEXT_PUBLIC_APP_NAME=Spark
NEXT_PUBLIC_APP_VERSION=2.0

# 功能开关
NEXT_PUBLIC_ENABLE_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_USER_CHAT=true

# 用户端配置
NEXT_PUBLIC_DEFAULT_CATEGORY=coaching
NEXT_PUBLIC_SHOW_QUICK_QUESTIONS=true

# 管理端配置
NEXT_PUBLIC_MANAGEMENT_PATH=/management
```

### 6.2 Nginx 配置示例

```nginx
# /etc/nginx/sites-available/leader-spark

server {
    listen 80;
    server_name example.com;

    # 用户端
    location /leader-spark {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # 管理端
    location /leader-spark/management {
        proxy_pass http://localhost:3000/management;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 7. 完整目录结构

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # 根布局
│   │   │
│   │   ├── (user)/                        # 用户端路由组
│   │   │   ├── layout.tsx                  # 用户端布局
│   │   │   ├── page.tsx                    # 用户端首页
│   │   │   └── api/
│   │   │       └── chat/
│   │   │           └── route.ts           # 对话 API
│   │   │
│   │   ├── management/                    # 管理端路由组
│   │   │   ├── layout.tsx                  # 管理端布局
│   │   │   ├── page.tsx                    # 管理端首页
│   │   │   │
│   │   │   ├── knowledge/                 # 知识库管理
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── categories/                # 类别管理
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── conversations/             # 对话记录
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── analytics/                 # 数据统计
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── settings/                  # 设置
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── api/                       # 管理 API
│   │   │       ├── upload/
│   │   │       ├── categories/
│   │   │       └── analytics/
│   │   │
│   │   ├── globals.css
│   │   └── api/
│   │
│   ├── components/
│   │   ├── chat/                          # 用户端组件
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── QuickQuestions.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── UserMenu.tsx
│   │   │
│   │   └── management/                   # 管理端组件
│   │       ├── layout/
│   │       │   ├── ManagementLayout.tsx
│   │       │   ├── Header.tsx
│   │       │   └── Sidebar.tsx
│   │       └── ui/
│   │
│   └── lib/
│       ├── api.ts
│       ├── hooks.ts
│       └── utils.ts
│
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 8. 页面预览

### 8.1 用户端页面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔄 Spark  [🎯 教练技术 ▼]                              [⚙️] [👤]                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 你好！我是教练技术专家，很高兴为你服务。有什么我可以帮助你的吗？    │    │
│  │                                                                         │    │
│  │ ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │ │ 👤 什么是GROW模型？                                               │   │    │
│  │ │                                                                 │   │    │
│  │ │ 🤖 GROW模型是教练技术中的核心工具，它代表了四个关键步骤：           │   │    │
│  │ │ **G**oal - 目标、**R**eality - 现实...                          │   │    │
│  │ │                                                                 │   │    │
│  │ └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │ ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │ │ 🤖 正在思考...                                                  │   │    │
│  │ └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │ [📎] [🎤]   [输入问题...]                                    [发送 📤]          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ 💭 快速提问: [什么是GROW模型？] [如何设定目标？] [什么是360度评估？] │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 管理端页面

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔄 Spark 管理后台    [+ 上传] [📚 知识库] [🏷️ 类别] [⚙️]                        │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│ 📚 知识库│  📚 知识库管理                                                      │
│ 🏷️ 类别 │  ┌──────────────────────────────────────────────────────────────┐  │
│ 💬 对话 │  │ 🔍 搜索: [输入文件名...]  筛选: [全部类别 ▼]              │  │
│ 📊 统计 │  └──────────────────────────────────────────────────────────────┘  │
│ ⚙️ 设置 │                                                                      │
│         │  ┌──────────────────────────────────────────────────────────────┐  │
│         │  │ 文档列表                                                        │  │
│         │  │ ┌────────────────────────────────────────────────────────┐  │  │
│         │  │ │ 📄 教练技术工具手册.docx  🎯 教练技术  3.1 MB  [👁️] [🗑️] │  │  │
│         │  │ ├────────────────────────────────────────────────────────┤  │  │
│         │  │ │ 📄 领导力测评指南.pdf      📊 领导力测评  2.8 MB  [👁️] [🗑️] │  │  │
│         │  │ └────────────────────────────────────────────────────────┘  │  │
│         │  └──────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 9. 开发优先级

### 9.1 第一阶段：用户端（MVP）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 对话界面 | 类似 ChatGPT 的对话布局 |
| P0 | 类别选择 | 下拉菜单切换类别 |
| P0 | 消息发送 | 流式响应展示 |
| P1 | 快速提问 | 首次访问显示常见问题 |
| P1 | 设置弹窗 | 主题切换、清空对话 |

### 9.2 第二阶段：管理端

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 知识库管理 | 文档列表、上传删除 |
| P0 | 文件上传 | 拖拽上传、AI 分析 |
| P0 | 类别管理 | 创建编辑、提示词生成 |
| P1 | 对话记录 | 查看历史对话 |
| P2 | 数据统计 | 使用量、热门问题 |

---

**设计方案版本**: v3.0
**最后更新**: 2025-02-07
**状态**: 双端架构设计完成
