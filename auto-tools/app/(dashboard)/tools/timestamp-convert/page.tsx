'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TimestampConvertPage() {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [unit, setUnit] = useState('auto')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const handleToTimestamp = async () => {
    if (!input.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/timestamp-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toTimestamp',
          input,
          options: { timezone }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  const handleToDate = async () => {
    if (!input.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/timestamp-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toDate',
          timestamp: input,
          unit,
          options: { timezone }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('转换失败:', error)
    }
  }

  const handleRange = async () => {
    try {
      const response = await fetch('/api/tools/timestamp-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'range',
          unit
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('获取范围失败:', error)
    }
  }

  const now = () => {
    const ts = Date.now()
    setInput(Math.floor(ts / 1000).toString())
    setUnit('seconds')
  }

  const examples = [
    { label: '当前时间戳', action: now },
    { label: '今天', value: '2024-01-15' },
    { label: '日期时间', value: '2024-01-15 14:30:00' },
    { label: 'ISO 时间', value: '2024-01-15T14:30:00Z' },
    { label: '相对时间', value: 'today', unit: 'seconds' },
    { label: '昨天', value: 'yesterday', unit: 'seconds' },
  ]

  const commonTimezones = [
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'UTC',
  ]

  const units = [
    { value: 'auto', label: '自动检测' },
    { value: 'seconds', label: '秒 (10位)' },
    { value: 'milliseconds', label: '毫秒 (13位)' },
    { value: 'microseconds', label: '微秒 (16位)' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🕐</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">时间戳转换</h1>
          <p className="text-gray-600 dark:text-gray-400">时间戳与日期时间互相转换</p>
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
                    输入
                  </label>
                  {input && (
                    <button
                      onClick={() => { setInput(''); setResult(null) }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="时间戳或日期时间..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  快捷输入
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (ex.action) {
                          ex.action()
                        } else {
                          setInput(ex.value)
                          if (ex.unit) setUnit(ex.unit)
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  时间戳单位
                </label>
                <div className="flex gap-2">
                  {units.map(u => (
                    <button
                      key={u.value}
                      onClick={() => setUnit(u.value)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        unit === u.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  时区
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">本地时区</option>
                  {commonTimezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleToTimestamp}
                  disabled={!input || !session?.user}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  日期 → 时间戳
                </button>
                <button
                  onClick={handleToDate}
                  disabled={!input || !session?.user}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  时间戳 → 日期
                </button>
              </div>

              <button
                onClick={handleRange}
                disabled={!session?.user}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                获取时间戳范围
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                结果
              </label>

              {!result ? (
                <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  转换结果将显示在这里...
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Timestamp Results */}
                  {result.timestamps && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">时间戳</div>
                      {Object.entries(result.timestamps).map(([unit, value]: [string, any]) => (
                        <div key={unit} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded group">
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-20 capitalize">{unit}</span>
                          <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white text-right">{value}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(value))}
                            className="ml-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            复制
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Date Results */}
                  {result.dates && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">日期时间</div>
                      {Object.entries(result.dates).map(([format, value]: [string, any]) => (
                        <div key={format} className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded group">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{format}</div>
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-gray-900 dark:text-white">{value}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(String(value))}
                              className="ml-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              复制
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Range */}
                  {result.range && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">时间戳范围</div>
                      {Object.entries(result.range).map(([unit, range]: [string, any]) => (
                        <div key={unit} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 capitalize">{unit}</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">最小:</span>
                              <code className="font-mono">{range.min}</code>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">最大:</span>
                              <code className="font-mono">{range.max}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {result.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                      {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
