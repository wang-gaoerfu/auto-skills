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

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const usage = await prisma.toolUsage.findMany({
      where: {
        userId: session.user.id,
        success: true,
      },
      include: {
        tool: {
          select: {
            name: true,
            icon: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
    })

    return NextResponse.json({ usage })

  } catch (error) {
    console.error('Get usage history error:', error)
    return NextResponse.json(
      { error: '获取使用记录失败' },
      { status: 500 }
    )
  }
}
