'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function UuidGeneratorPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<string[]>([])
  const [version, setVersion] = useState('4')
  const [count, setCount] = useState(1)
  const [namespace, setNamespace] = useState('')
  const [name, setName] = useState('')
  const [validateInput, setValidateInput] = useState('')

  const handleGenerate = async () => {
    try {
      const response = await fetch('/api/tools/uuid-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          version,
          count,
          options: { namespace, name }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data.uuids)
      }
    } catch (error) {
      console.error('生成失败:', error)
    }
  }

  const handleValidate = async () => {
    if (!validateInput.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/uuid-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          uuid: validateInput
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult([data.data.valid ? '✅ 有效的 UUID' : '❌ 无效的 UUID'])
      }
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const versions = [
    { value: '1', label: 'UUID v1', desc: '基于时间和 MAC 地址' },
    { value: '3', label: 'UUID v3', desc: '基于 namespace 和名称的 MD5' },
    { value: '4', label: 'UUID v4', desc: '随机生成（推荐）' },
    { value: '5', label: 'UUID v5', desc: '基于 namespace 和名称的 SHA-1' },
  ]

  const namespaces = [
    { value: '', label: '自定义 namespace' },
    { value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', label: 'DNS namespace' },
    { value: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', label: 'URL namespace' },
    { value: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', label: 'OID namespace' },
    { value: '6ba7b814-9dad-11d1-80b4-00c04fd430c8', label: 'X.500 DN namespace' },
  ]

  const needsNamespace = version === '3' || version === '5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🆔</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">UUID生成器</h1>
          <p className="text-gray-600 dark:text-gray-400">生成和验证 UUID（通用唯一标识符）</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  UUID 版本
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {versions.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setVersion(v.value)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        version === v.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{v.label}</div>
                      <div className={`text-xs mt-1 ${version === v.value ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {v.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  生成数量 (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              {needsNamespace && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Namespace
                    </label>
                    <select
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      {namespaces.map(n => (
                        <option key={n.value} value={n.value}>{n.label}</option>
                      ))}
                    </select>
                  </div>

                  {namespace === '' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        自定义 Namespace UUID
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="输入自定义 namespace UUID..."
                        className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      名称
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="输入用于生成 UUID 的名称..."
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleGenerate}
                disabled={!session?.user || (needsNamespace && !name)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                生成 {count} 个 UUID
              </button>

              <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  验证 UUID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={validateInput}
                    onChange={(e) => setValidateInput(e.target.value)}
                    placeholder="输入 UUID 验证..."
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                  />
                  <button
                    onClick={handleValidate}
                    disabled={!validateInput || !session?.user}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    验证
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {result && result.length === 1 && (result[0]?.startsWith('✅') || result[0]?.startsWith('❌')) ? '验证结果' : '生成的 UUID'}
                </label>
                {result && result.length > 0 && !result[0]?.startsWith('✅') && !result[0]?.startsWith('❌') && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.join('\n')) }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    复制全部
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {!result || result.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                    生成的 UUID 将显示在这里...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.map((uuid, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                      >
                        <code className="text-sm text-gray-900 dark:text-white font-mono">
                          {uuid}
                        </code>
                        {!uuid.startsWith('✅') && !uuid.startsWith('❌') && (
                          <button
                            onClick={() => { navigator.clipboard.writeText(uuid) }}
                            className="opacity-0 group-hover:opacity-100 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-all"
                          >
                            复制
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {result && result.length > 1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  已生成 {result.length} 个 UUID
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
