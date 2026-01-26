import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/export/data - 导出所有数据
export async function GET() {
  try {
    const [skills, mcpServers, workflows, settings] = await Promise.all([
      prisma.skill.findMany(),
      prisma.mCPServer.findMany(),
      prisma.workflowHistory.findMany(),
      prisma.appSettings.findUnique({ where: { id: 'default' } }),
    ])

    const data = {
      exportDate: new Date().toISOString(),
      version: '0.1.0',
      data: {
        skills,
        mcpServers,
        workflows,
        settings,
      },
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=skillhub-backup-${new Date().toISOString().split('T')[0]}.json`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
