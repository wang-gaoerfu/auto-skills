'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

interface WorkflowDetailData {
  id: string
  type: string
  title: string
  input: string
  output: string
  status: 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export function WorkflowDetail({ workflowId }: { workflowId: string }) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<WorkflowDetailData | null>(null)
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflow/${workflowId}`)
        if (!response.ok) {
          router.push('/workflow')
          return
        }
        const data = await response.json()
        setWorkflow(data.history)
        setOutput(data.output)
      } catch (error) {
        console.error('Error fetching workflow:', error)
        router.push('/workflow')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflow()
  }, [workflowId, router])

  const getStatusIcon = () => {
    switch (workflow?.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

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

  if (loading) {
    return <div className="text-center">加载中...</div>
  }

  if (!workflow) {
    return <div className="text-center">工作流不存在</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 头部 */}
      <div>
        <Link href="/workflow">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workflow.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {getTypeName(workflow.type)} • {new Date(workflow.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* 输入 */}
      <Card>
        <CardHeader>
          <CardTitle>输入</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
            {workflow.input}
          </pre>
        </CardContent>
      </Card>

      {/* 输出 */}
      {workflow.status !== 'running' && output && (
        <Card>
          <CardHeader>
            <CardTitle>输出结果</CardTitle>
            <CardDescription>
              {workflow.status === 'completed' ? '工作流成功完成' : '工作流执行失败'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap max-h-[500px]">
              {JSON.stringify(output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 元数据 */}
      <Card>
        <CardHeader>
          <CardTitle>详细信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">工作流 ID:</dt>
              <dd className="font-mono">{workflow.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">类型:</dt>
              <dd>{getTypeName(workflow.type)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">状态:</dt>
              <dd>{workflow.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">创建时间:</dt>
              <dd>{new Date(workflow.createdAt).toLocaleString('zh-CN')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">更新时间:</dt>
              <dd>{new Date(workflow.updatedAt).toLocaleString('zh-CN')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
