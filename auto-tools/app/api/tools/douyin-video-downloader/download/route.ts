import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoUrl = searchParams.get('url')
    const referer = searchParams.get('referer')
    const cookieData = searchParams.get('cookies')

    if (!videoUrl) {
      return NextResponse.json({ error: '缺少视频URL参数' }, { status: 400 })
    }

    // 过滤掉图片URL，只处理视频
    if (videoUrl.includes('.webp') || videoUrl.includes('.jpg') || videoUrl.includes('.png') || videoUrl.includes('cover')) {
      return NextResponse.json({ error: '这不是视频文件，请重新解析视频链接' }, { status: 400 })
    }

    console.log('代理下载视频:', videoUrl.substring(0, 80) + '...')

    // 构建请求头
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    }

    if (referer) {
      headers['Referer'] = referer
    }

    // 如果有 cookies，添加到请求头
    if (cookieData) {
      headers['Cookie'] = cookieData
    }

    console.log('请求头:', Object.keys(headers).join(', '))

    // 获取视频
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

    const response = await fetch(videoUrl, {
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('视频服务器响应状态:', response.status)

    if (!response.ok) {
      console.error('下载视频失败:', response.status, response.statusText)

      // 如果是403，可能是签名过期或cookie无效
      if (response.status === 403) {
        return NextResponse.json({
          error: '视频下载失败',
          hint: '视频链接已过期或需要重新获取。请重新解析视频链接后再试。'
        }, { status: 403 })
      }

      return NextResponse.json({ error: '下载视频失败' }, { status: response.status })
    }

    // 获取文件扩展名
    const url = new URL(videoUrl)
    let extension = '.mp4'
    const pathname = url.pathname.toLowerCase()
    if (pathname.includes('.mp4')) {
      extension = '.mp4'
    } else if (pathname.includes('.webm')) {
      extension = '.webm'
    } else if (videoUrl.includes('play')) {
      extension = '.mp4'
    }

    // 获取视频内容类型
    const contentType = response.headers.get('content-type') || 'video/mp4'

    // 获取视频数据
    const videoBuffer = await response.arrayBuffer()

    console.log('视频大小:', videoBuffer.byteLength, 'bytes, Content-Type:', contentType)

    // 返回视频文件
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="douyin_video_${Date.now()}${extension}"`,
        'Content-Length': videoBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: '下载超时，请稍后重试' }, { status: 408 })
    }
    console.error('代理下载错误:', error)
    return NextResponse.json({ error: '下载失败，请稍后重试' }, { status: 500 })
  }
}
