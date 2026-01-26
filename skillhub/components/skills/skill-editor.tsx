'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface SkillContent {
  skillJson: any
  skillMd: string | null
  descriptionMd: string | null
}

type FileTab = 'skill.json' | 'SKILL.md' | 'description.md'

export function SkillEditor({ skillName }: { skillName: string }) {
  const router = useRouter()
  const [content, setContent] = useState<SkillContent | null>(null)
  const [activeTab, setActiveTab] = useState<FileTab>('skill.json')
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await fetch(`/api/skills/${skillName}`)
        if (!response.ok) {
          router.push('/skills')
          return
        }
        const data = await response.json()
        setContent(data.content)
        setEditingContent(data.content.skillJson ? JSON.stringify(data.content.skillJson, null, 2) : '')
      } catch (error) {
        console.error('Error fetching skill:', error)
        router.push('/skills')
      } finally {
        setLoading(false)
      }
    }

    fetchSkill()
  }, [skillName, router])

  useEffect(() => {
    if (content) {
      switch (activeTab) {
        case 'skill.json':
          setEditingContent(content.skillJson ? JSON.stringify(content.skillJson, null, 2) : '{}')
          break
        case 'SKILL.md':
          setEditingContent(content.skillMd || '')
          break
        case 'description.md':
          setEditingContent(content.descriptionMd || '')
          break
      }
    }
  }, [activeTab, content])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      let saveContent = editingContent

      // 如果是 JSON 文件，验证格式
      if (activeTab === 'skill.json') {
        try {
          JSON.parse(saveContent)
        } catch (error) {
          setMessage({ type: 'error', text: 'JSON 格式错误，请检查语法' })
          setSaving(false)
          return
        }
      }

      const response = await fetch(`/api/skills/${skillName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: activeTab,
          content: saveContent,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setMessage({ type: 'success', text: '保存成功' })

      // 更新本地内容
      if (activeTab === 'skill.json') {
        setContent(prev => ({ ...prev!, skillJson: JSON.parse(saveContent) }))
      } else if (activeTab === 'SKILL.md') {
        setContent(prev => ({ ...prev!, skillMd: saveContent }))
      } else {
        setContent(prev => ({ ...prev!, descriptionMd: saveContent }))
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center">加载中...</div>
  }

  if (!content) {
    return <div className="text-center">技能不存在</div>
  }

  const tabs: FileTab[] = ['skill.json', 'SKILL.md', 'description.md']

  return (
    <div className="mx-auto max-w-4xl">
      {/* 头部 */}
      <div className="mb-6">
        <Link href={`/skills/${skillName}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回详情
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">编辑技能: {skillName}</h1>
        <p className="mt-1 text-muted-foreground">修改技能的配置和内容</p>
      </div>

      {/* 标签页 */}
      <div className="mb-4 border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑器 */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTab}</CardTitle>
          <CardDescription>
            {activeTab === 'skill.json' && '技能配置文件（JSON 格式）'}
            {activeTab === 'SKILL.md' && '核心提示词文件'}
            {activeTab === 'description.md' && '使用说明文档'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="min-h-[400px] w-full rounded-md border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />

          {/* 状态消息 */}
          {message && (
            <div className={`mt-4 rounded-md p-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
            >
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
        </CardContent>
      </Card>
    </div>
  )
}
