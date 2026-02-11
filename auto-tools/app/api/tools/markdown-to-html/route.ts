import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { marked } from 'marked'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { markdown, options = {} } = await request.json()

    if (typeof markdown !== 'string') {
      return NextResponse.json({ error: '请输入 Markdown 内容' }, { status: 400 })
    }

    // 配置 marked 选项
    marked.setOptions({
      gfm: options.gfm !== false, // GitHub Flavored Markdown
      breaks: options.breaks || false,
    })

    const html = marked.parse(markdown)

    return NextResponse.json({
      success: true,
      data: {
        markdown,
        html,
        stats: {
          chars: markdown.length,
          lines: markdown.split('\n').length,
        },
      },
    })
  } catch (error) {
    console.error('Markdown转HTML错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
