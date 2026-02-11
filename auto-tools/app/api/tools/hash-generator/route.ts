import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createHash, createHmac, randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { text, algorithm = 'md5', action = 'hash', key, encoding = 'hex' } = await request.json()

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '请输入文本内容' }, { status: 400 })
    }

    let result = ''
    let results: any[] = []

    switch (action) {
      case 'hash':
        result = calculateHash(text, algorithm, encoding)
        break

      case 'hmac':
        if (!key) {
          return NextResponse.json({ error: 'HMAC 需要密钥' }, { status: 400 })
        }
        result = calculateHMAC(text, key, algorithm, encoding)
        break

      case 'all':
        // 计算所有哈希值
        results = calculateAllHashes(text)
        break

      case 'compare':
        // 比较两个哈希值
        results = [
          { algorithm: 'MD5', hash: calculateHash(text, 'md5', 'hex') },
          { algorithm: 'SHA-1', hash: calculateHash(text, 'sha1', 'hex') },
          { algorithm: 'SHA-256', hash: calculateHash(text, 'sha256', 'hex') },
        ]
        break

      case 'random':
        result = generateRandomHash(algorithm, encoding)
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        input: text,
        result,
        results,
        algorithm,
        encoding,
        action,
      },
    })
  } catch (error) {
    console.error('Hash生成错误:', error)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

function calculateHash(text: string, algorithm: string, encoding: string): string {
  const hash = createHash(algorithm)
  hash.update(text, 'utf-8')

  switch (encoding) {
    case 'hex':
      return hash.digest('hex')
    case 'base64':
      return hash.digest('base64')
    case 'binary':
      return hash.digest('binary')
    default:
      return hash.digest('hex')
  }
}

function calculateHMAC(text: string, key: string, algorithm: string, encoding: string): string {
  const hmac = createHmac(algorithm, key)
  hmac.update(text, 'utf-8')

  switch (encoding) {
    case 'hex':
      return hmac.digest('hex')
    case 'base64':
      return hmac.digest('base64')
    default:
      return hmac.digest('hex')
  }
}

function calculateAllHashes(text: string): any[] {
  const algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha384', 'sha224']
  return algorithms.map(algo => ({
    algorithm: algo.toUpperCase(),
    hex: calculateHash(text, algo, 'hex'),
    base64: calculateHash(text, algo, 'base64'),
  }))
}

function generateRandomHash(algorithm: string, encoding: string): string {
  const randomData = randomBytes(32)
  const hash = createHash(algorithm)
  hash.update(randomData)

  switch (encoding) {
    case 'hex':
      return hash.digest('hex')
    case 'base64':
      return hash.digest('base64')
    default:
      return hash.digest('hex')
  }
}
