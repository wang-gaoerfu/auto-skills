"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Plus,
  Film,
  FileText,
  Users,
  PlayCircle,
  Download,
  Edit,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

// Script project interface
interface ScriptProject {
  id: string
  title: string
  description: string | null
  sourceType: string
  sourceNovelTitle: string | null
  genre: string | null
  status: string
  subStatus: string | null
  progress: number
  totalShots: number
  totalScenes: number
  totalDuration: number
  createdAt: string
  updatedAt: string
  _count?: {
    sources: number
    characters: number
    scenes: number
  }
  sources?: Array<{
    id: string
    chapterTitle: string
    wordCount: number
  }>
  characters?: Array<{
    id: string
    name: string
    role: string | null
    shotCount: number
  }>
  scenes?: Array<{
    id: string
    sceneNumber: number
    title: string
    shotCount: number
    totalDuration: number
    shots?: Array<{
      id: string
      shotNumber: string
      status: string
    }>
  }>
  generationTasks?: Array<{
    id: string
    status: string
    progress: number
  }>
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
  ORIGINAL: { label: "原创创作", icon: <Sparkles className="h-3 w-3" /> },
}

export default function ScriptProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ScriptProject | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/scripts/${projectId}`)
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/scripts")
            return
          }
          throw new Error("Failed to fetch project")
        }
        const data = await res.json()
        setProject(data.project)
      } catch (error) {
        console.error("Failed to fetch script project:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router])

  async function handleDelete() {
    if (!project) return
    setDeletingId(project.id)
    try {
      const res = await fetch(`/api/scripts/${project.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/scripts")
      } else {
        const data = await res.json()
        alert(data.message || "删除失败")
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("删除失败，请稍后重试")
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
    }
  }

  async function handleStartGeneration() {
    if (!project) return
    router.push(`/scripts/${project.id}/generate`)
  }

  async function handleExport() {
    if (!project) return
    router.push(`/scripts/${project.id}/export`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
  const sourceInfo = SOURCE_TYPE_CONFIG[project.sourceType] || SOURCE_TYPE_CONFIG.ORIGINAL

  // Calculate totals from scenes
  const totalShots = project.scenes?.reduce((sum, scene) => sum + (scene.shots?.length || 0), 0) || 0
  const totalDuration = project.scenes?.reduce((sum, scene) => sum + (scene.totalDuration || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/scripts" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>返回列表</span>
            </Link>
            <h1 className="text-xl font-bold">{project.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="cursor-pointer">
              项目概览
            </TabsTrigger>
            <TabsTrigger value="sources" className="cursor-pointer">
              素材内容
            </TabsTrigger>
            <TabsTrigger value="characters" className="cursor-pointer">
              角色
            </TabsTrigger>
            <TabsTrigger value="scenes" className="cursor-pointer">
              场景
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">来源类型</span>
                    <span className="flex items-center gap-1">
                      {sourceInfo.icon}
                      {sourceInfo.label}
                    </span>
                  </div>
                  {project.sourceNovelTitle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">来源小说</span>
                      <span>{project.sourceNovelTitle}</span>
                    </div>
                  )}
                  {project.genre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">题材</span>
                      <span>{project.genre}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">状态</span>
                    <span className={cn("px-2 py-1 rounded text-xs", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">进度</span>
                    <span>{project.progress}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>统计信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">素材章节</span>
                    <span>{project._count?.sources || 0} 章</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">角色数量</span>
                    <span>{project._count?.characters || 0} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">场景数量</span>
                    <span>{project._count?.scenes || 0} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">镜头数量</span>
                    <span>{totalShots} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总时长</span>
                    <span>{totalDuration} 秒</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-6">
              <Button onClick={() => router.push(`/scripts/${project.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑内容
              </Button>
              <Button onClick={handleStartGeneration} disabled={project.status === "generating"}>
                <PlayCircle className="h-4 w-4 mr-2" />
                {project.status === "generating" ? "生成中..." : "开始生成"}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                删除项目
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>素材内容</CardTitle>
                <Link href={`/scripts/${project.id}/edit`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加章节
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {project.sources && project.sources.length > 0 ? (
                  <div className="space-y-2">
                    {project.sources.map((source, index) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">第{index + 1} 章</span>
                          <span className="font-medium">{source.chapterTitle}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{source.wordCount} 字</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无素材内容
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>角色列表</CardTitle>
                <Link href={`/scripts/${project.id}/edit`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加角色
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {project.characters && project.characters.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {project.characters.map((character) => (
                      <div key={character.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{character.name}</div>
                        {character.role && (
                          <div className="text-sm text-muted-foreground">{character.role}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          出场 {character.shotCount} 次
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无角色信息
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>场景列表</CardTitle>
                <Link href={`/scripts/${project.id}/edit`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加场景
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {project.scenes && project.scenes.length > 0 ? (
                  <div className="space-y-3">
                    {project.scenes.map((scene) => (
                      <div key={scene.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">场景 {scene.sceneNumber}: {scene.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {scene.shots?.length || 0} 个镜头 · {scene.totalDuration} 秒
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无场景信息
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                确定要删除剧本「{project.title}」吗？此操作不可撤销，所有场景、镜头和相关数据都将被永久删除。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={!!deletingId}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!!deletingId}>
                {deletingId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
