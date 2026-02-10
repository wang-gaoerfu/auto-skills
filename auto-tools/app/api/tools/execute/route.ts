import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeTool } from '@/lib/tools/executor'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { toolName, input } = body

    if (!toolName || !input) {
      return NextResponse.json(
        { error: '缺少工具名称或输入参数' },
        { status: 400 }
      )
    }

    const result = await executeTool(toolName, input, session.user.id)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Execute tool error:', error)
    return NextResponse.json(
      { error: '工具执行失败' },
      { status: 500 }
    )
  }
}
