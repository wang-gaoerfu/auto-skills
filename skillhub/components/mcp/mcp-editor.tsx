'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface MCPServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

interface EnvVar {
  key: string
  value: string
}

export function MCPEditor({ serverName }: { serverName: string }) {
  const router = useRouter()
  const [config, setConfig] = useState<MCPServerConfig | null>(null)
  const [args, setArgs] = useState<string[]>([])
  const [env, setEnv] = useState<EnvVar[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [newArg, setNewArg] = useState('')
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const response = await fetch(`/api/mcp/${serverName}`)
        if (!response.ok) {
          router.push('/mcp')
          return
        }
        const data = await response.json()
        setConfig(data.config)
        setArgs(data.config.args || [])
        setEnv(
          data.config.env
            ? Object.entries(data.config.env).map(([key, value]) => ({ key, value }))
            : []
        )
      } catch (error) {
        console.error('Error fetching MCP server:', error)
        router.push('/mcp')
      } finally {
        setLoading(false)
      }
    }

    fetchServer()
  }, [serverName, router])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const newConfig: MCPServerConfig = {
        command: config!.command,
      }

      if (args.length > 0) {
        newConfig.args = args
      }

      if (env.length > 0) {
        newConfig.env = {}
        env.forEach(e => {
          newConfig.env![e.key] = e.value
        })
      }

      const response = await fetch(`/api/mcp/${serverName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newConfig.command,
          config: newConfig,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setMessage({ type: 'success', text: '保存成功' })
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  const addArg = () => {
    if (newArg.trim()) {
      setArgs([...args, newArg.trim()])
      setNewArg('')
    }
  }

  const removeArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index))
  }

  const addEnv = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setEnv([...env, { key: newEnvKey.trim(), value: newEnvValue.trim() }])
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }

  const removeEnv = (index: number) => {
    setEnv(env.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div className="text-center">加载中...</div>
  }

  if (!config) {
    return <div className="text-center">MCP 服务器不存在</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 头部 */}
      <div className="mb-6">
        <Link href="/mcp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">编辑 MCP 服务器: {serverName}</h1>
        <p className="mt-1 text-muted-foreground">修改服务器配置</p>
      </div>

      <div className="space-y-6">
        {/* 基本配置 */}
        <Card>
          <CardHeader>
            <CardTitle>基本配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">命令</label>
              <input
                type="text"
                value={config.command}
                onChange={(e) => setConfig({ ...config, command: e.target.value })}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* 命令参数 */}
        <Card>
          <CardHeader>
            <CardTitle>命令参数</CardTitle>
            <CardDescription>启动服务器时传递的参数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newArg}
                onChange={(e) => setNewArg(e.target.value)}
                placeholder="--allow-read /path"
                className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyPress={(e) => e.key === 'Enter' && addArg()}
              />
              <Button onClick={addArg} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {args.length > 0 ? (
              <div className="space-y-1">
                {args.map((arg, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                    <code>{arg}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArg(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无参数</p>
            )}
          </CardContent>
        </Card>

        {/* 环境变量 */}
        <Card>
          <CardHeader>
            <CardTitle>环境变量</CardTitle>
            <CardDescription>服务器运行时的环境变量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="KEY"
                className="w-1/3 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="value"
                className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyPress={(e) => e.key === 'Enter' && addEnv()}
              />
              <Button onClick={addEnv} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {env.length > 0 ? (
              <div className="space-y-1">
                {env.map((envVar, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                    <code>{envVar.key}={envVar.value}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnv(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无环境变量</p>
            )}
          </CardContent>
        </Card>

        {/* 状态消息 */}
        {message && (
          <div className={`rounded-md p-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存更改
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
