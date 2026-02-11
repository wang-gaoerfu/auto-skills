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
        // 自动检测输入是否已编码
        if (isBase64(text)) {
          result = text // 已经是 Base64
        } else {
          result = Buffer.from(text, 'utf-8').toString('base64')
        }
        break
      case 'decode':
        try {
          // 尝试解码
          result = Buffer.from(text, 'base64').toString('utf-8')
        } catch {
          result = '解码失败：无效的 Base64 字符串'
        }
        break
      case 'encode-url':
        result = Buffer.from(text, 'utf-8').toString('base64')
        break
      case 'decode-safe':
        // URL Safe Base64
        const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
        result = Buffer.from(base64, 'base64').toString('utf-8')
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
    console.error('Base64处理错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str
  } catch {
    return false
  }
}
