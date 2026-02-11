import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, mode = 'upper' } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    let result = ''
    switch (mode) {
      case 'upper':
        result = text.toUpperCase()
        break
      case 'lower':
        result = text.toLowerCase()
        break
      case 'title':
        result = toTitleCase(text)
        break
      case 'sentence':
        result = toSentenceCase(text)
        break
      case 'camel':
        result = toCamelCase(text)
        break
      case 'pascal':
        result = toPascalCase(text)
        break
      case 'snake':
        result = toSnakeCase(text)
        break
      case 'kebab':
        result = toKebabCase(text)
        break
      case 'toggle':
        result = toggleCase(text)
        break
      case 'inverse':
        result = inverseCase(text)
        break
      default:
        result = text
    }

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        converted: result,
        mode,
      },
    })
  } catch (error) {
    console.error('大小写转换错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
}

function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, char => char.toUpperCase())
}

function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase())
}

function toPascalCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[a-z]/, c => c.toUpperCase())
}

function toSnakeCase(text: string): string {
  return text
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase()
}

function toKebabCase(text: string): string {
  return text
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .replace(/^-/, '')
    .toLowerCase()
}

function toggleCase(text: string): string {
  return text.split('').map(char => {
    if (char >= 'a' && char <= 'z') return char.toUpperCase()
    if (char >= 'A' && char <= 'Z') return char.toLowerCase()
    return char
  }).join('')
}

function inverseCase(text: string): string {
  return text.split('').map(char => {
    const upper = char.toUpperCase()
    const lower = char.toLowerCase()
    if (char === upper && char !== lower) return lower
    if (char === lower && char !== upper) return upper
    return char
  }).join('')
}
