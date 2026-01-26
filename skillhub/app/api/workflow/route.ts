import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/workflow - 创建新的工作流
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, input } = body

    const history = await prisma.workflowHistory.create({
      data: {
        type,
        title,
        input,
        status: 'running',
      },
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}

// GET /api/workflow - 获取工作流历史列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    const histories = await prisma.workflowHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ histories })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}
