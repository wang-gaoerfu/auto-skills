import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
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

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.name !== undefined && { name: body.name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      }
    })

    return NextResponse.json({
      success: true,
      user,
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: '更新用户失败' },
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

    // Prevent deleting yourself
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: '不能删除自己的账号' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}
