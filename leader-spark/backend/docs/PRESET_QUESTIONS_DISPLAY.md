# 预设问题展示方案

## 📋 概述

本文档提供多种方案，在聊天页面展示100个领导力测评与发展预设问题，提升用户体验和引导提问。

---

## 📊 数据格式

预设问题已保存为 JSON 格式：`assets/preset_questions.json`

### 数据结构

```json
{
  "preset_questions": {
    "title": "领导力测评与发展 - 预设问题",
    "description": "点击以下问题快速获取专业解答",
    "categories": [
      {
        "id": "basic_theory",
        "name": "领导力测评基础理论",
        "icon": "📚",
        "color": "#4A90E2",
        "questions": ["问题1", "问题2", ...]
      },
      ...
    ],
    "recommended_questions": [
      {
        "id": 1,
        "question": "问题文本",
        "category": "分类名称",
        "priority": "high",
        "tags": ["标签1", "标签2"]
      },
      ...
    ],
    "stats": {
      "total_questions": 100,
      "total_categories": 8
    }
  }
}
```

---

## 🎨 方案一：分类折叠卡片（推荐）

### 效果描述
- 顶部显示8个分类卡片，每个卡片显示分类名称、图标、问题数量
- 点击分类卡片展开，显示该分类的所有问题
- 每个问题可点击，直接发送到聊天框
- 支持搜索过滤功能

### 交互流程
1. 用户看到8个分类卡片（折叠状态）
2. 点击"领导力测评基础理论"卡片
3. 卡片展开，显示15个问题
4. 点击任意问题，问题自动填入输入框并发送

### UI 布局示例

```
┌─────────────────────────────────────────────────────────┐
│  📚 领导力测评基础理论 (15题)          🔧 测评工具 (15题)  │
│  🌱 领导力发展培养 (15题)          🏢 组织层面 (10题)    │
│  📊 不同层级领导力 (10题)          🎯 测评指标 (15题)    │
│  📈 结果应用反馈 (10题)          ⚡ 特殊场景 (10题)    │
└─────────────────────────────────────────────────────────┘
                    ↓ 点击展开
┌─────────────────────────────────────────────────────────┐
│  📚 领导力测评基础理论 (15题)                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. 什么是领导力测评？它的核心定义是什么？       │   │
│  │ 2. 领导力测评的主要目的是什么？                 │   │
│  │ 3. 领导力测评对组织发展有什么重要意义？         │   │
│  │ ...                                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### React 组件示例

```jsx
import React, { useState } from 'react';
import presetQuestions from '../assets/preset_questions.json';

