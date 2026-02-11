'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function DouyinVideoDownloaderPage() {
  const { data: session } = useSession()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    shortUrl?: string
    realUrl?: string
    videoUrl?: string
    title?: string
    error?: string
    hint?: string
  } | null>(null)

  const handleDownload = async () => {
    if (!url.trim()) {
      setResult({ success: false, error: '请输入抖音视频链接' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/tools/douyin-video-downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || '处理失败',
          hint: data.hint
        })
        return
      }

      // 验证视频URL不是图片
      const videoUrl = data.data.videoUrl
      if (videoUrl && (videoUrl.includes('.webp') || videoUrl.includes('.jpg') || videoUrl.includes('.png'))) {
        setResult({
          success: false,
          error: '提取到的链接是图片而非视频',
          hint: '抖音可能已更新接口，请稍后再试或尝试其他视频'
        })
        return
      }

      setResult({
        success: true,
        shortUrl: data.data.shortUrl,
        realUrl: data.data.realUrl,
        videoUrl: data.data.videoUrl,
        title: data.data.title,
      })
    } catch (error) {
      setResult({ success: false, error: '网络请求失败，请稍后重试' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadVideo = () => {
    if (result?.videoUrl && result?.realUrl) {
      // 使用代理下载，带上 referer
      const downloadUrl = `/api/tools/douyin-video-downloader/download?url=${encodeURIComponent(result.videoUrl)}&referer=${encodeURIComponent(result.realUrl)}`
      window.open(downloadUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📱</span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">抖音视频下载</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          根据抖音视频链接下载无水印视频
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              抖音视频链接
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴抖音视频链接，例如：https://v.douyin.com/xxxxx/"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={loading || !session?.user}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '解析视频'}
          </button>

          {!session?.user && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              请先登录后使用此工具
            </p>
          )}
        </div>
      </div>

      {/* Process Steps */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">处理流程</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">提取短链接</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">从输入内容中识别并提取抖音短链接</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">解析真实URL</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">通过重定向获取视频的真实播放地址</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">获取页面内容</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">模拟移动端访问获取视频页面HTML</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">提取视频地址</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">从页面中解析并处理无水印视频链接</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
              5
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">完成</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">获取无水印视频下载链接</p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border p-6 ${
          result.success ? 'border-green-200 dark:border-green-800/50' : 'border-red-200 dark:border-red-800/50'
        }`}>
          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-semibold">解析成功</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">原始短链接</label>
                  <p className="text-sm text-gray-900 dark:text-white break-all mt-1 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                    {result.shortUrl}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">真实URL</label>
                  <p className="text-sm text-gray-900 dark:text-white break-all mt-1 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                    {result.realUrl}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">视频下载链接</label>
                  <p className="text-sm text-gray-900 dark:text-white break-all mt-1 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded">
                    {result.videoUrl}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadVideo}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                下载视频
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                提示：点击下载按钮将在新窗口打开视频，请长按视频保存或使用下载工具
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h3 className="text-lg font-semibold">解析失败</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{result.error}</p>
              {result.hint && (
                <p className="text-sm text-gray-500 dark:text-gray-500">{result.hint}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50 p-4">
        <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-2">使用提示</h3>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>• 支持抖音短链接（如：https://v.douyin.com/xxxxx/）</li>
          <li>• 自动去除视频水印，获取无水印版本</li>
          <li>• 请确保链接完整，包含 http:// 或 https://</li>
          <li>• 如视频无法下载，可能是链接已失效或视频已被删除</li>
        </ul>
      </div>
    </div>
  )
}
