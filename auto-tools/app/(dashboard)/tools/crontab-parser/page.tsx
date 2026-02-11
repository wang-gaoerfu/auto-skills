'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CrontabParserPage() {
  const { data: session } = useSession()
  const [expression, setExpression] = useState('*/5 * * * *')
  const [result, setResult] = useState<any>(null)

  const handleParse = async () => {
    if (!expression.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/crontab-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse',
          expression
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('解析失败:', error)
    }
  }

  const handleNextRuns = async () => {
    if (!expression.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/crontab-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next',
          expression,
          count: 10
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('计算失败:', error)
    }
  }

  const examples = [
    { label: '每5分钟', value: '*/5 * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天凌晨', value: '0 0 * * *' },
    { label: '每周一', value: '0 0 * * 1' },
    { label: '每月1号', value: '0 0 1 * *' },
    { label: '工作时间', value: '0 9-17 * * 1-5' },
    { label: '带秒(6字段)', value: '30 */5 * * * *' },
    { label: '复杂表达式', value: '*/15 9-17/2 1-15 * Mon-Fri' },
  ]

  const fieldLabels = ['秒', '分钟', '小时', '日期', '月份', '星期']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">⏰</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crontab解析器</h1>
          <p className="text-gray-600 dark:text-gray-400">解析和验证 Crontab 定时表达式</p>
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
                    Crontab 表达式
                  </label>
                  {expression && (
                    <button
                      onClick={() => { setExpression(''); setResult(null) }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="* * * * * 或 秒 分 时 日 月 周"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-lg tracking-wider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  常用示例
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {examples.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => setExpression(ex.value)}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all text-left"
                    >
                      <div className="font-medium">{ex.label}</div>
                      <div className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{ex.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleParse}
                  disabled={!expression || !session?.user}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  解析表达式
                </button>
                <button
                  onClick={handleNextRuns}
                  disabled={!expression || !session?.user}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  计算执行时间
                </button>
              </div>

              {/* Format Help */}
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">格式说明</div>
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  {fieldLabels.map(label => (
                    <div key={label} className="p-1 bg-white dark:bg-slate-700 rounded font-medium">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>• * : 任意值</div>
                  <div>• */n : 每隔 n</div>
                  <div>• n-m : 范围</div>
                  <div>• n,m : 多个值</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                解析结果
              </label>

              {!result ? (
                <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  解析结果将显示在这里...
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Valid */}
                  {result.valid !== undefined && (
                    <div className={`p-3 rounded-lg ${result.valid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                      {result.valid ? '✅ 有效的 Crontab 表达式' : '❌ 无效的 Crontab 表达式'}
                    </div>
                  )}

                  {/* Description */}
                  {result.description && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">执行说明</div>
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        {result.description}
                      </div>
                    </div>
                  )}

                  {/* Fields */}
                  {result.fields && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">字段解析</div>
                      <div className="space-y-2">
                        {result.fields.map((field: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12">
                              {fieldLabels[index] || `字段${index + 1}`}
                            </span>
                            <span className="flex-1 font-mono text-sm text-gray-900 dark:text-white">
                              {field.raw}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Runs */}
                  {result.nextRuns && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">接下来 10 次执行时间</div>
                      <div className="space-y-1">
                        {result.nextRuns.map((run: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded group hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-6">#{index + 1}</span>
                            <span className="font-mono text-sm text-gray-900 dark:text-white">{run}</span>
                          </div>
                        ))}
                      </div>
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
