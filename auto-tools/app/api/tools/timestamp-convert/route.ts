import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { action = 'now', timestamp, date, time, format = 'all' } = await request.json()

    let result: any = {}

    switch (action) {
      case 'now':
        result = getCurrentTimestamp(format)
        break

      case 'to-date':
        if (!timestamp) {
          return NextResponse.json({ error: '请输入时间戳' }, { status: 400 })
        }
        result = timestampToDate(timestamp, format)
        break

      case 'to-timestamp':
        if (!date) {
          return NextResponse.json({ error: '请输入日期' }, { status: 400 })
        }
        result = dateToTimestamp(date, time || '00:00:00')
        break

      case 'convert':
        if (!timestamp) {
          return NextResponse.json({ error: '请输入时间戳' }, { status: 400 })
        }
        result = {
          timestamp,
          formats: getAllFormats(timestamp),
        }
        break

      case 'range':
        const { start, end, step = 86400 } = await request.json()
        result = generateTimestampRange(start, end, step)
        break

      case 'compare':
        const { ts1, ts2 } = await request.json()
        result = compareTimestamps(ts1, ts2)
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        action,
      },
    })
  } catch (error) {
    console.error('时间戳转换错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function getCurrentTimestamp(format: string): any {
  const now = Date.now()
  const date = new Date(now)

  return {
    timestamp: now,
    seconds: Math.floor(now / 1000),
    milliseconds: now,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString('zh-CN'),
    formats: getAllFormats(now),
  }
}

function timestampToDate(timestamp: string, format: string): any {
  const ts = parseInt(timestamp)
  if (isNaN(ts)) {
    return { error: '无效的时间戳' }
  }

  const date = new Date(ts > 1000000000000 ? ts : ts * 1000)

  return {
    timestamp: ts,
    isSeconds: ts <= 1000000000000,
    date: date,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    formats: getAllFormats(ts > 1000000000000 ? ts : ts * 1000),
  }
}

function dateToTimestamp(date: string, time: string): any {
  const dateObj = new Date(`${date} ${time}`)
  if (isNaN(dateObj.getTime())) {
    return { error: '无效的日期时间' }
  }

  return {
    input: `${date} ${time}`,
    timestamp: Math.floor(dateObj.getTime() / 1000),
    timestampMs: dateObj.getTime(),
    iso: dateObj.toISOString(),
    local: dateObj.toLocaleString('zh-CN'),
  }
}

function getAllFormats(ms: number): any {
  const date = new Date(ms)

  return {
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString('zh-CN'),
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN'),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    weekday: date.toLocaleDateString('zh-CN', { weekday: 'long' }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

function generateTimestampRange(start: string, endStr: string, step: number): any[] {
  const startDate = new Date(start)
  const endDate = new Date(endStr)
  const results: any[] = []

  let current = startDate.getTime()
  const endTime = endDate.getTime()

  while (current <= endTime) {
    const date = new Date(current)
    results.push({
      timestamp: Math.floor(current / 1000),
      timestampMs: current,
      iso: date.toISOString(),
      local: date.toLocaleString('zh-CN'),
    })
    current += step * 1000
  }

  return results
}

function compareTimestamps(ts1: string, ts2: string): any {
  const t1 = parseInt(ts1)
  const t2 = parseInt(ts2)

  const diff = t1 - t2
  const isMillis = t1 > 1000000000000

  return {
    ts1: { value: t1, date: new Date(isMillis ? t1 : t1 * 1000) },
    ts2: { value: t2, date: new Date(isMillis ? t2 : t2 * 1000) },
    difference: diff,
    diffSeconds: Math.abs(diff / (isMillis ? 1000 : 1)),
    diffMinutes: Math.abs(diff / (isMillis ? 60000 : 60)),
    diffHours: Math.abs(diff / (isMillis ? 3600000 : 3600)),
    diffDays: Math.abs(diff / (isMillis ? 86400000 : 86400)),
    comparison: diff > 0 ? 'ts1 较大' : diff < 0 ? 'ts2 较大' : '相等',
  }
}
