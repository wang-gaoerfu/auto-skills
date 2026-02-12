'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function XmlToJsonPage() {
  const { data: session } = useSession()
  const [xml, setXml] = useState('')
  const [json, setJson] = useState('')
  const [action, setAction] = useState('parse')
  const [explicitArray, setExplicitArray] = useState(false)
  const [trim, setTrim] = useState(true)

  const handleProcess = async () => {
    if (!xml.trim() && !json.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/xml-to-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: action === 'parse' ? xml : json,
          action,
          options: { explicitArray, trim }
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (action === 'parse') {
          setJson(data.data.result)
        } else {
          setXml(data.data.result)
        }
      }
    } catch (error) {
      console.error('处理失败:', error)
    }
  }

  const xmlExamples = [
    { label: '简单 XML', value: '<root>\n  <name>张三</name>\n  <age>25</age>\n</root>' },
    { label: '数组示例', value: '<root>\n  <item>苹果</item>\n  <item>香蕉</item>\n  <item>橙子</item>\n</root>' },
    { label: '属性示例', value: '<user id="1" active="true">\n  <name>张三</name>\n</user>' },
  ]

  const jsonExamples = [
    { label: '简单对象', value: '{\n  "root": {\n    "name": "张三",\n    "age": 25\n  }\n}' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔄</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">XML转JSON</h1>
          <p className="text-gray-600 dark:text-gray-400">在 XML 和 JSON 之间互相转换</p>
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
                    {action === 'parse' ? 'XML 输入' : 'JSON 输入'}
                  </label>
                  {(xml || json) && (
                    <button
                      onClick={() => { setXml(''); setJson('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={action === 'parse' ? xml : json}
                  onChange={(e) => action === 'parse' ? setXml(e.target.value) : setJson(e.target.value)}
                  placeholder={action === 'parse' ? '<root>\n  <item>内容</item>\n</root>' : '{"root": {"item": "内容"}}'}
                  className="w-full h-56 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              {action === 'parse' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    XML 示例
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {xmlExamples.map(ex => (
                      <button
                        key={ex.label}
                        onClick={() => setXml(ex.value)}
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
                    onClick={() => setAction('parse')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      action === 'parse'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    XML → JSON
                  </button>
                  <button
                    onClick={() => setAction('build')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      action === 'build'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    JSON → XML
                  </button>
                </div>
              </div>

              {action === 'parse' && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="explicitArray"
                      checked={explicitArray}
                      onChange={(e) => setExplicitArray(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="explicitArray" className="text-sm text-gray-700 dark:text-gray-300">
                      始终使用数组
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="trim"
                      checked={trim}
                      onChange={(e) => setTrim(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="trim" className="text-sm text-gray-700 dark:text-gray-300">
                      去除空白
                    </label>
                  </div>
                </>
              )}

              <button
                onClick={handleProcess}
                disabled={(!xml && !json) || !session?.user}
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
                  {action === 'parse' ? 'JSON 输出' : 'XML 输出'}
                </label>
                {(json || xml) && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(action === 'parse' ? json : xml) }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    复制
                  </button>
                )}
              </div>

              <textarea
                readOnly
                value={action === 'parse' ? json : xml}
                placeholder={`转换后的${action === 'parse' ? 'JSON' : 'XML'}将显示在这里...`}
                className="w-full h-56 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
