'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function WordCountPage() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!text.trim()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tools/word-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('分析失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔢</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">字数统计</h1>
          <p className="text-gray-600 dark:text-gray-400">统计文本的各种字符和单词数量</p>
        </div>
      </div>

      {/* Input */}
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

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || !text || !session?.user}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '分析中...' : '统计字数'}
            </button>

            {text && (
              <button
                onClick={() => { setText(''); setResult(null) }}
                className="px-6 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                清空
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">统计结果</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard label="字符数" value={result.characters} icon="📝" />
            <StatCard label="字符数(无空格)" value={result.charactersNoSpaces} icon="📄" />
            <StatCard label="单词数" value={result.words} icon="📊" />
            <StatCard label="行数" value={result.lines} icon="📋" />
            <StatCard label="段落数" value={result.paragraphs} icon="📑" />
            <StatCard label="句子数" value={result.sentences} icon="🔤" />
            <StatCard label="中文字符" value={result.chineseCharacters} icon="🀼" />
            <StatCard label="英文字母" value={result.letters} icon="ABC" />
            <StatCard label="数字" value={result.digits} icon="123" />
            <StatCard label="标点符号" value={result.punctuation} icon=".,!" />
            <StatCard label="字节数" value={result.bytes} icon="💾" />
            <StatCard label="平均单词长度" value={result.avgWordLength} icon="📏" />
            <StatCard label="平均行长度" value={result.avgLineLength} icon="📐" />
            <StatCard label="阅读时间" value={`${result.readingTime}分钟`} icon="📖" />
            <StatCard label="演讲时间" value={`${result.speakingTime}分钟`} icon="🎤" />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  )
}
