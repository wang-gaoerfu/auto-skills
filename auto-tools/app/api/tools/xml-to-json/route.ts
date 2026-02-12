import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseString, Builder } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { input, action = 'parse', options = {} } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: '请输入内容' }, { status: 400 })
    }

    try {
      let result: string

      if (action === 'parse') {
        // XML -> JSON
        const json = await parseXML(input, options)
        result = JSON.stringify(json, null, 2)
      } else {
        // JSON -> XML
        const jsonObj = JSON.parse(input)
        result = await buildXML(jsonObj, options)
      }

      return NextResponse.json({
        success: true,
        data: {
          result,
          stats: {
            inputSize: input.length,
            outputSize: result.length,
          },
        },
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '解析失败',
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
      explicitArray: options.explicitArray === true,
      ignoreAttrs: options.ignoreAttrs || false,
      mergeAttrs: options.mergeAttrs || false,
      trim: options.trim !== false,
      normalize: options.normalize !== false,
      explicitRoot: true,
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

async function buildXML(obj: any, options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const builder = new Builder({
      rootName: options.rootName || 'root',
      xmldec: options.xmldec !== false ? { version: '1.0', encoding: 'UTF-8' } : undefined,
    })
    try {
      const xml = builder.buildObject(obj)
      resolve(xml)
    } catch (err) {
      reject(err)
    }
  })
}
