'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function MarkdownToHtmlPage() {
  const { data: session } = useSession()
  const [markdown, setMarkdown] = useState('')
  const [html, setHtml] = useState('')
  const [gfm, setGfm] = useState(true)

  const handleConvert = async () => {
    if (!markdown.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/markdown-to-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, options: { gfm } }),
      })

      const data = await response.json()
      if (data.success) {
        setHtml(data.data.html)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📝</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Markdown转HTML</h1>
          <p className="text-gray-600 dark:text-gray-400">将 Markdown 文本转换为 HTML</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Markdown 输入
                  </label>
                  {markdown && (
                    <button
                      onClick={() => { setMarkdown(''); setHtml('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="# 标题\n\n**粗体** *斜体*\n\n- 列表项1\n- 列表项2"
                  className="w-full h-64 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gfm"
                  checked={gfm}
                  onChange={(e) => setGfm(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="gfm" className="text-sm text-gray-700 dark:text-gray-300">
                  GitHub 风格 Markdown (GFM)
                </label>
              </div>

              <button
                onClick={handleConvert}
                disabled={!markdown || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                转换为 HTML
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HTML 输出
                  </label>
                  {html && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(html) }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      复制
                    </button>
                  )}
                </div>

                <textarea
                  readOnly
                  value={html}
                  placeholder="HTML 代码将显示在这里..."
                  className="w-full h-64 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
                />

                {html && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">预览:</div>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
