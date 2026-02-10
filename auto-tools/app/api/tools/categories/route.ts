import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.toolCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            tools: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    )
  }
}
