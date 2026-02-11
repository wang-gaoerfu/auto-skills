'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TextSortPage() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState('asc')
  const [caseSensitive, setCaseSensitive] = useState(false)

  const handleSort = async () => {
    if (!text.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/text-sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, options: { caseSensitive } }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data.result)
      }
    } catch (error) {
      console.error('排序失败:', error)
    }
  }

  const modes = [
    { value: 'asc', label: '升序排列', icon: '⬆️' },
    { value: 'desc', label: '降序排列', icon: '⬇️' },
    { value: 'asc-len', label: '按长度升序', icon: '📏' },
    { value: 'desc-len', label: '按长度降序', icon: '📐' },
    { value: 'natural', label: '自然排序', icon: '🔤' },
    { value: 'shuffle', label: '随机打乱', icon: '🎲' },
    { value: 'reverse', label: '反向排列', icon: '🔄' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">文本排序</h1>
          <p className="text-gray-600 dark:text-gray-400">对文本行进行排序</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入文本（每行一条）
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="在此输入或粘贴文本，每行一条..."
                  className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  排序模式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        mode === m.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl mr-1">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="caseSensitive" className="text-sm text-gray-700 dark:text-gray-300">
                  区分大小写
                </label>
              </div>

              <button
                onClick={handleSort}
                disabled={!text || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                排序
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  排序结果
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
                placeholder="排序结果将显示在这里..."
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
