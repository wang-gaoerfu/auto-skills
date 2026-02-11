import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TurndownService from 'turndown'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { html, options = {} } = await request.json()

    if (typeof html !== 'string') {
      return NextResponse.json({ error: '请输入 HTML 内容' }, { status: 400 })
    }

    // 创建 Turndown 服务
    const turndownService = new TurndownService({
      headingStyle: (options.headingStyle || 'atx') as 'atx' | 'setext',
      bulletListMarker: (options.bulletListMarker || '*') as '*' | '-' | '+',
      codeBlockStyle: (options.codeBlockStyle || 'fenced') as 'fenced' | 'indented',
      emDelimiter: (options.emDelimiter || '_') as '_' | '*',
      strongDelimiter: (options.strongDelimiter || '**') as '**' | '__',
      linkStyle: (options.linkStyle || 'inlined') as 'inlined' | 'referenced',
      linkReferenceStyle: (options.linkReferenceStyle || 'full') as 'full' | 'collapsed' | 'shortcut',
    })

    // 添加 GFM 表格支持
    turndownService.addRule('table', {
      filter: ['table'],
      replacement: function (content: string) {
        return '\n\n' + content + '\n\n'
      },
    })

    const markdown = turndownService.turndown(html)

    return NextResponse.json({
      success: true,
      data: {
        html,
        markdown,
        stats: {
          chars: html.length,
          lines: html.split('\n').length,
        },
      },
    })
  } catch (error) {
    console.error('HTML转Markdown错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
