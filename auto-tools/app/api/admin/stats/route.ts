import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      )
    }

    // Get all stats in parallel
    const [
      userCount,
      memberCount,
      pendingCount,
      toolCount,
      totalUsage,
      popularTools,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.membership.count({ where: { status: 'APPROVED' } }),
      prisma.membership.count({ where: { status: 'PENDING' } }),
      prisma.tool.count({ where: { isActive: true } }),
      prisma.toolUsage.count({ where: { success: true } }),
      prisma.tool.findMany({
        where: { isActive: true },
        orderBy: { useCount: 'desc' },
        take: 10,
        select: {
          name: true,
          useCount: true,
        },
      }),
    ])

    return NextResponse.json({
      userCount,
      memberCount,
      pendingCount,
      toolCount,
      totalUsage,
      popularTools,
    })

  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
