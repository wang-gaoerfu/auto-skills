'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function HtmlToMarkdownPage() {
  const { data: session } = useSession()
  const [html, setHtml] = useState('')
  const [markdown, setMarkdown] = useState('')

  const handleConvert = async () => {
    if (!html.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/html-to-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      })

      const data = await response.json()
      if (data.success) {
        setMarkdown(data.data.markdown)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📄</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HTML转Markdown</h1>
          <p className="text-gray-600 dark:text-gray-400">将 HTML 转换为 Markdown 文本</p>
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
                    HTML 输入
                  </label>
                  {html && (
                    <button
                      onClick={() => { setHtml(''); setMarkdown('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<h1>标题</h1>\n<p>段落</p>\n<strong>粗体</strong>"
                  className="w-full h-64 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handleConvert}
                disabled={!html || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                转换为 Markdown
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Markdown 输出
                </label>
                {markdown && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(markdown) }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    复制
                  </button>
                )}
              </div>

              <textarea
                readOnly
                value={markdown}
                placeholder="Markdown 代码将显示在这里..."
                className="w-full h-64 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
