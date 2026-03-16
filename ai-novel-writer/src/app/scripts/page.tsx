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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PenTool,
  Plus,
  Film,
  MoreVertical,
  Trash2,
  FileText,
  Users,
  Loader2,
  PlayCircle,
  Download,
  Edit,
  ExternalLink,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Script project type
interface ScriptProject {
  id: string
  title: string
  description: string | null
  sourceType: string
  sourceNovelTitle: string | null
  genre: string | null
  status: string
  progress: number
  totalShots: number
  totalScenes: number
  createdAt: string
  updatedAt: string
  _count?: {
    sources: number
    characters: number
    scenes: number
  }
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  preparing: { label: "准备中", color: "bg-yellow-100 text-yellow-700" },
  generating: { label: "生成中", color: "bg-blue-100 text-blue-700" },
  paused: { label: "已暂停", color: "bg-orange-100 text-orange-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  error: { label: "错误", color: "bg-red-100 text-red-700" },
  retrying: { label: "重试中", color: "bg-purple-100 text-purple-700" },
}

// Source type configuration
const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  OWN_PROJECT: { label: "自有小说", icon: <FileText className="h-3 w-3" /> },
  EXTERNAL: { label: "外部导入", icon: <ExternalLink className="h-3 w-3" /> },
  ORIGINAL: { label: "原创创作", icon: <PenTool className="h-3 w-3" /> },
}

export default function ScriptsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ScriptProject[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ScriptProject | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch("/api/scripts")
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to fetch script projects:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      const res = await fetch(`/api/scripts/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
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

  function openDeleteDialog(project: ScriptProject) {
    setDeleteTarget(project)
    setDeleteDialogOpen(true)
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
      {/* Header */}
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

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Film className="h-8 w-8" />
              剧本工坊
            </h1>
            <p className="text-muted-foreground mt-1">
              将小说转化为专业分镜剧本
            </p>
          </div>
          <Link href="/scripts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建剧本
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">暂无剧本项目</h3>
              <p className="text-muted-foreground mb-4">
                导入小说内容，AI 自动生成专业分镜剧本
              </p>
              <Link href="/scripts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个剧本
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
              const sourceInfo = SOURCE_TYPE_CONFIG[project.sourceType] || SOURCE_TYPE_CONFIG.ORIGINAL
              const chapterCount = project._count?.sources || 0
              const characterCount = project._count?.characters || 0
              const sceneCount = project._count?.scenes || 0

              return (
                <Card key={project.id} className="group relative hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/scripts/${project.id}`}
                        className="flex-1 min-w-0"
                      >
                        <CardTitle className="text-lg truncate hover:text-primary">
                          {project.title}
                        </CardTitle>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/scripts/${project.id}`}>
                              <FileText className="h-4 w-4 mr-2" />
                              查看详情
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/scripts/${project.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑剧本
                            </Link>
                          </DropdownMenuItem>
                          {project.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/scripts/${project.id}/generate`}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                开始生成
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/scripts/${project.id}/export`}>
                              <Download className="h-4 w-4 mr-2" />
                              导出
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "暂无描述"}
                    </CardDescription>
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        {sourceInfo.icon}
                        {sourceInfo.label}
                      </Badge>
                      {project.genre && (
                        <Badge variant="outline" className="text-xs">
                          {project.genre}
                        </Badge>
                      )}
                      <Badge className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress bar for generating status */}
                    {project.status === "generating" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>生成进度</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{chapterCount} 章</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{characterCount} 角色</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Film className="h-3.5 w-3.5" />
                          <span>{sceneCount} 场景</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      更新于 {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除剧本「{deleteTarget?.title}」吗？此操作不可撤销，所有场景、镜头和相关数据都将被永久删除。
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
              onClick={handleDelete}
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
