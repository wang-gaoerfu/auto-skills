'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function Base64Page() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState('encode')

  const handleProcess = async () => {
    if (!text.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, action }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data.result)
      }
    } catch (error) {
      console.error('处理失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔐</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Base64编解码</h1>
          <p className="text-gray-600 dark:text-gray-400">Base64 编码或解码</p>
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
                    输入文本
                  </label>
                  {text && (
                    <button
                      onClick={() => { setText(''); setResult('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="在此输入或粘贴文本..."
                  className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  操作
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction('encode')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      action === 'encode'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    🔐 编码
                  </button>
                  <button
                    onClick={() => setAction('decode')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      action === 'decode'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    🔓 解码
                  </button>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={!text || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                转换
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
                  输出结果
                </label>
                {result && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(result) }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    复制
                  </button>
                )}
              </div>

              <textarea
                readOnly
                value={result}
                placeholder="Base64 编解码结果将显示在这里..."
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
