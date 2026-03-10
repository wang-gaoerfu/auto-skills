"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  PenTool,
  Plus,
  BookOpen,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Calendar,
  Loader2,
  Settings,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

interface Project {
  id: string
  userId: string
  title: string
  description: string | null
  coverImage: string | null
  createdAt: Date
  updatedAt: Date
  chapters: Chapter[]
  membershipPlan: string
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) {
          throw new Error("Failed to fetch project")
        }
        const data = await res.json()
        setProject(data.project)
      } catch (err) {
        console.error(err)
        setError("加载项目失败")
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/projects">
            <Button>返回项目列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  const chapters = project?.chapters || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="flex items-center gap-2 hover:opacity-80">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              <span className="text-xl font-bold">AI小说创作能手</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${params.id}/edit`} className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    编辑项目
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <form action={`/api/projects/${params.id}`} method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <button type="submit" className="flex items-center w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除项目
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Project Info */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <Badge variant="secondary">{project.membershipPlan}</Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link href={`/projects/${params.id}/chapters/new`}>
            <Card className="hover:border-primary cursor-pointer transition-all">
              <CardHeader>
                <Plus className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>添加章节</CardTitle>
                <CardDescription>创建新章节</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card className="hover:border-primary cursor-pointer">
            <CardHeader>
              <BookOpen className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>知识库</CardTitle>
              <CardDescription>人物和世界观</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-primary cursor-pointer">
            <CardHeader>
              <Settings className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>项目设置</CardTitle>
              <CardDescription>提示词和模型配置</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Chapters */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">章节列表</h2>
          <Link href={`/projects/${params.id}/chapters/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加章节
            </Button>
          </Link>
        </div>

        {chapters.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无章节</p>
              <p className="text-sm text-muted-foreground">点击上方"添加章节"开始创作</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                href={`/projects/${params.id}/chapters/${chapter.id}`}
                className="block"
              >
                <Card className="hover:border-primary transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-8">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {chapter.wordCount.toLocaleString()} 字 · {" "}
                            {new Date(chapter.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <Separator className="my-8" />
        <div className="text-sm text-muted-foreground">
          创建于 {new Date(project.createdAt).toLocaleDateString()} · {" "}
          更新于 {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </main>
    </div>
  )
}
