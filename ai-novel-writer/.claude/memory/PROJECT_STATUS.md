# AI小说创作能手 - 项目状态

## 项目路径
`D:/my_project/auto-skills/ai-novel-writer`

## 技术栈
- Next.js 14 (App Router)
- shadcn/ui + Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js 5
- DeepSeek AI

## 数据库配置
- 服务器: 122.51.186.204:5432
- 用户名: novelist
- 密码: Novelist123
- 开发库: novelist_dev
- 生产库: novelist_prod

## 已完成功能
- ✅ 用户系统（注册、登录、邮箱验证）
- ✅ 项目管理（CRUD、章节管理）
- ✅ 知识库管理（人物、世界观、剧情）
- ✅ 富文本编辑器（Tiptap）
- ✅ AI 生成（DeepSeek）
- ✅ 数据导出（TXT、MD、HTML）
- ✅ 会员系统（兑换码激活）
- ✅ 管理后台（用户统计、兑换码管理）
- ✅ 性能优化（缓存、监控）
- ✅ 部署配置（Docker）

## 明天任务
- 测试完整流程
- 修复发现的 bug
- 优化用户体验

## 关键命令
```bash
# 开发
npm run dev

# 数据库迁移
npx prisma migrate dev

# 测试
npm run test

# 部署
docker-compose up -d
```
