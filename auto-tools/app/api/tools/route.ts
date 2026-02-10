import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isFree = searchParams.get('isFree')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (isFree === 'true') {
      where.isFree = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.tool.count({ where }),
    ])

    return NextResponse.json({
      tools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Get tools error:', error)
    return NextResponse.json(
      { error: '获取工具列表失败' },
      { status: 500 }
    )
  }
}

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
    const { name, slug, description, icon, categoryId, isFree, sortOrder, config } = body

    if (!name || !slug || !description || !categoryId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        description,
        icon,
        categoryId,
        isFree: isFree || false,
        sortOrder: sortOrder || 0,
        config: config ? JSON.stringify(config) : null,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      tool,
    }, { status: 201 })

  } catch (error) {
    console.error('Create tool error:', error)
    return NextResponse.json(
      { error: '创建工具失败' },
      { status: 500 }
    )
  }
}
