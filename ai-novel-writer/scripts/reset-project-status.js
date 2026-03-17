/**
 * 重置项目状态脚本
 *
 * 使用方法: node scripts/reset-project-status.js <projectId>
 */

// 加载环境变量
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const projectId = process.argv[2]

  if (!projectId) {
    console.error('请提供项目 ID')
    console.log('使用方法: node scripts/reset-project-status.js <projectId>')
    process.exit(1)
  }

  console.log(`正在重置项目 ${projectId} 的状态...`)

  try {
    // 获取当前状态
    const project = await prisma.scriptProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        status: true,
        subStatus: true,
        generationLock: true,
        progress: true,
      }
    })

    if (!project) {
      console.error(`项目 ${projectId} 不存在`)
      process.exit(1)
    }

    console.log('当前状态:', project)

    // 重置状态
    const updated = await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: 'paused',
        subStatus: null,
        generationLock: null,
        progress: 0,
      }
    })

    console.log('重置后状态:', {
      id: updated.id,
      status: updated.status,
      subStatus: updated.subStatus,
      generationLock: updated.generationLock,
      progress: updated.progress,
    })

    console.log('\n✅ 项目状态已重置!')
  } catch (error) {
    console.error('重置失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
