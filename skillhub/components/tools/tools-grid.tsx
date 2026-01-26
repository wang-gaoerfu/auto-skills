'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, GitBranch, Cpu, Search } from "lucide-react"
import Link from "next/link"

interface Tool {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'ready' | 'beta' | 'coming-soon'
}

const tools: Tool[] = [
  {
    id: 'requirements',
    name: '需求分析',
    description: '完整的需求分析解决方案，从需求澄清到文档生成',
    icon: <FileText className="h-6 w-6" />,
    href: '/tools/requirements',
    status: 'ready',
  },
  {
    id: 'architecture',
    name: '架构设计',
    description: '技术选型和系统架构设计工具（即将推出）',
    icon: <GitBranch className="h-6 w-6" />,
    href: '#',
    status: 'coming-soon',
  },
  {
    id: 'code-review',
    name: '代码审查',
    description: '自动化代码审查工具（即将推出）',
    icon: <Search className="h-6 w-6" />,
    href: '#',
    status: 'coming-soon',
  },
  {
    id: 'performance',
    name: '性能分析',
    description: '应用性能分析和优化建议（即将推出）',
    icon: <Cpu className="h-6 w-6" />,
    href: '#',
    status: 'coming-soon',
  },
]

export function ToolsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {tools.map((tool) => (
        <Card key={tool.id} className={tool.status === 'coming-soon' ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {tool.icon}
                </div>
                <div>
                  <CardTitle>{tool.name}</CardTitle>
                  <div className="mt-1">
                    {tool.status === 'ready' && (
                      <span className="text-xs text-green-600">✓ 可用</span>
                    )}
                    {tool.status === 'beta' && (
                      <span className="text-xs text-yellow-600">β 测试版</span>
                    )}
                    {tool.status === 'coming-soon' && (
                      <span className="text-xs text-muted-foreground">即将推出</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">{tool.description}</CardDescription>
            {tool.status === 'ready' ? (
              <Link href={tool.href}>
                <Button className="w-full">
                  使用工具
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button className="w-full" disabled>
                即将推出
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
