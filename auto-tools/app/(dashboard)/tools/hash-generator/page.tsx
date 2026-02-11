'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function HashGeneratorPage() {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [algorithm, setAlgorithm] = useState('sha256')
  const [hmacKey, setHmacKey] = useState('')
  const [useHmac, setUseHmac] = useState(false)
  const [outputFormat, setOutputFormat] = useState('hex')

  const handleGenerate = async () => {
    if (!input.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/hash-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          algorithm: useHmac ? 'hmac' : algorithm,
          options: {
            hmacKey: useHmac ? hmacKey : undefined,
            outputFormat
          }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResults(data.data.results)
      }
    } catch (error) {
      console.error('生成失败:', error)
    }
  }

  const algorithms = [
    { value: 'md5', label: 'MD5', desc: '128 位哈希（不推荐安全用途）' },
    { value: 'sha1', label: 'SHA-1', desc: '160 位哈希（不推荐安全用途）' },
    { value: 'sha256', label: 'SHA-256', desc: '256 位哈希（推荐）' },
    { value: 'sha384', label: 'SHA-384', desc: '384 位哈希' },
    { value: 'sha512', label: 'SHA-512', desc: '512 位哈希' },
  ]

  const formats = [
    { value: 'hex', label: '十六进制' },
    { value: 'base64', label: 'Base64' },
    { value: 'latin1', label: 'Latin1' },
  ]

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔐</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hash生成器</h1>
          <p className="text-gray-600 dark:text-gray-400">生成 MD5、SHA-1、SHA-256 等哈希值</p>
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
                  {input && (
                    <button
                      onClick={() => { setInput(''); setResults({}) }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入要生成哈希的文本..."
                  className="w-full h-32 px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  算法
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {algorithms.map(algo => (
                    <button
                      key={algo.value}
                      onClick={() => { setAlgorithm(algo.value); setUseHmac(false) }}
                      className={`p-3 rounded-lg text-left transition-all ${
                        algorithm === algo.value && !useHmac
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{algo.label}</div>
                      <div className={`text-xs mt-1 ${algorithm === algo.value && !useHmac ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {algo.desc}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setUseHmac(true)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      useHmac
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-medium text-sm">HMAC</div>
                    <div className={`text-xs mt-1 ${useHmac ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      带密钥的哈希消息认证码
                    </div>
                  </button>
                </div>
              </div>

              {useHmac && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    HMAC 密钥
                  </label>
                  <input
                    type="text"
                    value={hmacKey}
                    onChange={(e) => setHmacKey(e.target.value)}
                    placeholder="输入密钥..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输出格式
                </label>
                <div className="flex gap-2">
                  {formats.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setOutputFormat(f.value)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        outputFormat === f.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!input || !session?.user || (useHmac && !hmacKey)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                生成哈希
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                哈希结果
              </label>

              {Object.keys(results).length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  生成的哈希值将显示在这里...
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(results).map(([algo, hash]) => (
                    <div
                      key={algo}
                      className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          {algo.replace('-', ' ')}
                        </span>
                        <button
                          onClick={() => copyHash(hash)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline opacity-0 group-hover:opacity-100 transition-all"
                        >
                          复制
                        </button>
                      </div>
                      <code className="text-xs text-gray-900 dark:text-white font-mono break-all">
                        {hash}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
