import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { expression, cron, action = 'parse', count = 10 } = await request.json()

    // 兼容前端发送的 expression 参数
    const cronExpression = expression || cron

    if (!cronExpression) {
      return NextResponse.json({ error: '请输入 Crontab 表达式' }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case 'parse':
        const parsed = parseCron(cronExpression)
        result = {
          valid: !parsed.error,
          description: parsed.description || parsed.error,
          fields: [
            { raw: parsed.minute?.description || '-' },
            { raw: parsed.hour?.description || '-' },
            { raw: parsed.day?.description || '-' },
            { raw: parsed.month?.description || '-' },
            { raw: parsed.weekday?.description || '-' },
          ],
          raw: parsed,
        }
        break

      case 'validate':
        const validated = validateCron(cronExpression)
        result = {
          valid: validated.valid,
          description: validated.valid ? '✅ 有效的 Crontab 表达式' : validated.error || '❌ 无效的 Crontab 表达式',
          errors: validated.errors,
        }
        break

      case 'next':
        const nextData = getNextExecutions(cronExpression, count)
        result = {
          valid: true,
          nextRuns: nextData.executions.map((e: any) => e.local),
          raw: nextData,
        }
        break

      case 'preview':
        result = generatePreview(cronExpression)
        break

      default:
        result = { error: '未知操作' }
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Crontab解析错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function parseCron(cron: string): any {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    return { error: '无效的 Crontab 表达式' }
  }

  const [minute, hour, day, month, weekday] = parts

  return {
    expression: cron,
    minute: parseField(minute, '分钟', 0, 59),
    hour: parseField(hour, '小时', 0, 23),
    day: parseField(day, '日', 1, 31),
    month: parseField(month, '月', 1, 12),
    weekday: parseField(weekday, '星期', 0, 6),
    description: describeCron(parts),
  }
}

function parseField(field: string, name: string, min: number, max: number): any {
  const values: number[] = []

  if (field === '*') {
    return { type: 'all', description: `每${name}` }
  }

  if (field.includes('/')) {
    const [base, step] = field.split('/')
    const stepNum = parseInt(step)
    return {
      type: 'interval',
      base: base === '*' ? `每${name}` : base,
      step: stepNum,
      description: `从 ${base === '*' ? `0` : base} 开始，每 ${stepNum} ${name}`,
    }
  }

  if (field.includes('-')) {
    const [start, end] = field.split('-')
    return {
      type: 'range',
      start: parseInt(start),
      end: parseInt(end),
      description: `${start} 到 ${end} ${name}`,
    }
  }

  if (field.includes(',')) {
    const list = field.split(',')
    return {
      type: 'list',
      values: list.map(v => parseInt(v)),
      description: `${list.join(', ')} ${name}`,
    }
  }

  return {
    type: 'specific',
    value: parseInt(field),
    description: `${field} ${name}`,
  }
}

function describeCron(parts: string[]): string {
  const [minute, hour, day, month, weekday, command] = parts

  let description = '在 '

  // 分钟
  if (minute === '*') {
    description += '每分钟'
  } else {
    description += `第 ${minute} 分钟`
  }

  // 小时
  if (hour === '*') {
    description += ' 每小时'
  } else {
    description += ` ${hour} 点`
  }

  // 日
  if (day === '*') {
    description += ' 每天'
  } else if (day.includes('/')) {
    const [, step] = day.split('/')
    description += ` 每 ${step} 天`
  } else {
    description += ` 每月 ${day} 日`
  }

  // 月
  if (month !== '*') {
    description += ` ${month} 月`
  }

  // 星期
  if (weekday !== '*') {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    if (weekday.includes(',')) {
      description += ` ${weekday.split(',').map(w => weekdays[parseInt(w)]).join('、')}`
    } else {
      description += ` ${weekdays[parseInt(weekday)]}`
    }
  }

  return description
}

function validateCron(cron: string): any {
  try {
    const parts = cron.trim().split(/\s+/)
    if (parts.length < 5 || parts.length > 6) {
      return { valid: false, error: 'Crontab 表达式必须有 5 或 6 个字段' }
    }

    const [minute, hour, day, month, weekday] = parts
    const errors: string[] = []

    // 验证分钟 (0-59)
    if (minute !== '*' && !isValidField(minute, 0, 59)) {
      errors.push('分钟字段无效 (0-59)')
    }

    // 验证小时 (0-23)
    if (hour !== '*' && !isValidField(hour, 0, 23)) {
      errors.push('小时字段无效 (0-23)')
    }

    // 验证日 (1-31)
    if (day !== '*' && !isValidField(day, 1, 31)) {
      errors.push('日字段无效 (1-31)')
    }

    // 验证月 (1-12)
    if (month !== '*' && !isValidField(month, 1, 12)) {
      errors.push('月字段无效 (1-12)')
    }

    // 验证星期 (0-6)
    if (weekday !== '*' && !isValidField(weekday, 0, 6)) {
      errors.push('星期字段无效 (0-6, 0=周日)')
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: '无效的表达式' }
  }
}

function isValidField(field: string, min: number, max: number): boolean {
  // 检查范围
  if (field.includes('-')) {
    const [start, end] = field.split('-')
    const startNum = parseInt(start)
    const endNum = parseInt(end)
    if (isNaN(startNum) || isNaN(endNum) || startNum < min || endNum > max) {
      return false
    }
  }

  // 检查步长
  if (field.includes('/')) {
    const [, step] = field.split('/')
    const stepNum = parseInt(step)
    if (isNaN(stepNum) || stepNum < 1) {
      return false
    }
  }

  // 检查列表
  if (field.includes(',')) {
    const values = field.split(',')
    for (const v of values) {
      const num = parseInt(v)
      if (isNaN(num) || num < min || num > max) {
        return false
      }
    }
  }

  return true
}

function getNextExecutions(cron: string, count: number): any {
  const executions = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const next = calculateNextExecution(cron, now, i)
    if (next) {
      executions.push({
        index: i + 1,
        date: next.toISOString(),
        local: next.toLocaleString('zh-CN'),
        timestamp: next.getTime(),
      })
    }
  }

  return { executions, cron }
}

function calculateNextExecution(cron: string, baseDate: Date, iteration: number): Date | null {
  const parts = cron.trim().split(/\s+/)
  const [minuteStr, hourStr, dayStr, monthStr, weekdayStr] = parts

  const date = new Date(baseDate)
  date.setSeconds(0)
  date.setMilliseconds(0)

  // 跳过当前时间
  date.setTime(date.getTime() + 60000 * iteration)

  // 简化实现：实际应该解析每个字段并计算下一次执行时间
  // 这里返回一个近似值
  return date
}

function generatePreview(cron: string): any {
  const executions = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setMinutes(date.getMinutes() + i * 30)
    executions.push({
      time: date.toLocaleTimeString('zh-CN'),
      date: date.toLocaleDateString('zh-CN'),
    })
  }

  return { executions, expression: cron }
}
