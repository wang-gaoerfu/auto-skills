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
  Eye,
  Clock,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Script project interface
interface ScriptSource {
  id: string
  chapterTitle: string
  content: string
  wordCount: number
  order: number
}

interface ScriptCharacter {
  id: string
  name: string
  role: string | null
  description: string | null
  shotCount: number
}

interface ScriptScene {
  id: string
  sceneNumber: number
  title: string
  description: string | null
  location: string | null
  timeOfDay: string | null
  mood: string | null
  totalDuration: number
  order: number
  _count?: {
    shots: number
  }
  shots?: Array<{
    id: string
    shotNumber: string
    status: string
  }>
}

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
  sources?: ScriptSource[]
  characters?: ScriptCharacter[]
  scenes?: ScriptScene[]
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
  PASTE: { label: "粘贴文本", icon: <FileText className="h-3 w-3" /> },
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

  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewSource, setPreviewSource] = useState<ScriptSource | null>(null)

  // Scene preview dialog state
  const [scenePreviewDialogOpen, setScenePreviewDialogOpen] = useState(false)
  const [previewScene, setPreviewScene] = useState<ScriptScene | null>(null)

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingType, setAnalyzingType] = useState<'all' | 'characters' | 'scenes'>('all')

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

  async function handleStartGeneration(type: 'all' | 'characters' | 'scenes' = 'all') {
    if (!project) return

    // 检查是否有素材
    if (!project.sources || project.sources.length === 0) {
      alert("请先导入素材内容")
      return
    }

    setAnalyzing(true)
    setAnalyzingType(type)
    try {
      const res = await fetch(`/api/scripts/${project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          options: {
            extractCharacters: type === 'all' || type === 'characters',
            extractScenes: type === 'all' || type === 'scenes',
            overwrite: true,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "分析失败")
      }

      const result = await res.json()

      // 异步模式：任务已启动，提示用户刷新查看进度
      if (result.success && result.taskId) {
        const typeText = type === 'all' ? '角色和场景' : type === 'characters' ? '角色' : '场景'
        alert(`${typeText}分析任务已启动！AI 正在后台分析素材，请稍后刷新页面查看结果。`)
        // 3秒后自动刷新
        setTimeout(() => window.location.reload(), 3000)
      } else if (result.result) {
        // 兼容旧格式
        alert(`分析完成！提取了 ${result.result.charactersExtracted} 个角色， ${result.result.scenesExtracted} 个场景`)
        window.location.reload()
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      alert(error instanceof Error ? error.message : "分析失败，请稍后重试")
    } finally {
      setAnalyzing(false)
      setAnalyzingType('all')
    }
  }

  // 单独提取角色
  async function handleExtractCharacters() {
    await handleStartGeneration('characters')
  }

  // 单独提取场景
  async function handleExtractScenes() {
    await handleStartGeneration('scenes')
  }

  async function handleExport() {
    if (!project) return
    router.push(`/scripts/${project.id}/export`)
  }

  function openPreview(source: ScriptSource) {
    setPreviewSource(source)
    setPreviewDialogOpen(true)
  }

  function openScenePreview(scene: ScriptScene) {
    setPreviewScene(scene)
    setScenePreviewDialogOpen(true)
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
  const totalShots = project.scenes?.reduce((sum, scene) => sum + (scene._count?.shots || scene.shots?.length || 0), 0) || 0
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
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-muted-foreground text-sm shrink-0">第{index + 1} 章</span>
                          <span className="font-medium truncate">{source.chapterTitle}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm text-muted-foreground">{source.wordCount} 字</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreview(source)}
                            title="预览内容"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExtractCharacters()}
                  disabled={analyzing || project.status === "generating"}
                >
                  {analyzing && analyzingType === 'characters' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      提取中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      重新提取角色
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {project.characters && project.characters.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {project.characters.map((character) => (
                      <div key={character.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{character.name}</span>
                          {character.role && (
                            <Badge variant="secondary" className="text-xs">{character.role}</Badge>
                          )}
                        </div>
                        {character.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {character.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          出场 {character.shotCount} 次
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>暂无角色信息</p>
                    <p className="text-sm mt-2 mb-4">点击上方按钮让 AI 自动提取角色</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>场景列表</CardTitle>
                <div className="flex gap-2">
                  {project.scenes && project.scenes.length > 0 && (
                    <Link href={`/scripts/${project.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑场景
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExtractScenes}
                    disabled={analyzing || project.status === "generating"}
                  >
                    {analyzing && analyzingType === 'scenes' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        提取中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        重新提取场景
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.scenes && project.scenes.length > 0 ? (
                  <div className="space-y-3">
                    {project.scenes.map((scene) => (
                      <div key={scene.id} className="p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                              {scene.sceneNumber}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{scene.title}</div>
                              {scene.description && (
                                <p className="text-sm text-muted-foreground truncate">{scene.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1 whitespace-nowrap min-w-[60px]">
                                <Film className="h-4 w-4" />
                                {scene._count?.shots || scene.shots?.length || 0} 镜头
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap min-w-[50px]">
                                <Clock className="h-4 w-4" />
                                {scene.totalDuration} 秒
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openScenePreview(scene)}
                              title="预览场景"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>暂无场景信息</p>
                    <p className="text-sm mt-2 mb-4">点击下方按钮让 AI 自动生成分镜场景</p>
                    <Button onClick={handleStartGeneration} disabled={analyzing || project.status === "generating"}>
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          AI 分析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          开始生成
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewSource?.chapterTitle}</DialogTitle>
              <DialogDescription>
                {previewSource?.wordCount} 字
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {previewSource?.content || ""}
                </ReactMarkdown>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scene Preview Dialog */}
        <Dialog open={scenePreviewDialogOpen} onOpenChange={setScenePreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">
                  {previewScene?.sceneNumber}
                </span>
                {previewScene?.title}
              </DialogTitle>
              <DialogDescription>
                场景 {previewScene?.sceneNumber} · {previewScene?._count?.shots || 0} 镜头 · {previewScene?.totalDuration || 0} 秒
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {previewScene?.location && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">地点</div>
                    <div className="text-sm">{previewScene.location}</div>
                  </div>
                )}
                {previewScene?.timeOfDay && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">时间</div>
                    <div className="text-sm">{previewScene.timeOfDay}</div>
                  </div>
                )}
                {previewScene?.mood && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">氛围</div>
                    <div className="text-sm">{previewScene.mood}</div>
                  </div>
                )}
                {previewScene?.description && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">场景描述</div>
                    <div className="text-sm whitespace-pre-wrap">{previewScene.description}</div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setScenePreviewDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
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
