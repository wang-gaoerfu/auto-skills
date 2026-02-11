import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, mode = 'lines', options = {} } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    let result = ''
    let stats = { originalLines: 0, resultLines: 0, removed: 0 }

    switch (mode) {
      case 'lines':
        result = deduplicateLines(text, options.caseSensitive)
        break
      case 'chars':
        result = deduplicateChars(text, options.preserveSpaces)
        break
      case 'words':
        result = deduplicateWords(text, options.caseSensitive)
        break
      case 'continuous':
        result = deduplicateContinuous(text)
        break
      default:
        result = text
    }

    // 统计信息
    const originalLines = text.split('\n').length
    const resultLines = result.split('\n').length
    stats = {
      originalLines,
      resultLines,
      removed: originalLines - resultLines,
    }

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        result,
        mode,
        stats,
      },
    })
  } catch (error) {
    console.error('文本去重错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

// 按行去重
function deduplicateLines(text: string, caseSensitive = false): string {
  const lines = text.split('\n')
  const seen = new Set<string>()
  const result: string[] = []

  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(line)
    }
  }

  return result.join('\n')
}

// 按字符去重
function deduplicateChars(text: string, preserveSpaces = false): string {
  const seen = new Set<string>()
  let result = ''

  for (const char of text) {
    if (char === ' ' && preserveSpaces) {
      result += char
      continue
    }
    if (!seen.has(char)) {
      seen.add(char)
      result += char
    }
  }

  return result
}

// 按单词去重
function deduplicateWords(text: string, caseSensitive = false): string {
  const words = text.split(/(\s+)/)
  const seen = new Set<string>()
  const result: string[] = []

  for (const word of words) {
    // 保留空白符
    if (/^\s+$/.test(word)) {
      result.push(word)
      continue
    }
    const key = caseSensitive ? word : word.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(word)
    }
  }

  return result.join('')
}

// 去除连续重复字符
function deduplicateContinuous(text: string): string {
  return text.replace(/(.)\1+/g, '$1')
}
