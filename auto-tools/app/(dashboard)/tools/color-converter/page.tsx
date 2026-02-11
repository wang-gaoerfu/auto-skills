'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function ColorConverterPage() {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [color1, setColor1] = useState('#3b82f6')
  const [color2, setColor2] = useState('#8b5cf6')
  const [blendRatio, setBlendRatio] = useState(50)

  const handleConvert = async () => {
    if (!input.trim()) {
      return
    }

    try {
      const response = await fetch('/api/tools/color-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse',
          input
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

  const handleBlend = async () => {
    try {
      const response = await fetch('/api/tools/color-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'blend',
          color1,
          color2,
          ratio: blendRatio / 100
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('混合失败:', error)
    }
  }

  const handleGradient = async () => {
    try {
      const response = await fetch('/api/tools/color-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gradient',
          color1,
          color2,
          steps: 5
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('生成渐变失败:', error)
    }
  }

  const handleVariants = async (color: string) => {
    try {
      const response = await fetch('/api/tools/color-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'variants',
          color
        }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('生成变体失败:', error)
    }
  }

  const examples = [
    { label: '红色 HEX', value: '#ff0000' },
    { label: '蓝色 RGB', value: 'rgb(0, 0, 255)' },
    { label: '绿色 HSL', value: 'hsl(120, 100%, 50%)' },
    { label: '半透明 RGBA', value: 'rgba(255, 0, 0, 0.5)' },
    { label: '颜色名称', value: 'tomato' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎨</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">颜色转换器</h1>
          <p className="text-gray-600 dark:text-gray-400">解析、转换和操作颜色</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          {/* Color Parser */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">颜色解析</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  示例颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {examples.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => setInput(ex.value)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="#ff0000, rgb(255,0,0), hsl(0,100%,50%), red"
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
              />

              <button
                onClick={handleConvert}
                disabled={!input || !session?.user}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                解析颜色
              </button>
            </div>
          </div>

          {/* Color Blend */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">颜色混合</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">颜色 1</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">颜色 2</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  混合比例: {blendRatio}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendRatio}
                  onChange={(e) => setBlendRatio(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleBlend}
                  disabled={!session?.user}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  混合
                </button>
                <button
                  onClick={handleGradient}
                  disabled={!session?.user}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  渐变 (5色)
                </button>
              </div>
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
                  颜色信息将显示在这里...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Color Preview */}
                  {result.hex && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                      <div
                        className="w-16 h-16 rounded-lg shadow-inner"
                        style={{ backgroundColor: result.hex }}
                      />
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400">主颜色</div>
                        <div className="font-mono text-sm font-medium">{result.hex}</div>
                      </div>
                    </div>
                  )}

                  {/* Format Values */}
                  {result.formats && (
                    <div className="space-y-2">
                      {Object.entries(result.formats).map(([format, value]: [string, any]) => (
                        <div key={format} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded group">
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-16 uppercase">{format}</span>
                          <code className="flex-1 text-xs font-mono text-gray-900 dark:text-white text-right">{value}</code>
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

                  {/* Gradient */}
                  {result.gradient && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">渐变</div>
                      <div className="h-8 rounded-lg" style={{ background: result.gradient }} />
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 block">{result.gradient}</code>
                    </div>
                  )}

                  {/* Variants */}
                  {result.variants && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">变体</div>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(result.variants).map(([name, color]: [string, any]) => (
                          <div key={name} className="text-center">
                            <div
                              className="w-full aspect-square rounded-lg mb-1"
                              style={{ backgroundColor: color as string }}
                            />
                            <div className="text-xs text-gray-600 dark:text-gray-400">{name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blend Result */}
                  {result.blended && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                      <div
                        className="w-12 h-12 rounded-lg shadow-inner"
                        style={{ backgroundColor: result.blended }}
                      />
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400">混合结果</div>
                        <div className="font-mono text-sm">{result.blended}</div>
                      </div>
                      <button
                        onClick={() => handleVariants(result.blended)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        变体
                      </button>
                    </div>
                  )}

                  {/* Gradient Steps */}
                  {result.steps && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">渐变色</div>
                      <div className="flex gap-1">
                        {result.steps.map((color: string, i: number) => (
                          <div
                            key={i}
                            className="flex-1 h-10 rounded-lg"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
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
