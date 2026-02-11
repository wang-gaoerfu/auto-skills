import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, action = 'encode' } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    let result = ''

    switch (action) {
      case 'encode':
        result = encodeURIComponent(text)
        break
      case 'decode':
        try {
          result = decodeURIComponent(text)
        } catch {
          result = '解码失败：无效的 URL 编码字符串'
        }
        break
      case 'encode-component':
        result = encodeURIComponent(text).replace(/%20/g, '+')
        break
      case 'decode-component':
        result = decodeURIComponent(text.replace(/\+/g, '%20'))
        break
      case 'encode-all':
        result = text.split('').map(c => '%' + c.charCodeAt(0).toString(16).toUpperCase()).join('')
        break
      case 'encode-form':
        result = text
          .split('')
          .map(c => {
            const code = c.charCodeAt(0)
            if (code > 255) {
              return '%' + code.toString(16).toUpperCase()
            }
            return c
          })
          .join('')
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        input: text,
        result,
        action,
        stats: {
          inputLength: text.length,
          resultLength: result.length,
        },
      },
    })
  } catch (error) {
    console.error('URL编解码错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
