'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, Heart } from "lucide-react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  category: string
  path: string
  useCount: number
  lastUsed: Date | null
}

interface SkillContent {
  skillJson: any
  skillMd: string | null
  descriptionMd: string | null
}

export function SkillDetail({ skillName }: { skillName: string }) {
  const [skill, setSkill] = useState<Skill | null>(null)
  const [content, setContent] = useState<SkillContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'skill' | 'description'>('overview')
  const router = useRouter()

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await fetch(`/api/skills/${skillName}`)
        if (!response.ok) {
          router.push('/skills')
          return
        }
        const data = await response.json()
        setSkill(data.skill)
        setContent(data.content)
      } catch (error) {
        console.error('Error fetching skill:', error)
        router.push('/skills')
      } finally {
        setLoading(false)
      }
    }

    fetchSkill()
  }, [skillName, router])

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>
  }

  if (!skill || !content) {
    return <div className="p-8 text-center">技能不存在</div>
  }

  return (
    <div className="p-8">
      {/* 返回按钮 */}
      <Link href="/skills">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
      </Link>

      {/* 技能头部信息 */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{skill.displayName}</h1>
            <p className="mt-2 text-muted-foreground">
              <span className="font-mono text-sm">{skill.name}</span>
              <span className="mx-2">•</span>
              <span className="text-sm">v{skill.version}</span>
              <span className="mx-2">•</span>
              <span className="text-sm capitalize">{skill.category}</span>
            </p>
            <p className="mt-4 text-muted-foreground">{skill.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Heart className="mr-2 h-4 w-4" />
              收藏
            </Button>
            <Link href={`/skills/${skill.name}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </Button>
            </Link>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
          <div>使用次数: {skill.useCount}</div>
          {skill.lastUsed && (
            <div>最后使用: {new Date(skill.lastUsed).toLocaleDateString('zh-CN')}</div>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('skill')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'skill'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SKILL.md
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'description'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            使用说明
          </button>
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>技能配置</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                {JSON.stringify(content.skillJson, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {activeTab === 'skill' && (
          <Card>
            <CardHeader>
              <CardTitle>核心提示词</CardTitle>
              <CardDescription>技能的核心行为定义</CardDescription>
            </CardHeader>
            <CardContent>
              {content.skillMd ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap">{content.skillMd}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground">此技能没有 SKILL.md 文件</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'description' && (
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
              <CardDescription>技能的使用方法和示例</CardDescription>
            </CardHeader>
            <CardContent>
              {content.descriptionMd ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap">{content.descriptionMd}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground">此技能没有 description.md 文件</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
