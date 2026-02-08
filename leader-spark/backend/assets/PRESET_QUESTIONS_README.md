# 预设问题展示使用指南

## 📦 文件清单

| 文件 | 说明 |
|------|------|
| `assets/preset_questions.json` | 100个预设问题的JSON数据文件 |
| `assets/preset_questions_preview.html` | 预设问题预览页面（可直接在浏览器打开） |
| `docs/PRESET_QUESTIONS_DISPLAY.md` | 详细的展示方案文档（含5种方案+代码示例） |
| `docs/100_PRESET_QUESTIONS.md` | 100个预设问题的完整列表 |

---

## 🚀 快速开始

### 1. 预览效果（推荐先看）

直接在浏览器中打开预览页面：

```bash
# 方式1：直接打开
open assets/preset_questions_preview.html

# 方式2：使用本地服务器
cd assets
python -m http.server 8000
# 然后访问 http://localhost:8000/preset_questions_preview.html
```

### 2. 查看数据格式

```bash
# 查看JSON数据
cat assets/preset_questions.json
```

### 3. 集成到你的项目

#### 前端集成（React示例）

```jsx
// 1. 导入预设问题数据
import presetQuestions from '../assets/preset_questions.json';

// 2. 使用快捷问题气泡（最简单）
function ChatInterface() {
  return (
    <div className="chat-interface">
      {/* 快捷问题 */}
      <QuickQuestions onQuestionClick={handleQuestionClick} />

      {/* 消息列表 */}
      <MessageList messages={messages} />

      {/* 输入框 */}
      <InputBox onSend={handleSendMessage} />
    </div>
  );
}

// 快捷问题组件
function QuickQuestions({ onQuestionClick }) {
  const questions = presetQuestions.preset_questions.categories
    .flatMap(cat => cat.questions)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  return (
    <div className="quick-questions">
      {questions.map((q, index) => (
        <button
          key={index}
          className="question-bubble"
          onClick={() => onQuestionClick(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
```

#### Vue示例

```vue
<template>
  <div class="chat-interface">
    <!-- 快捷问题 -->
    <div class="quick-questions">
      <button
        v-for="(question, index) in quickQuestions"
        :key="index"
        class="question-bubble"
        @click="handleQuestionClick(question)"
      >
        {{ question }}
      </button>
    </div>

    <!-- 其他内容 -->
  </div>
</template>

<script>
import presetQuestions from '../assets/preset_questions.json';

export default {
  data() {
    return {
      quickQuestions: presetQuestions.preset_questions.categories
        .flatMap(cat => cat.questions)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6)
    };
  },
  methods: {
    handleQuestionClick(question) {
      // 发送问题到聊天
      this.$emit('send-message', question);
    }
  }
};
</script>
```

#### 普通HTML示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>聊天界面</title>
</head>
<body>
    <!-- 加载预设问题 -->
    <script src="assets/preset_questions.json"></script>

    <!-- 快捷问题 -->
    <div id="quickQuestions"></div>

    <script>
        // 获取预设问题
        const data = presetQuestions.preset_questions;
        const allQuestions = data.categories.flatMap(cat => cat.questions);

        // 随机选择6个
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const quickQuestions = shuffled.slice(0, 6);

        // 渲染到页面
        const container = document.getElementById('quickQuestions');
        container.innerHTML = quickQuestions.map(q =>
            `<button class="question-bubble" onclick="sendMessage('${q}')">${q}</button>`
        ).join('');

        // 发送消息
        function sendMessage(question) {
            console.log('发送问题:', question);
            // 这里添加你的发送逻辑
        }
    </script>
</body>
</html>
```

---

## 🎨 5种展示方案

### 方案对比

| 方案 | 复杂度 | 空间占用 | 适用场景 | 代码示例 |
|------|-------|---------|---------|---------|
| 1. 分类折叠卡片 | ⭐⭐⭐ | 中 | 桌面端、专业场景 | ✅ |
| 2. 标签切换列表 | ⭐⭐ | 大 | 通用场景 | ✅ |
| 3. 快捷问题气泡 | ⭐ | 小 | 移动端、快速提问 | ✅ |
| 4. 分页列表 | ⭐⭐ | 中 | 深度浏览 | ✅ |
| 5. 移动端优化 | ⭐⭐ | 小 | 移动端 | ✅ |

### 查看完整方案

详细方案文档请查看：`docs/PRESET_QUESTIONS_DISPLAY.md`

---

## 📊 数据结构说明

### JSON结构

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
      }
    ],
    "recommended_questions": [
      {
        "id": 1,
        "question": "问题文本",
        "category": "分类名称",
        "priority": "high",
        "tags": ["标签1", "标签2"]
      }
    ],
    "stats": {
      "total_questions": 100,
      "total_categories": 8
    }
  }
}
```

### 使用方式

#### 获取所有问题
```javascript
const allQuestions = presetQuestions.preset_questions.categories.flatMap(
  cat => cat.questions
);
```

#### 获取推荐问题
```javascript
const recommended = presetQuestions.preset_questions.recommended_questions;
```

