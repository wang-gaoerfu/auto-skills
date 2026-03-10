"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, PenTool } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string | null
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const data = await res.json()

        if (res.ok) {
          setProject(data.project)
        } else {
          setError(data.message || "获取项目失败")
        }
      } catch {
        setError("获取项目失败，请稍后重试")
      } finally {
        setFetching(false)
      }
    }

    fetchProject()
  }, [projectId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title.trim()) {
      setError("请输入项目标题")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/projects/${projectId}`)
        router.refresh()
      } else {
        setError(data.message || "更新失败")
      }
    } catch {
      setError("更新失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center px-4">
            <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              <span>返回项目列表</span>
            </Link>
          </div>
        </header>
        <main className="container max-w-2xl px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error || "项目不存在"}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Link href={`/projects/${projectId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>返回项目</span>
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <PenTool className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">编辑项目</CardTitle>
                <CardDescription>
                  修改小说项目信息
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">项目标题 *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="输入小说标题"
                  required
                  disabled={loading}
                  maxLength={100}
                  defaultValue={project.title}
                />
                <p className="text-sm text-muted-foreground">
                  给你的小说起一个吸引人的名字
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">项目简介</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="简单描述一下这个故事..."
                  disabled={loading}
                  rows={4}
                  maxLength={500}
                  defaultValue={project.description || ""}
                />
                <p className="text-sm text-muted-foreground">
                  简要描述故事背景、主题或风格（可选）
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  保存修改
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
