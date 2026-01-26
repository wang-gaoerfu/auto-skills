import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/export/import - 导入数据
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 验证数据格式
    if (!data.data || typeof data.data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    const { skills, mcpServers, workflows, settings } = data.data

    // 导入 Skills
    if (Array.isArray(skills)) {
      for (const skill of skills) {
        await prisma.skill.upsert({
          where: { name: skill.name },
          update: {
            displayName: skill.displayName,
            description: skill.description,
            version: skill.version,
            category: skill.category,
            path: skill.path,
            enabled: skill.enabled,
            useCount: skill.useCount,
          },
          create: skill,
        })
      }
    }

    // 导入 MCP Servers
    if (Array.isArray(mcpServers)) {
      for (const server of mcpServers) {
        await prisma.mCPServer.upsert({
          where: { name: server.name },
          update: {
            type: server.type,
            config: server.config,
            enabled: server.enabled,
          },
          create: server,
        })
      }
    }

    // 导入 Workflows
    if (Array.isArray(workflows)) {
      for (const workflow of workflows) {
        await prisma.workflowHistory.create({
          data: workflow,
        })
      }
    }

    // 导入 Settings
    if (settings) {
      await prisma.appSettings.upsert({
        where: { id: 'default' },
        update: {
          theme: settings.theme,
          sidebarCollapsed: settings.sidebarCollapsed,
        },
        create: {
          id: 'default',
          theme: settings.theme || 'light',
          sidebarCollapsed: settings.sidebarCollapsed || false,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}
