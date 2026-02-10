import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { membershipId } = body

    if (!membershipId) {
      return NextResponse.json(
        { error: '缺少会员ID' },
        { status: 400 }
      )
    }

    // Get membership to check current status
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { user: true }
    })

    if (!membership) {
      return NextResponse.json(
        { error: '会员记录不存在' },
        { status: 404 }
      )
    }

    if (membership.status !== 'PENDING') {
      return NextResponse.json(
        { error: '该申请已处理' },
        { status: 400 }
      )
    }

    // Approve membership
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      include: { user: true }
    })

    return NextResponse.json({
      success: true,
      membership: updated,
    })

  } catch (error) {
    console.error('Approve membership error:', error)
    return NextResponse.json(
      { error: '审核失败' },
      { status: 500 }
    )
  }
}
