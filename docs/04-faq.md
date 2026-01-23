# 04 - 常见问题

这里汇总了开发和使用 Claude Code 技能时遇到的常见问题。

---

## 目录

1. [安装与配置](#安装与配置)
2. [技能开发](#技能开发)
3. [运行时问题](#运行时问题)
4. [高级问题](#高级问题)
5. [社区与贡献](#社区与贡献)

---

## 安装与配置

### Q: 技能没有被识别？

**症状**: 使用 `/help` 看不到新添加的技能

**原因**:
1. `.claude/skills/` 链接不正确
2. 技能文件格式有误
3. Claude Code 缓存未更新

**解决方法**:
```bash
# 1. 检查技能目录结构
ls .claude/skills/
ls .claude/skills/my-skill/

# 2. 确认文件存在
ls my-skill/skill.json
ls my-skill/SKILL.md

# 3. 重启 Claude Code
# 完全退出后重新启动

# 4. 检查 skill.json 格式
# 确保 JSON 格式正确，使用在线验证工具
```

---

### Q: 如何全局安装技能？

**问题**: 想在多个项目中使用同一个技能

**方法**:

Windows:
```bash
xcopy /E /I skills\builtin\my-skill %USERPROFILE%\.claude\skills\my-skill
```

Linux/Mac:
```bash
cp -r skills/builtin/my-skill ~/.claude/skills/my-skill
```

---

### Q: 如何卸载技能？

**问题**: 不再需要某个技能

**方法**:

```bash
# 删除技能目录
rm -rf .claude/skills/my-skill

# 或删除符号链接
rm .claude/skills
```

---

## 技能开发

### Q: 参数没有传递进来？

**症状**: 在 SKILL.md 中使用 `{{param}}` 显示为空

**原因**:
1. skill.json 中参数名拼写错误
2. 参数类型定义错误
3. 用户没有提供参数

**解决方法**:

```json
// 确保拼写一致
{
  "properties": {
    "myParam": { "type": "string" }
  },
  "required": ["myParam"]
}
```

```markdown
// SKILL.md 中使用相同的名称
{{if myParam}}
参数值: {{myParam}}
{{endif}}
```

---

### Q: 如何支持多个操作？

**问题**: 一个技能需要支持多种操作类型

**方法**: 使用 `action` 参数

```json
{
  "properties": {
    "action": {
      "type": "string",
      "enum": ["search", "read", "write", "delete"]
    }
  }
}
```

```markdown
{{if action}}
{{if action == "search"}}
执行搜索...
{{endif}}

{{if action == "read"}}
执行读取...
{{endif}}
{{endif}}
```

---

### Q: 如何处理用户取消操作？

**问题**: 用户可能想取消正在进行的操作

**方法**: 使用 dryRun 参数

```json
{
  "properties": {
    "dryRun": {
      "type": "boolean",
      "description": "预演模式，不实际执行"
    }
  }
}
```

```markdown
{{if dryRun}}
⚠️ 预演模式

将要执行的操作:
- 删除文件: {{path}}

实际执行时移除 dryRun 参数
{{else}}
✓ 操作已执行
{{endif}}
```

---

### Q: skill.json 格式错误怎么办？

**问题**: JSON 格式不正确

**方法**:

1. 使用在线 JSON 验证工具
2. 检查常见错误：
   - 缺少逗号 `,`
   - 多余的逗号
   - 引号不匹配
   - 注释格式错误

```json
// ❌ 错误
{
  "name": "my-skill",  // ❌ 不支持行内注释
  "description": "test"
}

// ✅ 正确
{
  "name": "my-skill",
  "description": "test"
}
```

---

## 运行时问题

### Q: 文件路径包含空格怎么处理？

**问题**: 路径如 `My Documents/file.txt` 无法识别

**方法**: 使用引号

```
/file-ops action:read path:"My Documents/file.txt"
```

```markdown
// 在 Bash 命令中
cat "My Documents/file.txt"
```

---

### Q: 如何限制输出长度？

**问题**: 大文件输出太长

**方法**: 在 SKILL.md 中添加条件

```markdown
{{if verbose}}
完整输出:
{{content}}
{{else}}
摘要（前 500 字符）:
{{truncate content 500}}
{{endif}}
```

---

### Q: 技能执行很慢怎么办？

**问题**: 技能响应时间长

**优化方法**:

1. **减少不必要的操作**
   ```markdown
   ❌ 多次读取同一文件
   ✓ 读取一次后缓存结果
   ```

2. **使用合适的工具**
   ```markdown
   ❌ Bash find
   ✓ Glob 工具
   ```

3. **限制搜索范围**
   ```markdown
   ❌ 搜索整个项目
   ✓ 指定搜索目录
   ```

---

## 高级问题

### Q: 技能可以调用其他技能吗？

**答案**: 不能直接调用，但可以参考其他技能的提示词

```markdown
可以这样做：
1. 在 SKILL.md 中描述要调用的技能的功能
2. 让 AI 按照该技能的提示词执行
```

---

### Q: 如何保存技能的输出？

**方法**: 使用 Write 工具

```markdown
处理完成后，将结果保存到文件：

1. 执行操作
2. 格式化结果
3. 使用 Write 工具保存
```

---

### Q: 技能支持国际化吗？

**当前**: 技能提示词使用中文编写

**方法**:
1. 在 skill.json 中添加 language 参数
2. 根据语言输出不同内容

```json
{
  "properties": {
    "lang": {
      "type": "string",
      "enum": ["zh", "en"],
      "default": "zh"
    }
  }
}
```

```markdown
{{if lang == "zh"}}
你好！
{{endif}}

{{if lang == "en"}}
Hello!
{{endif}}
```

---

## 社区与贡献

### Q: 如何分享我的技能？

**方法**:

1. 创建 GitHub 仓库
2. 按标准结构组织技能
3. 编写完整的 README
4. 发布到社区

**项目结构**:
```
my-awesome-skill/
├── README.md
├── LICENSE
├── my-skill/
│   ├── skill.json
│   ├── SKILL.md
│   └── description.md
└── examples/
```

---

### Q: 如何贡献到 Auto-Skills？

**步骤**:

1. Fork 项目
2. 创建分支
3. 添加你的技能
4. 提交 Pull Request

详细步骤见 [贡献指南](../CONTRIBUTING.md)

---

### Q: 技能的命名有什么规范？

**规范**:

1. 使用 kebab-case（小写字母 + 连字符）
2. 简短易懂
3. 不与内置命令冲突

```
✅ code-review
✅ git-helper
✅ file-ops

❌ codeReview
❌ my_awesome_skill_123
❌ ls (内置命令)
```

---

## 更多帮助

### 官方资源

- [Claude Code 文档](https://code.claude.com/docs)
- [GitHub Issues](https://github.com/anthropics/claude-code/issues)

### 社区资源

- [Claude Code 社区论坛](https://code.claude.com/community)
- [Auto-Skills 仓库](https://github.com/your-username/auto-skills)

### 查看示例

- [内置技能](../skills/builtin/)
- [技能模板](../skills/templates/)

---

问题没有解决？请 [提交 Issue](https://github.com/your-username/auto-skills/issues)！
