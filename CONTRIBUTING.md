# 贡献指南

感谢你对 Auto-Skills 项目的关注！我们欢迎各种形式的贡献。

---

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议，请：

1. 搜索现有的 [Issues](https://github.com/your-username/auto-skills/issues)
2. 如果没有相关问题，创建新的 Issue
3. 提供详细的信息：复现步骤、错误信息、环境信息等

### 提交代码

#### 1. Fork 项目

点击页面右上角的 "Fork" 按钮

#### 2. 克隆仓库

```bash
git clone https://github.com/your-username/auto-skills.git
cd auto-skills
```

#### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

#### 4. 提交代码

```bash
git add .
git commit -m "描述你的改动"
```

#### 5. 推送分支

```bash
git push origin feature/your-feature-name
```

#### 6. 创建 Pull Request

- 访问原仓库页面
- 点击 "New Pull Request"
- 填写 PR 模板中的信息

---

## 开发指南

### 添加新技能

1. 在 `skills/builtin/` 下创建新的技能目录
2. 使用 `skills/templates/basic-skill/` 作为模板
3. 确保包含以下文件：
   - `skill.json` - 技能元数据
   - `prompt.md` - 核心提示词
   - `description.md` - 使用说明

### 技能规范

- 命名使用 kebab-case（如 `file-ops` 而非 `file_ops`）
- 提供详细的注释说明
- 更新相关文档

---

## 代码规范

### 技能文件规范

#### skill.json

```json
{
  "name": "skill-name",
  "displayName": "Skill Display Name",
  "description": "简短描述技能功能",
  "version": "1.0.0",
  "author": "Your Name",
  "parameters": {
    // 参数定义
  }
}
```

#### prompt.md

- 以清晰的标题开头
- 使用 `{{if}}` 条件处理参数
- 提供明确的输出格式说明

---

## 提交信息规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建或工具配置

示例：
```bash
git commit -m "feat: 添加 file-ops 技能"
git commit -m "fix: 修复 git-helper 的分支切换问题"
git commit -m "docs: 更新 skill-structure.md"
```

---

## 文档贡献

- 使用 Markdown 格式
- 提供清晰的示例
- 保持简洁易懂
- 更新相关链接

---

## 社区技能

如果发现有用的社区技能，可以：

1. 在 `skills/community/` 下添加
2. 在 `skills/community/README.md` 中记录来源和说明
3. 确保遵守原作者的许可协议

---

## 行为准则

1. 尊重所有贡献者
2. 建设性的沟通
3. 乐于帮助新人
4. 专注于项目目标

---

## 需要帮助？

- 查看 [FAQ](docs/04-faq.md)
- 在 [Discussions](https://github.com/your-username/auto-skills/discussions) 中提问
- 创建 Issue

---

感谢你的贡献！
