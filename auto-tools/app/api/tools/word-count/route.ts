import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface TextAnalysis {
  characters: number
  charactersNoSpaces: number
  letters: number
  digits: number
  punctuation: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  chineseCharacters: number
  bytes: number
  avgWordLength: number
  avgLineLength: number
  readingTime: number
  speakingTime: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, options = {} } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    const analysis = analyzeText(text, options)

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error('字数统计错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function analyzeText(text: string, options: any): TextAnalysis {
  // 基本统计
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length

  // 字母统计（包括中英文）
  const letters = (text.match(/[a-zA-Z\u4e00-\u9fa5]/g) || []).length

  // 数字统计
  const digits = (text.match(/\d/g) || []).length

  // 标点符号统计
  const punctuation = (text.match(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''【】（）《》、]/g) || []).length

  // 单词统计（支持中英文）
  const englishWords = text.match(/[a-zA-Z]+/g) || []
  const chineseWords = text.match(/[\u4e00-\u9fa5]/g) || []
  const words = englishWords.length + chineseWords.length

  // 行数统计
  const lines = text.length > 0 ? text.split(/\n/).length : 0

  // 段落统计（空行分隔）
  const paragraphs = text.length > 0
    ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    : 0

  // 句子统计（按。！？.!?分隔）
  const sentences = text.length > 0
    ? text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0).length
    : 0

  // 中文字符统计
  const chineseCharacters = (text.match(/[\u4e00-\u9fa5]/g) || []).length

  // 字节数（UTF-8）
  const bytes = new Blob([text]).size

  // 平均单词长度
  const avgWordLength = englishWords.length > 0
    ? (englishWords.join('').length / englishWords.length).toFixed(2)
    : '0'

  // 平均行长度
  const lineLengths = text.split('\n').map(l => l.length)
  const avgLineLength = lineLengths.length > 0
    ? (lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length).toFixed(2)
    : '0'

  // 阅读时间（假设每分钟200字）
  const readingTime = Math.ceil(words / 200)

  // 说话时间（假设每分钟150字）
  const speakingTime = Math.ceil(words / 150)

  return {
    characters,
    charactersNoSpaces,
    letters,
    digits,
    punctuation,
    words,
    lines,
    paragraphs,
    sentences,
    chineseCharacters,
    bytes,
    avgWordLength: Number(avgWordLength),
    avgLineLength: Number(avgLineLength),
    readingTime,
    speakingTime,
  }
}
