'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function BinaryHexConvertPage() {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(16)
  const [showTable, setShowTable] = useState(false)

  const handleConvert = async () => {
    if (!input.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/binary-hex-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, fromBase, toBase, showTable }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data.result)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  const bases = [
    { value: 2, label: '二进制 (BIN)', example: '1010' },
    { value: 8, label: '八进制 (OCT)', example: '12' },
    { value: 10, label: '十进制 (DEC)', example: '10' },
    { value: 16, label: '十六进制 (HEX)', example: 'A' },
    { value: 32, label: '三十二进制', example: 'A' },
    { value: 36, label: '三十六进制', example: 'A' },
  ]

  const quickConversions = [
    { from: 2, to: 10, label: 'BIN → DEC' },
    { from: 2, to: 16, label: 'BIN → HEX' },
    { from: 10, to: 2, label: 'DEC → BIN' },
    { from: 10, to: 16, label: 'DEC → HEX' },
    { from: 16, to: 2, label: 'HEX → BIN' },
    { from: 16, to: 10, label: 'HEX → DEC' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔢</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">进制转换</h1>
          <p className="text-gray-600 dark:text-gray-400">在二进制、八进制、十进制、十六进制等之间转换</p>
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
                    输入数字
                  </label>
                  {input && (
                    <button
                      onClick={() => { setInput(''); setResult('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`输入 ${bases.find(b => b.value === fromBase)?.label.split(' ')[0]} 数字...`}
                  className="w-full h-32 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  示例: {bases.find(b => b.value === fromBase)?.example}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    原进制
                  </label>
                  <select
                    value={fromBase}
                    onChange={(e) => setFromBase(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {bases.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    目标进制
                  </label>
                  <select
                    value={toBase}
                    onChange={(e) => setToBase(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {bases.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  快速转换
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickConversions.map(qc => (
                    <button
                      key={`${qc.from}-${qc.to}`}
                      onClick={() => { setFromBase(qc.from); setToBase(qc.to) }}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showTable"
                  checked={showTable}
                  onChange={(e) => setShowTable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="showTable" className="text-sm text-gray-700 dark:text-gray-300">
                  显示转换对照表
                </label>
              </div>

              <button
                onClick={handleConvert}
                disabled={!input || !session?.user}
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
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
