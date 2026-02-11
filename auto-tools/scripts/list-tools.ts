import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tools = await prisma.tool.findMany({
    include: { category: true },
    orderBy: { categoryId: 'asc' }
  })

  console.log('工具总数:', tools.length)
  console.log('\n按分类统计:')

  const byCategory: Record<string, string[]> = {}
  tools.forEach(tool => {
    if (!byCategory[tool.category.name]) {
      byCategory[tool.category.name] = []
    }
    byCategory[tool.category.name].push(`${tool.name} (${tool.slug})`)
  })

  Object.entries(byCategory).forEach(([category, toolList]) => {
    console.log(`\n【${category}】${toolList.length}个`)
    toolList.forEach(tool => console.log(`  - ${tool}`))
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
