import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import puppeteer from 'puppeteer'

// 抖音短链接正则
const DOUYIN_URL_PATTERNS = [
  /https?:\/\/v\.douyin\.com\/[\w\-_\/]+/gi,
  /https?:\/\/www\.douyin\.com\/video\/[\w\-_\/]+/gi,
  /https?:\/\/douyin\.com\/video\/[\w\-_\/]+/gi,
  /https?:\/\/www\.iesdouyin\.com\/share\/video\/[\w\-_\/\?=%&]+/gi,
  /https?:\/\/iesdouyin\.com\/share\/video\/[\w\-_\/\?=%&]+/gi,
]

/**
 * 从输入中提取抖音链接
 */
function extractDouyinUrl(input: string): string | null {
  for (const pattern of DOUYIN_URL_PATTERNS) {
    const match = input.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }
  return null
}

/**
 * 处理视频URL（去除水印、添加参数等）
 */
function processVideoUrl(url: string): string {
  if (!url) return ''

  // 移除转义字符
  url = url.replace(/\\\//g, '/')

  // 如果URL不完整，添加https:
  if (url.startsWith('//')) {
    url = 'https:' + url
  }

  // 解码URL（多次解码，因为可能是双重编码）
  try {
    let decoded = url
    for (let i = 0; i < 3; i++) {
      const prev = decoded
      decoded = decodeURIComponent(decoded)
      if (prev === decoded) break
    }
    url = decoded
  } catch {
    // 解码失败，保持原样
  }

  // 将带水印的视频地址(playwm)替换为不带水印的(play)
  url = url.replace(/playwm/gi, 'play')

  // 确保URL包含必要的参数
  if (url.includes('aweme/v1/play/') && !url.includes('is_play_url=1')) {
    url += (url.includes('?') ? '&' : '?') + 'is_play_url=1'
  }

  return url
}

/**
 * 使用 Puppeteer 获取视频 URL（完全模拟 C# Selenium 逻辑）
 */
async function getVideoUrlWithPuppeteer(url: string): Promise<string | null> {
  let browser = null

  try {
    console.log('启动 Puppeteer 浏览器...')

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    // 设置视口为手机尺寸（iPhone X）
    await page.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    })

    // 设置移动端 User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    )

    console.log('访问页面:', url.substring(0, 80))

    // 访问页面并等待网络空闲
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // 等待页面加载完成（类似 C# 中的 Thread.Sleep(3000)）
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('页面加载完成，开始提取视频 URL...')

    // 方法1：直接从 DOM 获取 video 元素的 src（类似 C# 的 FindElement(By.Id("video-player"))）
    try {
      const videoUrlFromDom = await page.evaluate(() => {
        const videoElement = document.querySelector('video#video-player')
        if (videoElement) {
          return (videoElement as HTMLVideoElement).src
        }

        // 尝试其他可能的选择器
        const videoElements = document.querySelectorAll('video')
        for (const video of videoElements) {
          const src = (video as HTMLVideoElement).src
          if (src && src.includes('play')) {
            return src
          }
        }

        return null
      })

      if (videoUrlFromDom) {
        const processed = processVideoUrl(videoUrlFromDom)
        console.log('从 DOM 提取到视频 URL:', processed.substring(0, 80))
        return processed
      }
    } catch (e) {
      console.log('DOM 提取失败:', e)
    }

    // 方法2：从页面 HTML 中提取（类似 C# 的正则匹配）
    const pageHtml = await page.content()
    console.log('页面 HTML 长度:', pageHtml.length)

    // 尝试从 HTML 中提取 playAddr
    const playAddrMatch = pageHtml.match(/"playAddr":"([^"]+)"/i)
    if (playAddrMatch) {
      const url = processVideoUrl(playAddrMatch[1])
      // 验证不是图片
      if (!url.includes('.webp') && !url.includes('.jpg') && !url.includes('.png') && url.includes('play')) {
        console.log('从 playAddr 提取到视频 URL')
        return url
      }
    }

    // 尝试其他字段
    const playUrlMatch = pageHtml.match(/"play_url":"([^"]+)"/i)
    if (playUrlMatch) {
      const url = processVideoUrl(playUrlMatch[1])
      if (!url.includes('.webp') && !url.includes('.jpg') && !url.includes('.png') && url.includes('play')) {
        console.log('从 play_url 提取到视频 URL')
        return url
      }
    }

    // 尝试匹配任何包含 play 的 mp4 URL
    const mp4Match = pageHtml.match(/(https?:\/\/[^"']*?play[^"']*?\.mp4[^"']*?)/i)
    if (mp4Match) {
      const url = processVideoUrl(mp4Match[1])
      console.log('从 HTML 提取到 mp4 URL')
      return url
    }

    console.log('未能提取到视频 URL')
    return null

  } catch (error) {
    console.error('Puppeteer 处理失败:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
      console.log('浏览器已关闭')
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: '请输入抖音视频链接' }, { status: 400 })
    }

    // 步骤1: 提取抖音链接
    const douyinUrl = extractDouyinUrl(url)
    if (!douyinUrl) {
      return NextResponse.json({
        error: '未找到有效的抖音视频链接',
        hint: '支持的格式：https://v.douyin.com/xxxxx/ 或 https://www.douyin.com/video/xxxxx/'
      }, { status: 400 })
    }

    console.log('步骤1 - 提取的链接:', douyinUrl)

    // 步骤2: 如果是短链接，解析获取真实URL
    let realUrl = douyinUrl
    if (douyinUrl.includes('v.douyin.com')) {
      try {
        const response = await fetch(douyinUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          },
        })
        const location = response.headers.get('location')
        if (location) {
          realUrl = location
        }
      } catch (error) {
        console.error('解析短链接失败')
      }
    }
    console.log('步骤2 - 解析后的真实URL:', realUrl.substring(0, 80))

    // 步骤3-5: 使用 Puppeteer 获取视频 URL
    const videoUrl = await getVideoUrlWithPuppeteer(realUrl)

    if (!videoUrl) {
      return NextResponse.json({
        error: '未能提取到视频地址',
        hint: '可能原因：1) 视频已被删除 2) 视频为私密视频 3) 抖音接口已变化'
      }, { status: 404 })
    }

    console.log('步骤5 - 提取到的视频地址:', videoUrl.substring(0, 80))

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        shortUrl: douyinUrl,
        realUrl,
        videoUrl,
        pageUrl: realUrl,
        title: '抖音视频',
      },
    })
  } catch (error) {
    console.error('抖音视频下载错误:', error)
    return NextResponse.json({ error: '处理请求时出错，请稍后重试' }, { status: 500 })
  }
}
