import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { color, action = 'parse', format = 'hex' } = await request.json()

    if (!color) {
      return NextResponse.json({ error: '请输入颜色值' }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case 'parse':
        result = parseColor(color)
        break

      case 'convert':
        result = convertColor(color, format)
        break

      case 'blend':
        const { color2, ratio = 0.5 } = await request.json()
        result = blendColors(color, color2, ratio)
        break

      case 'gradient':
        const { color2: endColor, steps = 10 } = await request.json()
        result = generateGradient(color, endColor, steps)
        break

      case 'variants':
        result = generateColorVariants(color)
        break

      case 'complementary':
        result = getComplementaryColor(color)
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        input: color,
        result,
        action,
      },
    })
  } catch (error) {
    console.error('颜色转换错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function parseColor(color: string): any {
  // 移除空格
  color = color.trim()

  // RGB 解析
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1])
    const g = parseInt(rgbMatch[2])
    const b = parseInt(rgbMatch[3])
    return rgbToFormats(r, g, b)
  }

  // RGBA 解析
  const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1])
    const g = parseInt(rgbaMatch[2])
    const b = parseInt(rgbaMatch[3])
    const a = parseFloat(rgbaMatch[4])
    return rgbaToFormats(r, g, b, a)
  }

  // HEX 解析
  const hex = color.replace(/^#/, '')
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return rgbToFormats(r, g, b)
  }
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return rgbToFormats(r, g, b)
  }
  if (/^[0-9A-Fa-f]{8}$/.test(hex)) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const a = parseInt(hex.substring(6, 8), 16) / 255
    return rgbaToFormats(r, g, b, a)
  }

  // HSL 解析
  const hslMatch = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/i)
  if (hslMatch) {
    const h = parseInt(hslMatch[1])
    const s = parseInt(hslMatch[2])
    const l = parseInt(hslMatch[3])
    return hslToFormats(h, s, l)
  }

  // 颜色名称
  const namedColor = getNamedColor(color)
  if (namedColor) {
    return rgbToFormats(namedColor.r, namedColor.g, namedColor.b)
  }

  return { error: '无法识别的颜色格式' }
}

function convertColor(color: string, format: string): string {
  const parsed = parseColor(color)
  if (parsed.error) return parsed.error

  switch (format) {
    case 'hex':
      return parsed.hex
    case 'rgb':
      return parsed.rgb
    case 'rgba':
      return parsed.rgba
    case 'hsl':
      return parsed.hsl
    case 'hsv':
      return parsed.hsv || parsed.hsl
    default:
      return parsed.hex
  }
}

function blendColors(color1: string, color2: string, ratio: number): any {
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)

  if (c1.error || c2.error) {
    return { error: '无法解析颜色' }
  }

  const r1 = parseInt(c1.hex?.replace('#', '')?.substring(0, 2) || '0', 16)
  const g1 = parseInt(c1.hex?.replace('#', '')?.substring(2, 4) || '0', 16)
  const b1 = parseInt(c1.hex?.replace('#', '')?.substring(4, 6) || '0', 16)

  const r2 = parseInt(c2.hex?.replace('#', '')?.substring(0, 2) || '0', 16)
  const g2 = parseInt(c2.hex?.replace('#', '')?.substring(2, 4) || '0', 16)
  const b2 = parseInt(c2.hex?.replace('#', '')?.substring(4, 6) || '0', 16)

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio)

  return rgbToFormats(r, g, b)
}

function generateGradient(color1: string, color2: string, steps: number): any[] {
  const gradient: any[] = []
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1)
    gradient.push(blendColors(color1, color2, ratio))
  }
  return gradient
}

function generateColorVariants(color: string): any {
  const c = parseColor(color)
  if (c.error) return c

  const r = parseInt(c.hex?.replace('#', '')?.substring(0, 2) || '0', 16)
  const g = parseInt(c.hex?.replace('#', '')?.substring(2, 4) || '0', 16)
  const b = parseInt(c.hex?.replace('#', '')?.substring(4, 6) || '0', 16)

  const hsl = rgbToHsl(r, g, b)

  return {
    lighter: rgbToFormats(
      Math.min(255, r + 40),
      Math.min(255, g + 40),
      Math.min(255, b + 40)
    ),
    darker: rgbToFormats(
      Math.max(0, r - 40),
      Math.max(0, g - 40),
      Math.max(0, b - 40)
    ),
    grayscale: rgbToFormats(
      Math.round(r * 0.299 + g * 0.587 + b * 0.114),
      Math.round(r * 0.299 + g * 0.587 + b * 0.114),
      Math.round(r * 0.299 + g * 0.587 + b * 0.114)
    ),
    inverted: rgbToFormats(255 - r, 255 - g, 255 - b),
    complement: hslToRgb(
      (hsl.h + 180) % 360,
      hsl.s,
      hsl.l
    ),
  }
}

function getComplementaryColor(color: string): any {
  const c = parseColor(color)
  if (c.error) return c

  const r = parseInt(c.hex?.replace('#', '')?.substring(0, 2) || '0', 16)
  const g = parseInt(c.hex?.replace('#', '')?.substring(2, 4) || '0', 16)
  const b = parseInt(c.hex?.replace('#', '')?.substring(4, 6) || '0', 16)

  const hsl = rgbToHsl(r, g, b)

  return {
    complement: hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l),
    triadic: [
      hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l),
    ],
    analogous: [
      hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l),
      hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
    ],
  }
}

// 辅助函数
function rgbToFormats(r: number, g: number, b: number): any {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()

  return {
    hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, 1)`,
    hsl: rgbToHslString(r, g, b),
    hsv: rgbToHsvString(r, g, b),
    decimal: (r << 16) + (g << 8) + b,
  }
}

function rgbaToFormats(r: number, g: number, b: number, a: number): any {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()

  return {
    hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    hex8: `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`,
    hsl: rgbToHslString(r, g, b),
    hsv: rgbToHsvString(r, g, b),
    alpha: a,
  }
}

function hslToFormats(h: number, s: number, l: number): any {
  const rgb = hslToRgbValues(h, s, l)
  return rgbToFormats(rgb.r, rgb.g, rgb.b)
}

function hslToRgb(h: number, s: number, l: number): any {
  const rgb = hslToRgbValues(h, s, l)
  return rgbToFormats(rgb.r, rgb.g, rgb.b)
}

function rgbToHslString(r: number, g: number, b: number): string {
  const hsl = rgbToHsl(r, g, b)
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

function rgbToHsvString(r: number, g: number, b: number): string {
  const hsv = rgbToHsv(r, g, b)
  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0

  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgbValues(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function getNamedColor(name: string): { r: number; g: number; b: number } | null {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    orange: { r: 255, g: 165, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    pink: { r: 255, g: 192, b: 203 },
  }

  return colors[name.toLowerCase()] || null
}
