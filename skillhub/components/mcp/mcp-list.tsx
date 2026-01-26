'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Power, Settings, Trash2 } from "lucide-react"
import Link from "next/link"

interface MCPServer {
  id: string
  name: string
  type: string
  config: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export function MCPList() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchServers = async (sync = false) => {
    try {
      const url = sync ? '/api/mcp?sync=true' : '/api/mcp'
      const response = await fetch(url)
      const data = await response.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error('Error fetching MCP servers:', error)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    await fetch('/api/mcp', { method: 'POST' })
    await fetchServers(true)
  }

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      await fetch(`/api/mcp/${name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      await fetchServers()
    } catch (error) {
      console.error('Error toggling server:', error)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除 MCP 服务器 "${name}" 吗？`)) {
      return
    }

    try {
      await fetch(`/api/mcp/${name}`, { method: 'DELETE' })
      await fetchServers()
    } catch (error) {
      console.error('Error deleting server:', error)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {servers.length} 个 MCP 服务器
        </div>
        <div className="flex gap-2">
          <Link href="/mcp/new">
            <Button variant="default" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              添加服务器
            </Button>
          </Link>
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步配置'}
          </Button>
        </div>
      </div>

      {/* MCP 服务器列表 */}
      {servers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {servers.map((server) => {
            const config = JSON.parse(server.config)

            return (
              <Card key={server.id} className={!server.enabled ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {server.name}
                        <span className={`h-2 w-2 rounded-full ${
                          server.enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">
                        {config.command}
                        {config.args && ` ${config.args.join(' ')}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>类型: {server.type}</div>
                    {config.env && (
                      <div>环境变量: {Object.keys(config.env).length} 个</div>
                    )}
                    <div>添加时间: {new Date(server.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(server.name, server.enabled)}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {server.enabled ? '禁用' : '启用'}
                    </Button>
                    <Link href={`/mcp/${server.name}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        配置
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(server.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            暂无 MCP 服务器，点击"同步配置"按钮从配置文件加载
          </p>
        </div>
      )}

      {/* 配置文件说明 */}
      <Card>
        <CardHeader>
          <CardTitle>配置文件位置</CardTitle>
          <CardDescription>MCP 服务器配置文件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-mono text-sm">.claude/config.json</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p>配置文件格式：</p>
              <pre className="mt-2">{`{
  "mcpServers": {
    "server-name": {
      "command": "command",
      "args": ["--arg1", "--arg2"],
      "env": { "KEY": "value" }
    }
  }
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
