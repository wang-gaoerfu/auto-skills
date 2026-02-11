import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4, v1 as uuidv1, v5 as uuidv5, v3 as uuidv3, validate } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { action = 'generate', version = '4', count = 1, namespace, name, input } = await request.json()

    switch (action) {
      case 'generate':
        const uuids: string[] = []
        for (let i = 0; i < Math.min(count, 100); i++) {
          uuids.push(generateUUID(version, namespace, name))
        }
        return NextResponse.json({
          success: true,
          data: {
            uuids,
            action,
            version,
            info: getVersionInfo(version),
          },
        })

      case 'validate':
        const isValid = validate(input)
        return NextResponse.json({
          success: true,
          data: {
            valid: isValid,
          },
        })

      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('UUID生成错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function generateUUID(version: string, namespace?: string, name?: string): string {
  switch (version) {
    case '1':
      return uuidv1()
    case '3':
      if (namespace && name) {
        return uuidv3(namespace, name)
      }
      throw new Error('UUID v3 需要 namespace 和 name 参数')
    case '4':
      return uuidv4()
    case '5':
      if (namespace && name) {
        return uuidv5(namespace, name)
      }
      throw new Error('UUID v5 需要 namespace 和 name 参数')
    default:
      return uuidv4()
  }
}

function getVersionInfo(version: string): any {
  const versions: any = {
    '1': { name: 'UUID v1', description: '基于时间和 MAC 地址', features: ['时间戳', 'MAC地址'] },
    '3': { name: 'UUID v3', description: '基于 MD5 命名空间', features: ['命名空间', 'MD5哈希'] },
    '4': { name: 'UUID v4', description: '随机生成', features: ['随机数', '最常用'] },
    '5': { name: 'UUID v5', description: '基于 SHA-1 命名空间', features: ['命名空间', 'SHA-1哈希'] },
  }
  return versions[version] || versions['4']
}
