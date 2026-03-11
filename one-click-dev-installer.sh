#!/bin/bash
# one-click-dev 依赖技能一键安装脚本
# 使用方法: bash one-click-dev-installer.sh

echo "🚀 开始安装 one-click-dev 依赖技能..."
echo ""

# 技能列表
skills=(
  "vikiboss/60s-skills@hot-topics"
  "coreyhaines31/marketingskills@content-strategy"
  "0xbigboss/claude-code@react-best-practices"
  "0xbigboss/claude-code@typescript-best-practices"
  "0xbigboss/claude-code@python-best-practices"
  "brianlovin/claude-config@simplify"
  "sanyuan0704/code-review-expert@code-review-expert"
  "ghostsecurity/skills@ghost-scan-code"
  "ghostsecurity/skills@ghost-scan-secrets"
  "testdino-hq/playwright-skill@playwright-skill"
  "obra/superpowers@systematic-debugging"
  "github/awesome-copilot@documentation-writer"
  "wshobson/agents@github-actions-templates"
)

# 计数器
total=${#skills[@]}
success=0
failed=0

# 安装每个技能
for skill in "${skills[@]}"; do
  echo "📦 安装: $skill"
  if npx skills add "$skill" -g -y 2>/dev/null; then
    ((success++))
    echo "   ✅ 成功"
  else
    ((failed++))
    echo "   ❌ 失败"
  fi
  echo ""
done

# 安装 one-click-dev 本身
echo "📦 安装 one-click-dev 主技能..."
if [ -d "$HOME/.agents/skills/one-click-dev" ]; then
  echo "   ℹ️  已存在，跳过"
else
  mkdir -p "$HOME/.agents/skills/one-click-dev/references"
  # 复制文件（需要手动执行或提供路径）
  echo "   ⚠️  请手动复制 SKILL.md 和 references/ 到 ~/.agents/skills/one-click-dev/"
fi

# 总结
echo ""
echo "================================"
echo "📊 安装完成"
echo "   成功: $success/$total"
echo "   失败: $failed/$total"
echo "================================"
