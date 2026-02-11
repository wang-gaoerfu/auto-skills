import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, mode = 'asc', options = {} } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    let result = ''

    switch (mode) {
      case 'asc':
        result = sortLines(text, 'asc', options.caseSensitive)
        break
      case 'desc':
        result = sortLines(text, 'desc', options.caseSensitive)
        break
      case 'asc-len':
        result = sortByLength(text, 'asc')
        break
      case 'desc-len':
        result = sortByLength(text, 'desc')
        break
      case 'asc-alpha':
        result = sortAlphanumeric(text, 'asc')
        break
      case 'desc-alpha':
        result = sortAlphanumeric(text, 'desc')
        break
      case 'shuffle':
        result = shuffleLines(text)
        break
      case 'reverse':
        result = reverseLines(text)
        break
      case 'natural':
        result = naturalSort(text, 'asc')
        break
      default:
        result = text
    }

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        result,
        mode,
      },
    })
  } catch (error) {
    console.error('文本排序错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function sortLines(text: string, order: 'asc' | 'desc', caseSensitive = false): string {
  const lines = text.split('\n')
  const sorted = [...lines].sort((a, b) => {
    let compareA = caseSensitive ? a : a.toLowerCase()
    let compareB = caseSensitive ? b : b.toLowerCase()
    return order === 'asc'
      ? compareA.localeCompare(compareB, 'zh-CN')
      : compareB.localeCompare(compareA, 'zh-CN')
  })
  return sorted.join('\n')
}

function sortByLength(text: string, order: 'asc' | 'desc'): string {
  const lines = text.split('\n')
  const sorted = [...lines].sort((a, b) => {
    return order === 'asc' ? a.length - b.length : b.length - a.length
  })
  return sorted.join('\n')
}

function sortAlphanumeric(text: string, order: 'asc' | 'desc'): string {
  const chars = text.split('')
  const sorted = [...chars].sort((a, b) => {
    // 数字优先
    const aIsNum = !isNaN(Number(a))
    const bIsNum = !isNaN(Number(b))
    if (aIsNum && !bIsNum) return -1
    if (!aIsNum && bIsNum) return 1
    return order === 'asc'
      ? a.localeCompare(b, 'zh-CN')
      : b.localeCompare(a, 'zh-CN')
  })
  return sorted.join('')
}

function shuffleLines(text: string): string {
  const lines = text.split('\n')
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[lines[i], lines[j]] = [lines[j], lines[i]]
  }
  return lines.join('\n')
}

function reverseLines(text: string): string {
  const lines = text.split('\n')
  return lines.reverse().join('\n')
}

function naturalSort(text: string, order: 'asc' | 'desc'): string {
  const lines = text.split('\n')
  const collator = new Intl.Collator('zh-CN', {
    numeric: true,
    sensitivity: 'base',
  })

  const sorted = [...lines].sort((a, b) => {
    return order === 'asc' ? collator.compare(a, b) : collator.compare(b, a)
  })

  return sorted.join('\n')
}
