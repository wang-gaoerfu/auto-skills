'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function JsonFormatPage() {
  const { data: session } = useSession()
  const [json, setJson] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState('format')
  const [indent, setIndent] = useState(2)
  const [error, setError] = useState('')

  const handleProcess = async () => {
    if (!json.trim()) {
      return
    }

    setError('')
    try {
      const response = await fetch('/api/tools/json-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json, action, indent }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data.result || JSON.stringify(data.data, null, indent))
        if (action === 'validate') {
          setError('JSON 格式有效 ✓')
        }
      } else if (data.error) {
        setError(data.error)
        // 尝试显示修复后的结果
        if (data.data?.result) {
          setResult(data.data.result)
        }
      }
    } catch (err) {
      console.error('处理失败:', err)
    }
  }

  const actions = [
    { value: 'format', label: '格式化', icon: '✨' },
    { value: 'minify', label: '压缩', icon: '🗜' },
    { value: 'validate', label: '验证', icon: '✓' },
    { value: 'sort', label: '排序键', icon: '🔤' },
    { value: 'escape', label: '转义', icon: '\\' },
    { value: 'unescape', label: '反转义', icon: '/' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📋</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JSON格式化</h1>
          <p className="text-gray-600 dark:text-gray-400">格式化或压缩 JSON 数据</p>
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
                    JSON 输入
                  </label>
                  {json && (
                    <button
                      onClick={() => { setJson(''); setResult(''); setError('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder='{"name": "张三", "age": 25}'
                  className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  操作
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAction(a.value)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        action === a.value
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-lg mr-1">{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {(action === 'format' || action === 'sort') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    缩进空格数
                  </label>
                  <select
                    value={indent}
                    onChange={(e) => setIndent(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {[2, 4, 6, 8].map(n => (
                      <option key={n} value={n}>{n} 空格</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={!json || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                处理
              </button>

              {error && (
                <div className={`p-3 rounded-lg text-sm ${
                  error.includes('有效')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                }`}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  结果
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
                placeholder="处理结果将显示在这里..."
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
