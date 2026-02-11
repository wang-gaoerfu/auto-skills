'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CsvToJsonPage() {
  const { data: session } = useSession()
  const [csv, setCsv] = useState('')
  const [json, setJson] = useState('')
  const [action, setAction] = useState('csv2json')
  const [delimiter, setDelimiter] = useState(',')
  const [hasHeader, setHasHeader] = useState(true)

  const handleProcess = async () => {
    if (!csv.trim() && !json.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/csv-to-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: action === 'csv2json' ? csv : json,
          action,
          options: { delimiter, hasHeader }
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (action === 'csv2json') {
          setJson(data.data.result)
        } else {
          setCsv(data.data.result)
        }
      }
    } catch (error) {
      console.error('处理失败:', error)
    }
  }

  const csvExamples = [
    {
      label: '学生数据',
      value: '姓名,年龄,城市\n张三,25,北京\n李四,30,上海\n王五,28,广州'
    },
    {
      label: '产品列表',
      value: '产品,价格,库存\n手机,2999,100\n电脑,5999,50\n平板,1999,80'
    },
    {
      label: '无标题数据',
      value: '苹果,5,red\n香蕉,3,yellow\n橙子,4,orange'
    },
  ]

  const jsonExamples = [
    {
      label: '简单数组',
      value: '[\n  {"姓名": "张三", "年龄": 25},\n  {"姓名": "李四", "年龄": 30}\n]'
    },
  ]

  const delimiters = [
    { value: ',', label: '逗号 (,)' },
    { value: '\t', label: '制表符 (Tab)' },
    { value: ';', label: '分号 (;)' },
    { value: '|', label: '竖线 (|)' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CSV转JSON</h1>
          <p className="text-gray-600 dark:text-gray-400">在 CSV 和 JSON 之间互相转换</p>
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
                    {action === 'csv2json' ? 'CSV 输入' : 'JSON 输入'}
                  </label>
                  {(csv || json) && (
                    <button
                      onClick={() => { setCsv(''); setJson('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={action === 'csv2json' ? csv : json}
                  onChange={(e) => action === 'csv2json' ? setCsv(e.target.value) : setJson(e.target.value)}
                  placeholder={action === 'csv2json' ? '姓名,年龄\n张三,25\n李四,30' : '[{"姓名": "张三", "年龄": 25}]'}
                  className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              {action === 'csv2json' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CSV 示例
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {csvExamples.map(ex => (
                      <button
                        key={ex.label}
                        onClick={() => { setCsv(ex.value); setHasHeader(ex.label !== '无标题数据') }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    JSON 示例
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {jsonExamples.map(ex => (
                      <button
                        key={ex.label}
                        onClick={() => setJson(ex.value)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  转换方向
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction('csv2json')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      action === 'csv2json'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    CSV → JSON
                  </button>
                  <button
                    onClick={() => setAction('json2csv')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      action === 'json2csv'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    JSON → CSV
                  </button>
                </div>
              </div>

              {action === 'csv2json' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      分隔符
                    </label>
                    <select
                      value={delimiter}
                      onChange={(e) => setDelimiter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      {delimiters.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasHeader"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hasHeader" className="text-sm text-gray-700 dark:text-gray-300">
                      第一行是标题
                    </label>
                  </div>
                </>
              )}

              <button
                onClick={handleProcess}
                disabled={(!csv && !json) || !session?.user}
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
                  {action === 'csv2json' ? 'JSON 输出' : 'CSV 输出'}
                </label>
                {(json || csv) && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(action === 'csv2json' ? json : csv) }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    复制
                  </button>
                )}
              </div>

              <textarea
                readOnly
                value={action === 'csv2json' ? json : csv}
                placeholder={`转换后的${action === 'csv2json' ? 'JSON' : 'CSV'}将显示在这里...`}
                className="w-full h-48 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
