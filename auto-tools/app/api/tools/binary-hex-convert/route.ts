import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, from = '10', to = '16', action = 'convert' } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入数字' }, { status: 400 })
    }

    let result = ''
    let results: any[] = []

    switch (action) {
      case 'convert':
        result = convertBase(text, from, to)
        break
      case 'all':
        // 转换到所有常见进制
        const bases = [2, 8, 10, 16]
        const num = parseInt(text, from)
        if (isNaN(num)) {
          return NextResponse.json({ error: '无效的数字' }, { status: 400 })
        }
        results = bases.map(base => ({
          base,
          value: num.toString(base).toUpperCase(),
        }))
        break
      case 'table':
        // 生成转换表
        results = generateConversionTable(text, from)
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        input: text,
        from,
        to,
        result,
        results,
        action,
      },
    })
  } catch (error) {
    console.error('进制转换错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function convertBase(text: string, from: string, to: string): string {
  const num = parseInt(text, parseInt(from))
  if (isNaN(num)) {
    throw new Error('无效的数字')
  }
  return num.toString(parseInt(to)).toUpperCase()
}

function generateConversionTable(text: string, from: string): any[] {
  const num = parseInt(text, parseInt(from))
  if (isNaN(num)) {
    throw new Error('无效的数字')
  }

  return [
    { base: 2, value: num.toString(2), name: '二进制' },
    { base: 8, value: num.toString(8), name: '八进制' },
    { base: 10, value: num.toString(10), name: '十进制' },
    { base: 16, value: num.toString(16).toUpperCase(), name: '十六进制' },
    { base: 32, value: num.toString(32).toUpperCase(), name: '三十二进制' },
    { base: 36, value: num.toString(36).toUpperCase(), name: '三十六进制' },
  ]
}
