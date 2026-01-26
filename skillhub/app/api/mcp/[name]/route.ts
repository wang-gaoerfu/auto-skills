import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { removeMCPServer, addMCPServer } from '@/lib/mcp'

// GET /api/mcp/[name] - 获取单个 MCP 服务器详情
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const server = await prisma.mCPServer.findUnique({
      where: { name: params.name },
    })

    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    const config = JSON.parse(server.config)

    return NextResponse.json({ server, config })
  } catch (error) {
    console.error('Error fetching MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP server' },
      { status: 500 }
    )
  }
}

// PATCH /api/mcp/[name] - 更新 MCP 服务器
export async function PATCH(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const body = await request.json()

    // 更新数据库
    const server = await prisma.mCPServer.update({
      where: { name: params.name },
      data: {
        ...body,
        config: body.config ? JSON.stringify(body.config) : undefined,
        updatedAt: new Date(),
      },
    })

    // 如果配置有变化，更新文件
    if (body.config) {
      await removeMCPServer(params.name)
      await addMCPServer(params.name, body.config)
    }

    return NextResponse.json({ server })
  } catch (error) {
    console.error('Error updating MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to update MCP server' },
      { status: 500 }
    )
  }
}

// DELETE /api/mcp/[name] - 删除 MCP 服务器
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // 从数据库删除
    await prisma.mCPServer.delete({
      where: { name: params.name },
    })

    // 从配置文件删除
    await removeMCPServer(params.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to delete MCP server' },
      { status: 500 }
    )
  }
}
