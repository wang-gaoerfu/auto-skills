"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PenTool, Plus, BookOpen, CheckCircle2, Circle, FileText, Users, Globe, Zap, Loader2 } from "lucide-react"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { ThemeToggle } from "@/components/theme-toggle"

import { getAllGenres } from "@/lib/ai/deepseek"

// Project type definition
interface Project {
  id: string
  title: string
  description: string | null
  genre: string | null
  novelLength: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count: { chapters: number }
}

// 小说长度配置
const NOVEL_LENGTH_CONFIG = {
  micro: { label: "微小说", wordCount: "100-500字", chapterRange: "1章" },
  short: { label: "短篇小说", wordCount: "500-20000字", chapterRange: "1-5章" },
  medium: { label: "中篇小说", wordCount: "2-10万字", chapterRange: "10-30章" },
  long: { label: "长篇小说", wordCount: "10万字以上", chapterRange: "50章以上" },
}

export default function ProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  const [genres, setGenres] = useState<Array<{ value: string; label: string }>>([])

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProjectTitle, setDeleteProjectTitle] = useState("")

  useEffect(() => {
    async function fetchProjects() {
      try {
        const [projectRes, genresRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getGenres", projectId: "list", params: {} }),
          }),
        ])

        const projectData = await projectRes.json()
        const genresData = await genresRes.json()

        setProjects(projectData.projects || [])
        setGenres(genresData.genres || [])
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  async function handleDelete(projectId: string) {
    setDeletingId(projectId)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
        setDeleteDialogOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.message || "删除失败")
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("删除失败，请稍后重试")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">AI小说创作能手</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost">返回仪表盘</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">我的项目</h1>
            <p className="text-muted-foreground mt-1">
              管理你的小说创作项目
            </p>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建项目
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">暂无项目</h3>
              <p className="text-muted-foreground mb-4">
                点击上方"新建项目"开始你的创作之旅
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个项目
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const chapterCount = project._count.chapters
              const lengthKey = (project.novelLength || "medium") as keyof typeof NOVEL_LENGTH_CONFIG
              const lengthInfo = NOVEL_LENGTH_CONFIG[lengthKey]
              const genreLabel = genres.find(g => g.value === project.genre)?.label || "未分类"
              const statusColor =
                project.status === "completed" ? "bg-green-100 text-green-700" :
                project.status === "writing" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"

              return (
                <Card key={project.id} className="group relative hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 min-w-0"
                      >
                        <CardTitle className="text-lg truncate hover:text-primary">
                          {project.title}
                        </CardTitle>
                      </Link>
                      <ProjectCardMenu
                        projectId={project.id}
                        projectTitle={project.title}
                      />
                    </div>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "暂无描述"}
                    </CardDescription>
                    {/* 新增：标签信息 */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {project.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {genreLabel}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {lengthInfo.label}
                      </Badge>
                      {project.status === "completed" && (
                        <Badge className="text-xs bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          已完结
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <FileText className="h-4 w-4" />
                        <span>{chapterCount} 章节</span>
                      </div>
                      <span>
                        更新于 {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除项目「{deleteProjectTitle}」吗？此操作不可撤销，所有章节和相关数据都将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteProjectTitle)}
              disabled={!!deletingId}
            >
              {deletingId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
