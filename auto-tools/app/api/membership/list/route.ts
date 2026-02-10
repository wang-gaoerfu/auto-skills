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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = status === 'ALL' ? {} : { status }

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.membership.count({ where }),
    ])

    return NextResponse.json({
      memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('List memberships error:', error)
    return NextResponse.json(
      { error: '获取会员列表失败' },
      { status: 500 }
    )
  }
}
