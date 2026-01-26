import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMCPConfig, syncMCPServersToDB } from '@/lib/mcp'

// GET /api/mcp - 获取所有 MCP 服务器
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync')

    // 如果需要同步
    if (sync === 'true') {
      await syncMCPServersToDB()
    }

    const servers = await prisma.mCPServer.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Error fetching MCP servers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP servers' },
      { status: 500 }
    )
  }
}

// POST /api/mcp - 同步 MCP 服务器或添加新服务器
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 如果有 data 字段，表示添加新服务器
    if (body.data) {
      const { name, type, config: serverConfig } = body.data

      // 检查是否已存在
      const existing = await prisma.mCPServer.findUnique({
        where: { name },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'MCP 服务器已存在' },
          { status: 400 }
        )
      }

      // 添加到数据库
      const server = await prisma.mCPServer.create({
        data: {
          name,
          type,
          config: JSON.stringify(serverConfig),
          enabled: true,
        },
      })

      // 添加到配置文件
      const { addMCPServer } = await import('@/lib/mcp')
      await addMCPServer(name, serverConfig)

      return NextResponse.json({
        message: 'MCP 服务器添加成功',
        server,
      })
    }

    // 否则是同步操作
    const count = await syncMCPServersToDB()

    return NextResponse.json({
      message: 'MCP servers synced successfully',
      count,
    })
  } catch (error) {
    console.error('Error in POST /api/mcp:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
