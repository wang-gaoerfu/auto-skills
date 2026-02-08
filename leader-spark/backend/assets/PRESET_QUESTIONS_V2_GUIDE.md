# 预设问题 v2.0 使用指南

## 概述

基于知识库《教练技术的53个顶级工具》重新生成的100个预设问题，包含50个理论知识和50个实战案例场景。

## 文件说明

- **`assets/preset_questions_v2_coaching.json`** - 预设问题数据文件（JSON格式）
- **`assets/preset_questions_v2_coaching_preview.html`** - 预设问题预览文件（HTML格式）
- **`assets/preset_questions.json`** - 旧版本预设问题（领导力测评相关，已保留）

## 问题分类

### 1. 理论知识（50问）

涵盖以下主题：
- 📘 教练技术基础（3问）
- 🌟 教练文化（2问）
- 🤝 教练受训关系（2问）
- 📊 评估工具（3问）
- 💎 价值观工具（3问）
- 🧠 信念系统（6问）
- 💪 信心策略（3问）
- 🎯 能力发展（8问）
- 👥 团队建设（4问）
- 🎤 访谈技巧（3问）
- 📝 语言模式（3问）
- 🔧 教练工具（3问）
- 🎨 形象化技巧（2问）
- 💬 反馈技巧（3问）
- 🎯 目标设定（1问）
- 🌐 应用领域（1问）

### 2. 实战案例（50问）

涵盖以下主题：
- 💪 信心策略（10问）
- 💎 价值观工具（9问）
- 📊 360度评估（6问）
- 🧠 信念系统（13问）
- 👥 团队建设（23问）
- 💬 沟通能力（7问）
- 😊 情绪管理（5问）
- 🎤 访谈技巧（1问）
- 📝 反馈技巧（4问）
- 🎯 目标设定（2问）
- 📚 语言模式（1问）
- 🎨 形象化技巧（1问）
- 🎯 管理能力（9问）
- 🌟 领导力（1问）
- 🚀 变革管理（2问）
- 🌐 教练文化（1问）
- 🏢 教练机制（1问）
- 🎯 角色定位（1问）
- 👤 人才发展（3问）
- 💼 职业发展（2问）
- ⚖️ 工作生活平衡（1问）
- 👤 个人发展（1问）

## 问题编号规则

- **T001-T050**：理论知识
- **C001-C100**：实战案例

## 使用方法

### 方法1：直接使用JSON文件

```python
import json

# 加载预设问题
with open('assets/preset_questions_v2_coaching.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 获取所有理论知识
theory_questions = data['categories'][0]['questions']

# 获取所有实战案例
case_questions = data['categories'][1]['questions']

# 获取特定主题的问题
for question in case_questions:
    if question['topic'] == '信心策略':
        print(f"{question['id']}: {question['question']}")
```

### 方法2：使用HTML预览文件

在浏览器中打开 `assets/preset_questions_v2_coaching_preview.html`，可以：
- 查看所有预设问题
- 按类别（理论知识/实战案例）切换查看
- 按主题分组浏览
- 复制问题文本

### 方法3：按主题筛选

```python
import json

# 加载预设问题
with open('assets/preset_questions_v2_coaching.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 按主题筛选
target_topic = "信心策略"
filtered_questions = []

for category in data['categories']:
    for question in category['questions']:
        if question['topic'] == target_topic:
            filtered_questions.append(question)

print(f"主题「{target_topic}」的问题数量：{len(filtered_questions)}")
for q in filtered_questions:
    print(f"{q['id']}: {q['question']}")
```

## 前端展示建议

### 方案1：标签页切换

```html
<div class="tabs">
  <button class="tab active" onclick="showTheory()">理论知识</button>
  <button class="tab" onclick="showCase()">实战案例</button>
</div>

<div id="theory-list">
  <!-- 理论问题列表 -->
</div>

<div id="case-list" style="display:none;">
  <!-- 案例问题列表 -->
</div>
```

