'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function UrlEncodePage() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState('encode')

  const handleProcess = async () => {
    if (!text.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/url-encode', {
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

  const actions = [
    { value: 'encode', label: '编码', icon: '🔒', desc: '标准 URL 编码' },
    { value: 'decode', label: '解码', icon: '🔓', desc: 'URL 解码' },
    { value: 'encode-component', label: '编码组件', icon: '🔧', desc: '编码 URL 组件' },
    { value: 'decode-component', label: '解码组件', icon: '🔨', desc: '解码 URL 组件' },
    { value: 'encode-all', label: '全编码', icon: '🔐', desc: '编码所有字符' },
    { value: 'decode-all', label: '全解码', icon: '🔑', desc: '解码所有字符' },
  ]

  const examples = [
    { label: '空格和中文', text: 'Hello 世界! 测试=123' },
    { label: 'URL 参数', text: 'https://example.com/search?q=测试&page=1' },
    { label: '特殊字符', text: 'user@domain.com?name=张三&age=25' },
  ]

  const currentAction = actions.find(a => a.value === action)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔗</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">URL编解码</h1>
          <p className="text-gray-600 dark:text-gray-400">URL 编码或解码字符串</p>
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
                  placeholder="在此输入或粘贴 URL 或文本..."
                  className="w-full h-40 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  示例文本
                </label>
                <div className="flex flex-wrap gap-2">
                  {examples.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => setText(ex.text)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  操作模式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {actions.map(a => (
                    <button
                      key={a.value}
                      onClick={() => setAction(a.value)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        action === a.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{a.label}</div>
                          <div className={`text-xs ${action === a.value ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {a.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={!text || !session?.user}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentAction?.icon} {currentAction?.label}
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
                placeholder="URL 编解码结果将显示在这里..."
                className="w-full h-40 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />

              {result && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>原长度: {text.length} 字符</p>
                  <p>结果长度: {result.length} 字符</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
