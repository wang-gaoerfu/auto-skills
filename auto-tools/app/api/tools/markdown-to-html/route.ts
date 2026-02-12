import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { marked } from 'marked'

// 配置 marked 选项
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown (支持表格、删除线等)
  breaks: false, // 不把单个换行符转换为 <br>
  gfmHeadingId: true, // 为标题生成 ID
})

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
