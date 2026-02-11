import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { json, action = 'format', indent = 2 } = await request.json()

    if (typeof json !== 'string') {
      return NextResponse.json({ error: '请输入 JSON 内容' }, { status: 400 })
    }

    let result = ''
    let error = null
    let stats = null

    try {
      const parsed = JSON.parse(json)

      switch (action) {
        case 'format':
          result = JSON.stringify(parsed, null, indent)
          stats = {
            minified: JSON.stringify(parsed),
            formatted: result,
            size: result.length,
          }
          break
        case 'minify':
          result = JSON.stringify(parsed)
          stats = {
            originalSize: json.length,
            minifiedSize: result.length,
            saved: json.length - result.length,
            savedPercent: ((1 - result.length / json.length) * 100).toFixed(2) + '%',
          }
          break
        case 'validate':
          result = json
          stats = { valid: true }
          break
        case 'escape':
          result = JSON.stringify(JSON.stringify(parsed))
          break
        case 'unescape':
          result = JSON.stringify(JSON.parse(json))
          break
        case 'sort':
          result = JSON.stringify(sortKeys(parsed), null, indent)
          break
        default:
          result = JSON.stringify(parsed, null, indent)
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '无效的 JSON'
      // 尝试修复常见问题
      try {
        // 移除 BOM
        let fixed = json.replace(/^\uFEFF/, '')
        // 移除注释
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
        fixed = fixed.replace(/\/\/.*$/gm, '')
        // 修复尾随逗号
        fixed = fixed.replace(/,\s*([}\]])/g, '$1')
        // 修复未引用的键
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        // 修复单引号
        fixed = fixed.replace(/'/g, '"')
        result = JSON.stringify(JSON.parse(fixed), null, indent)
        error = null
        stats = { repaired: true }
      } catch {
        error = '无法修复此 JSON'
      }
    }

    return NextResponse.json({
      success: error === null,
      data: {
        result,
        action,
        stats,
      },
      error,
    })
  } catch (err) {
    console.error('JSON处理错误:', err)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeys)
  }
  const sorted: any = {}
  Object.keys(obj)
    .sort()
    .forEach(key => {
      sorted[key] = sortKeys(obj[key])
    })
  return sorted
}