#### 获取特定分类的问题
```javascript
const category = presetQuestions.preset_questions.categories.find(
  cat => cat.id === 'basic_theory'
);
const questions = category.questions;
```

---

## 🎯 推荐使用方案

### 入门方案：快捷问题气泡（最简单）

**优势：**
- ✅ 实现简单，5分钟即可完成
- ✅ 占用空间小
- ✅ 用户体验好
- ✅ 适合快速提问

**实现步骤：**
1. 加载 `preset_questions.json`
2. 随机选择6-8个问题
3. 渲染为气泡按钮
4. 点击发送问题

**参考代码：** 见上文的React/Vue/HTML示例

---

### 进阶方案：分类标签切换（功能完整）

**优势：**
- ✅ 支持分类浏览
- ✅ 问题展示完整
- ✅ 交互流畅
- ✅ 适合桌面端

**实现步骤：**
1. 加载 `preset_questions.json`
2. 渲染分类标签
3. 点击标签切换显示对应问题
4. 支持搜索功能

**参考代码：** 查看 `docs/PRESET_QUESTIONS_DISPLAY.md`

---

## 💡 最佳实践

### 1. 随机展示
每次刷新随机选择不同问题，增加新鲜感

```javascript
const shuffled = allQuestions.sort(() => 0.5 - Math.random());
```

### 2. 缓存数据
首次加载后缓存到本地，减少网络请求

```javascript
// 使用localStorage缓存
localStorage.setItem('presetQuestions', JSON.stringify(data));
```

### 3. 记录点击
记录用户点击的问题，用于统计分析

```javascript
function handleQuestionClick(question) {
  // 记录点击
  analytics.track('question_clicked', { question });

  // 发送问题
  sendMessage(question);
}
```

### 4. 搜索功能
添加搜索框，让用户快速找到问题

```javascript
function searchQuestions(query) {
  const filtered = allQuestions.filter(q =>
    q.toLowerCase().includes(query.toLowerCase())
  );
  return filtered;
}
```

### 5. 热门问题
根据点击次数排序，显示热门问题

```javascript
const popularQuestions = allQuestions
  .sort((a, b) => b.clickCount - a.clickCount)
  .slice(0, 10);
```

---

## 📱 响应式设计

### 桌面端（≥768px）
- 使用方案2：标签切换列表
- 或者方案1：分类折叠卡片

### 平板端（≥480px && <768px）
- 使用方案3：快捷问题气泡
- 或者方案5：移动端优化

### 移动端（<480px）
- 使用方案5：移动端优化
- 顶部滚动分类导航

---

## 🔧 自定义配置

### 修改显示数量

```javascript
// 修改快捷问题数量
const QUICK_QUESTIONS_COUNT = 6; // 改为8、10等

const quickQuestions = shuffled.slice(0, QUICK_QUESTIONS_COUNT);
```

### 修改颜色主题

```css
/* 修改主色调 */
.question-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* 改为你喜欢的颜色 */
}
```

### 添加新问题

编辑 `assets/preset_questions.json`，在对应分类的 `questions` 数组中添加：

```json
{
  "id": "basic_theory",
  "name": "领导力测评基础理论",
  "questions": [
    "原有问题1",
    "原有问题2",
    "你的新问题"  // 添加到这里
  ]
}
```

---

## 🐛 常见问题

### Q1: 预览页面打不开？
**A:** 确保文件路径正确，或使用本地服务器：
```bash
python -m http.server 8000
```

### Q2: 如何动态加载JSON？
**A:** 使用fetch或axios：
```javascript
fetch('assets/preset_questions.json')
  .then(response => response.json())
  .then(data => {
    presetQuestions = data;
  });
```

### Q3: 如何添加搜索功能？
**A:** 添加搜索框，过滤问题列表：
```javascript
const filtered = allQuestions.filter(q =>
  q.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Q4: 如何记录用户点击？
**A:** 使用分析工具或localStorage：
```javascript
localStorage.setItem('clickedQuestions', JSON.stringify([...clickedQuestions, question]));
```

### Q5: 如何根据点击频率排序？
**A:** 维护点击计数：
```javascript
const questionStats = {
  "问题1": { count: 10 },
  "问题2": { count: 5 }
};

const sortedQuestions = allQuestions.sort((a, b) =>
  questionStats[b]?.count || 0 - questionStats[a]?.count || 0
);
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `docs/PRESET_QUESTIONS_DISPLAY.md` | 5种展示方案+完整代码示例 |
| `docs/100_PRESET_QUESTIONS.md` | 100个预设问题列表 |
| `docs/TEST_RECORD_TEMPLATE.md` | 测试记录模板 |

---

## 🎉 总结

现在你有了：

✅ **100个专业预设问题** - 涵盖领导力测评与发展全领域
✅ **JSON数据文件** - 结构化数据，易于集成
✅ **HTML预览页面** - 直观查看展示效果
✅ **5种展示方案** - 适配不同场景
✅ **完整代码示例** - React/Vue/HTML都有

**推荐流程：**
1. 打开预览页面查看效果
2. 选择适合的展示方案
3. 参考代码示例集成到你的项目
4. 根据需求自定义配置

现在开始使用吧！🚀