### 方案2：主题分组展示

```html
<div class="topic-group">
  <h3>💪 信心策略</h3>
  <ul>
    <li>C001: 客户说'我想尝试提升管理能力，但总是失败'...</li>
    <li>C009: 客户说'我害怕失败，所以不敢尝试新事物'...</li>
    <!-- 更多问题 -->
  </ul>
</div>
```

### 方案3：搜索与筛选

```javascript
// 按主题筛选
function filterByTopic(topic) {
  return questions.filter(q => q.topic === topic);
}

// 按关键词搜索
function searchByKeyword(keyword) {
  return questions.filter(q => q.question.includes(keyword));
}

// 按类型筛选
function filterByType(type) {
  return questions.filter(q => q.type === type);
}
```

## 问题导入示例

### 导入到前端组件

```javascript
// React 示例
import presetQuestions from '../assets/preset_questions_v2_coaching.json';

function QuestionList() {
  const [activeTab, setActiveTab] = useState('theory');

  const theoryQuestions = presetQuestions.categories[0].questions;
  const caseQuestions = presetQuestions.categories[1].questions;

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('theory')}>理论知识</button>
        <button onClick={() => setActiveTab('case')}>实战案例</button>
      </div>

      {activeTab === 'theory' && (
        <ul>
          {theoryQuestions.map(q => (
            <li key={q.id}>{q.question}</li>
          ))}
        </ul>
      )}

      {activeTab === 'case' && (
        <ul>
          {caseQuestions.map(q => (
            <li key={q.id}>{q.question}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 导入到数据库

```python
import json
import sqlite3

# 加载预设问题
with open('assets/preset_questions_v2_coaching.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 连接数据库
conn = sqlite3.connect('questions.db')
cursor = conn.cursor()

# 创建表
cursor.execute('''
    CREATE TABLE IF NOT EXISTS preset_questions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        type TEXT NOT NULL,
        topic TEXT NOT NULL,
        scenario TEXT
    )
''')

# 插入数据
for category in data['categories']:
    for question in category['questions']:
        cursor.execute('''
            INSERT OR REPLACE INTO preset_questions
            VALUES (?, ?, ?, ?, ?)
        ''', (
            question['id'],
            question['question'],
            question['type'],
            question['topic'],
            question.get('scenario', '')
        ))

conn.commit()
conn.close()
```

## 版本信息

- **版本**：v2.0
- **生成日期**：2025-02-05
- **基于知识库**：《教练技术的53个顶级工具》
- **问题总数**：100个（50理论 + 50案例）

## 更新日志

### v2.0 (2025-02-05)
- ✅ 基于当前知识库（教练技术）重新生成问题
- ✅ 问题与知识库内容完全匹配
- ✅ 增加实战案例场景，提升实用性
- ✅ 保留v1.0版本（领导力测评相关）
- ✅ 优化问题分类和主题标签

### v1.0 (原始版本)
- 领导力测评与发展相关问题
- 已保留在 `assets/preset_questions.json`

## 常见问题

### Q1: 为什么要重新生成预设问题？
A1: 因为当前知识库的内容是"教练技术"，而原来的预设问题是"领导力测评"，两者不匹配。为了提升用户体验，基于实际知识库内容重新生成了问题。

### Q2: 旧版本的问题还能用吗？
A2: 旧版本问题已保留在 `assets/preset_questions.json` 中，可以继续使用。但如果知识库内容不变，建议使用v2.0版本的问题，因为它们与知识库更匹配。

### Q3: 如何添加新的预设问题？
A3: 可以直接编辑JSON文件，添加新的问题对象。确保遵循相同的格式：
```json
{
  "id": "T051",
  "question": "新问题文本",
  "type": "theory",
  "topic": "主题名称"
}
```

### Q4: 问题编号有限制吗？
A4: 理论问题建议使用 T051-T099，案例问题建议使用 C101-C199。

## 联系支持

如有问题或建议，请联系技术支持团队。
