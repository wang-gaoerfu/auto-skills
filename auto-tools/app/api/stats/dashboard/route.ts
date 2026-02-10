import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // Get user's tool usage count
    const userUsage = await prisma.toolUsage.count({
      where: {
        userId: session.user.id,
        success: true,
      },
    })

    return NextResponse.json({
      userUsage,
    })

  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