function PresetQuestions() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, recommended_questions } = presetQuestions.preset_questions;

  // 过滤问题
  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="preset-questions">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          placeholder="搜索问题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 推荐问题 */}
      {!searchQuery && (
        <div className="recommended-section">
          <h3>🌟 推荐问题</h3>
          {recommended_questions.map(q => (
            <button
              key={q.id}
              className="question-btn recommended"
              onClick={() => handleQuestionClick(q.question)}
            >
              {q.question}
            </button>
          ))}
        </div>
      )}

      {/* 分类卡片 */}
      <div className="categories-grid">
        {filteredCategories.map(category => (
          <div
            key={category.id}
            className={`category-card ${expandedCategory === category.id ? 'expanded' : ''}`}
          >
            <div
              className="category-header"
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="question-count">({category.questions.length}题)</span>
              <span className="expand-icon">{expandedCategory === category.id ? '▼' : '▶'}</span>
            </div>

            {expandedCategory === category.id && (
              <div className="category-questions">
                {category.questions.map((question, index) => (
                  <button
                    key={index}
                    className="question-btn"
                    onClick={() => handleQuestionClick(question)}
                  >
                    {index + 1}. {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  function handleQuestionClick(question) {
    // 发送问题到聊天框
    onSendMessage(question);
  }
}
```

### CSS 样式

```css
.preset-questions {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.search-box input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 16px;
}

.recommended-section {
  margin-bottom: 20px;
  padding: 12px;
  background: #e3f2fd;
  border-radius: 6px;
}

.recommended-section h3 {
  margin: 0 0 10px 0;
  color: #1976d2;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.category-card {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-header {
  padding: 12px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #eee;
}

.category-header:hover {
  background: #f9f9f9;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  flex: 1;
  font-weight: 600;
}

.question-count {
  color: #999;
  font-size: 12px;
}

.expand-icon {
  color: #999;
}

.category-questions {
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.question-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 6px;
  text-align: left;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.question-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.question-btn.recommended {
  background: #fff;
  border: 2px solid #1976d2;
  color: #1976d2;
  font-weight: 600;
}
```

---

## 🎯 方案二：标签切换 + 列表展示

### 效果描述
- 顶部8个标签页，点击切换不同分类
- 默认显示"推荐问题"标签
- 每个标签页显示该分类的问题列表
- 支持搜索和快速筛选

### UI 布局示例

```
┌─────────────────────────────────────────────────────────┐
│  🔍 搜索问题...                                        │
├─────────────────────────────────────────────────────────┤
│  [🌟 推荐] [📚 基础理论] [🔧 测评工具] [🌱 发展培养]  │
├─────────────────────────────────────────────────────────┤
│  📚 领导力测评基础理论 (15题)                          │
│                                                         │
│  1. 什么是领导力测评？它的核心定义是什么？       [发送]  │
│  2. 领导力测评的主要目的是什么？                 [发送]  │
│  3. 领导力测评对组织发展有什么重要意义？         [发送]  │
│  4. 领导力测评与员工绩效考核有什么区别？         [发送]  │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### React 组件示例

```jsx
import React, { useState } from 'react';
import presetQuestions from '../assets/preset_questions.json';

function TabQuestions() {
  const [activeTab, setActiveTab] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, recommended_questions } = presetQuestions.preset_questions;

  // 获取当前标签的问题
  const getCurrentQuestions = () => {
    if (activeTab === 'recommended') {
      return recommended_questions;
    }
    const category = categories.find(c => c.id === activeTab);
    return category ? category.questions : [];
  };

  const currentQuestions = getCurrentQuestions().filter(q =>
    q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tab-questions">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          placeholder="搜索问题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 标签页 */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          🌟 推荐
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`tab-btn ${activeTab === category.id ? 'active' : ''}`}
            onClick={() => setActiveTab(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="questions-list">
        {activeTab === 'recommended' ? (
          currentQuestions.map((q, index) => (
            <div key={q.id} className="question-item">
              <span className="question-text">{q.question}</span>
              <button
                className="send-btn"
                onClick={() => handleQuestionClick(q.question)}
              >
                发送
              </button>
            </div>
          ))
        ) : (
          currentQuestions.map((question, index) => (
            <div key={index} className="question-item">
              <span className="question-number">{index + 1}.</span>
              <span className="question-text">{question}</span>
              <button
                className="send-btn"
                onClick={() => handleQuestionClick(question)}
              >
                发送
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 💡 方案三：快捷问题气泡（推荐）

### 效果描述
- 在聊天输入框上方显示5-8个快捷问题气泡
- 每次刷新随机展示不同问题
- 点击气泡直接发送问题
- 占用空间小，操作便捷

### UI 布局示例

```
┌─────────────────────────────────────────────────────────┐
│  💬 什么是领导力测评？  360度评估如何实施？  📚          │
│     领导力发展路径？    如何识别高潜人才？  🌱           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  请输入您的问题...                      [发送] 📎   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### React 组件示例

```jsx
import React, { useState, useEffect } from 'react';
import presetQuestions from '../assets/preset_questions.json';

function QuickQuestions() {
  const [quickQuestions, setQuickQuestions] = useState([]);

  // 随机选择6个问题
  useEffect(() => {
    const allQuestions = presetQuestions.preset_questions.categories.flatMap(
      cat => cat.questions
    );
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    setQuickQuestions(shuffled.slice(0, 6));
  }, []);

  return (
    <div className="quick-questions">
      {quickQuestions.map((question, index) => (
        <button
          key={index}
          className="question-bubble"
          onClick={() => handleQuestionClick(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}

function handleQuestionClick(question) {
  onSendMessage(question);
}
```

### CSS 样式

```css
.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  margin-bottom: 8px;
}

.question-bubble {
  padding: 8px 16px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 20px;
  color: #1976d2;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.question-bubble:hover {
  background: #2196f3;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}
```

---

## 🔄 方案四：分页列表（适合大量问题）

### 效果描述
- 显示所有100个问题
- 每页显示10-15个问题
- 支持上一页/下一页切换
- 支持跳转到指定页
- 显示总数和当前页码

### React 组件示例

```jsx
import React, { useState } from 'react';
import presetQuestions from '../assets/preset_questions.json';

function PaginatedQuestions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { categories } = presetQuestions.preset_questions;

  // 获取所有问题
  const allQuestions = categories.flatMap(cat =>
    cat.questions.map(q => ({ question: q, category: cat.name }))
  );

  // 过滤问题
  const filteredQuestions = allQuestions.filter(q =>
    selectedCategory === 'all' || q.category === selectedCategory
  ).filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 分页
  const pageSize = 10;
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const currentQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="paginated-questions">
      {/* 搜索和筛选 */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索问题..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">全部分类</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 问题列表 */}
      <div className="questions-list">
        {currentQuestions.map((item, index) => (
          <div key={index} className="question-item">
            <span className="question-category">{item.category}</span>
            <span className="question-text">{item.question}</span>
            <button onClick={() => handleQuestionClick(item.question)}>
              提问
            </button>
          </div>
        ))}
      </div>

      {/* 分页控件 */}
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          上一页
        </button>
        <span>第 {currentPage} / {totalPages} 页</span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          下一页
        </button>
      </div>

      {/* 统计信息 */}
      <div className="stats">
        共 {filteredQuestions.length} 个问题
      </div>
    </div>
  );
}
```

---

## 📱 方案五：移动端优化（分类导航）

### 效果描述
- 顶部滚动分类导航
- 底部显示当前分类的问题
- 支持左右滑动切换分类
- 适合移动端使用

### React 组件示例

```jsx
import React, { useState } from 'react';
import presetQuestions from '../assets/preset_questions.json';

function MobileQuestions() {
  const [activeCategory, setActiveCategory] = useState('recommended');
  const { categories, recommended_questions } = presetQuestions.preset_questions;

  const getCurrentQuestions = () => {
    if (activeCategory === 'recommended') {
      return recommended_questions;
    }
    const category = categories.find(c => c.id === activeCategory);
    return category ? category.questions : [];
  };

  return (
    <div className="mobile-questions">
      {/* 分类导航 */}
      <div className="category-nav">
        <div
          className={`nav-item ${activeCategory === 'recommended' ? 'active' : ''}`}
          onClick={() => setActiveCategory('recommended')}
        >
          🌟 推荐
        </div>
        {categories.map(category => (
          <div
            key={category.id}
            className={`nav-item ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.icon}
          </div>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="questions-container">
        <h3 className="category-title">
          {activeCategory === 'recommended' ? '推荐问题' :
            categories.find(c => c.id === activeCategory)?.name}
        </h3>
        {getCurrentQuestions().map((q, index) => (
          <div
            key={index}
            className="mobile-question-item"
            onClick={() => handleQuestionClick(q.question || q)}
          >
            {q.question || q}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 设计建议

### 颜色方案
| 元素 | 颜色 |
|------|------|
| 主色调 | #2196f3 (蓝色) |
| 悬停状态 | #1976d2 (深蓝色) |
| 推荐问题 | #ff9800 (橙色) |
| 分组颜色 | 使用分类的专属颜色 |

### 交互建议
1. **即时反馈**：点击问题后立即填入输入框
2. **动画效果**：添加轻微的缩放或阴影效果
3. **加载状态**：搜索时显示加载动画
4. **空状态**：无结果时显示友好提示

### 响应式设计
- **桌面端**：使用方案一或方案二
- **平板端**：使用方案三或方案五
- **移动端**：使用方案五（分类导航）

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **分类折叠卡片** | 视觉清晰，节省空间 | 需要多次点击 | 桌面端、专业场景 |
| **标签切换** | 切换快速，操作简单 | 占用垂直空间 | 通用场景 |
| **快捷问题气泡** | 占用少，操作快 | 显示问题少 | 移动端、快速提问 |
| **分页列表** | 显示完整，便于浏览 | 需要翻页 | 深度浏览场景 |
| **移动端优化** | 适合手机操作 | 功能相对简单 | 移动端优先 |

---

## 🚀 实施建议

### 1. 先从简单开始
推荐使用 **方案三（快捷问题气泡）**，实现简单，效果好

### 2. 逐步增强
- 第一阶段：实现快捷问题气泡
- 第二阶段：添加搜索功能
- 第三阶段：添加分类筛选

### 3. 数据更新
预设问题存储在 `assets/preset_questions.json`，可以：
- 动态加载
- 缓存到本地
- 定期更新

### 4. 用户反馈
- 记录用户点击的问题
- 统计热门问题
- 优化问题排序

---

## 📝 使用示例

### 前端集成

```javascript
// 1. 导入预设问题数据
import presetQuestions from '../assets/preset_questions.json';

// 2. 选择展示方案（如方案三：快捷问题气泡）
import { QuickQuestions } from './components/QuickQuestions';

// 3. 在聊天组件中使用
function ChatInterface() {
  return (
    <div className="chat-interface">
      <QuickQuestions onQuestionSend={handleSendMessage} />
      <MessageList messages={messages} />
      <InputBox onSend={handleSendMessage} />
    </div>
  );
}
```

---

## 📞 总结

根据不同的使用场景，选择合适的展示方案：

- **快速提问** → 方案三（快捷问题气泡）
- **浏览所有问题** → 方案四（分页列表）
- **分类浏览** → 方案一（分类折叠卡片）
- **移动端** → 方案五（移动端优化）

建议先实施方案三，效果好、实现简单，后续可以根据用户反馈逐步增强功能。
