import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseString } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { xml, options = {} } = await request.json()

    if (typeof xml !== 'string') {
      return NextResponse.json({ error: '请输入 XML 内容' }, { status: 400 })
    }

    try {
      const result = await parseXML(xml, options)

      return NextResponse.json({
        success: true,
        data: {
          xml,
          json: result,
          stats: {
            xmlSize: xml.length,
            jsonSize: JSON.stringify(result).length,
          },
        },
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'XML 解析失败',
      }, { status: 400 })
    }
  } catch (err) {
    console.error('XML转JSON错误:', err)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}

async function parseXML(xml: string, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    parseString(xml, {
      explicitArray: options.explicitArray !== false,
      ignoreAttrs: options.ignoreAttrs || false,
      mergeAttrs: options.mergeAttrs || false,
      trim: options.trim !== false,
      normalize: options.normalize !== false,
      explicitRoot: options.explicitRoot || false,
      explicitChildren: options.explicitChildren || false,
      charsAsChildren: options.charsAsChildren || false,
      includeWhiteChars: options.includeWhiteChars || false,
    }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}
