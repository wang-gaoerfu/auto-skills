import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface CSVOptions {
  delimiter?: string
  hasHeader?: boolean
  skipEmpty?: boolean
  trim?: boolean
  quote?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { csv, options = {} } = await request.json()

    if (typeof csv !== 'string') {
      return NextResponse.json({ error: '请输入 CSV 内容' }, { status: 400 })
    }

    const result = parseCSV(csv, {
      delimiter: options.delimiter || ',',
      hasHeader: options.hasHeader !== false,
      skipEmpty: options.skipEmpty !== false,
      trim: options.trim !== false,
      quote: options.quote || '"',
    })

    return NextResponse.json({
      success: true,
      data: {
        csv,
        json: result.data,
        headers: result.headers,
        stats: {
          rows: result.data.length,
          columns: result.headers.length,
        },
      },
    })
  } catch (error) {
    console.error('CSV转JSON错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function parseCSV(csv: string, options: CSVOptions) {
  const lines = csv.split(/\r?\n/)
  const data: any[] = []
  let headers: string[] = []

  // 过滤空行
  const filteredLines = options.skipEmpty
    ? lines.filter(line => line.trim().length > 0)
    : lines

  if (filteredLines.length === 0) {
    return { data: [], headers: [] }
  }

  // 解析行
  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === options.quote) {
        if (inQuotes && nextChar === options.quote) {
          // 转义的引号
          current += char
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === options.delimiter && !inQuotes) {
        result.push(options.trim ? current.trim() : current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(options.trim ? current.trim() : current)

    return result
  }

  // 解析标题行
  const headerLine = parseLine(filteredLines[0])
  if (options.hasHeader) {
    headers = headerLine
  } else {
    headers = headerLine.map((_, i) => `Column ${i + 1}`)
  }

  // 解析数据行
  const startIndex = options.hasHeader ? 1 : 0
  for (let i = startIndex; i < filteredLines.length; i++) {
    const values = parseLine(filteredLines[i])
    if (values.length > 0) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
  }

  return { data, headers }
}
