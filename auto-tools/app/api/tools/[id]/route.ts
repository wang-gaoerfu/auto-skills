import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    })

    if (!tool) {
      return NextResponse.json(
        { error: '工具不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tool })

  } catch (error) {
    console.error('Get tool error:', error)
    return NextResponse.json(
      { error: '获取工具失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const tool = await prisma.tool.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.isFree !== undefined && { isFree: body.isFree }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.config !== undefined && { config: JSON.stringify(body.config) }),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      tool,
    })

  } catch (error) {
    console.error('Update tool error:', error)
    return NextResponse.json(
      { error: '更新工具失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      )
    }

    await prisma.tool.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    console.error('Delete tool error:', error)
    return NextResponse.json(
      { error: '删除工具失败' },
      { status: 500 }
    )
  }
}
