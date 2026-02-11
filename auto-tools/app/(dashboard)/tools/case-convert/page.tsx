'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CaseConvertPage() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState('upper')

  const modes = [
    { value: 'upper', label: '全部转大写', icon: '🔠' },
    { value: 'lower', label: '全部转小写', icon: '🔡' },
    { value: 'title', label: '首字母大写', icon: '📝' },
    { value: 'sentence', label: '句首大写', icon: '📄' },
    { value: 'camel', label: '驼峰命名(camelCase)', icon: '🐫' },
    { value: 'pascal', label: '帕斯卡命名(PascalCase)', icon: '🐪' },
    { value: 'snake', label: '蛇形命名(snake_case)', icon: '🐍' },
    { value: 'kebab', label: '短横线命名(kebab-case)', icon: '➖' },
    { value: 'toggle', label: '大小写反转', icon: '🔄' },
    { value: 'inverse', label: '大小写互换', icon: '⇄' },
  ]

  const handleConvert = async () => {
    if (!text.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/case-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data.converted)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔤</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">大小写转换</h1>
          <p className="text-gray-600 dark:text-gray-400">转换文本的大小写格式</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入文本
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="在此输入或粘贴文本..."
                  className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  转换模式
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

              <button
                onClick={handleConvert}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  转换结果
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
                placeholder="转换结果将显示在这里..."
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
