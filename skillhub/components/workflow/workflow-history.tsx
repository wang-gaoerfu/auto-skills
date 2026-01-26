'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Filter } from "lucide-react"
import Link from "next/link"

interface WorkflowHistoryItem {
  id: string
  type: string
  title: string
  input: string
  output: string
  status: 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export function WorkflowHistory() {
  const [histories, setHistories] = useState<WorkflowHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'requirements-analysis' | 'architecture'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all')

  const fetchHistories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('type', filter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/workflow?${params}`)
      const data = await response.json()
      setHistories(data.histories || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条历史记录吗？')) {
      return
    }

    try {
      await fetch(`/api/workflow/${id}`, { method: 'DELETE' })
      await fetchHistories()
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  useEffect(() => {
    fetchHistories()
  }, [filter, statusFilter])

  const getTypeName = (type: string) => {
    switch (type) {
      case 'requirements-analysis':
        return '需求分析'
      case 'architecture':
        return '架构设计'
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">运行中</span>
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">已完成</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">失败</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 过滤器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">所有类型</option>
              <option value="requirements-analysis">需求分析</option>
              <option value="architecture">架构设计</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">所有状态</option>
              <option value="running">运行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
            <div className="ml-auto text-sm text-muted-foreground">
              共 {histories.length} 条记录
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 历史记录列表 */}
      {histories.length > 0 ? (
        <div className="space-y-4">
          {histories.map((history) => (
            <Card key={history.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{history.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2">
                        <span>{getTypeName(history.type)}</span>
                        <span>•</span>
                        <span>{new Date(history.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(history.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {history.input}
                </p>
                <div className="flex gap-2">
                  <Link href={`/workflow/${history.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(history.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>暂无历史记录</p>
            <Link href="/tools/requirements">
              <Button className="mt-4">
                开始使用工具
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
