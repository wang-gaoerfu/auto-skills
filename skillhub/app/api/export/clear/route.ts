import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/export/clear - 清除所有数据
export async function POST(request: Request) {
  try {
    // 删除所有数据
    await prisma.workflowHistory.deleteMany({})
    await prisma.mCPServer.deleteMany({})
    await prisma.skill.deleteMany({})

    // 重置设置为默认值
    await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: {
        theme: 'light',
        sidebarCollapsed: false,
      },
      create: {
        id: 'default',
        theme: 'light',
        sidebarCollapsed: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing data:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
