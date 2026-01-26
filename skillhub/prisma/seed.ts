import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建默认设置
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      theme: 'light',
      sidebarCollapsed: false,
    },
  })

  // 创建常用标签
  const tags = [
    { name: '开发工具', color: '#3b82f6' },
    { name: '需求工程', color: '#8b5cf6' },
    { name: '文件操作', color: '#10b981' },
    { name: 'Git', color: '#f59e0b' },
    { name: '任务管理', color: '#ef4444' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
