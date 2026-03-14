"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PenTool,
  Plus,
  BookOpen,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Loader2,
  Settings,
  Eye,
  Download,
  FileText,
  FileDown,
  BookMarked,
  Users,
  Database,
  CheckCircle2,
  Circle,
  Sparkles,
  Target,
  AlertCircle,
} from "lucide-react"
import { marked } from "marked"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  genre?: string | null
  novelLength?: string | null
  status?: string
  targetWords?: number | null
  targetChapters?: number | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  chapters: Chapter[]
  membershipPlan: string
}

interface CompletionAnalysis {
  isCompletable: boolean
  completionScore: number
  analysis: {
    wordCountStatus: string
    chapterStatus: string
    storyEnding: string
    suggestions: string[]
  }
  lastChapterSignals: {
    hasEndingKeywords: boolean
    hasEpilogue: boolean
    conflictResolved: boolean
  }
}

interface CompletionData {
  status: string
  totalWordCount: number
  totalChapterCount: number
  analysis: CompletionAnalysis
}

interface KnowledgeStats {
  total: number
  character: number
  world: number
  plot: number
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats>({ total: 0, character: 0, world: 0, plot: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null)
  const [deletingChapter, setDeletingChapter] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null)
  const [previewHtml, setPreviewHtml] = useState("")

  // 导出对话框状态
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"txt" | "markdown" | "html" | "docx" | "pdf">("txt")
  const [exportIncludeMetadata, setExportIncludeMetadata] = useState(true)
  const [exporting, setExporting] = useState(false)

  // 完结状态相关
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false)
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)
  const [analyzingCompletion, setAnalyzingCompletion] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // 批量生成相关
  const [generateMode, setGenerateMode] = useState<"auto" | "manual">("auto")
  const [targetChapterCount, setTargetChapterCount] = useState<number>(0)
  const [additionalChapters, setAdditionalChapters] = useState<number>(5)
  const [isEndingMode, setIsEndingMode] = useState<boolean>(true) // 默认开启完结模式
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null)

  // 获取完结分析
  const fetchCompletionAnalysis = async () => {
    if (!project) return

    setAnalyzingCompletion(true)
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}/completion`)
      if (res.ok) {
        const data = await res.json()
        setCompletionData(data)
      }
    } catch (error) {
      console.error("Failed to fetch completion analysis:", error)
    } finally {
      setAnalyzingCompletion(false)
    }
  }

  // 更新项目状态
  const updateProjectStatus = async (status: "draft" | "writing" | "completed") => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}/completion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const data = await res.json()
        setProject(prev => prev ? { ...prev, status: data.project.status } : null)
        setCompletionDialogOpen(false)
        // 刷新页面数据
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(errorData.message || "更新失败")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      alert("更新失败，请稍后重试")
    } finally {
      setUpdatingStatus(false)
    }
  }

  // 批量生成章节 - 流式处理
  const handleBatchGenerate = async () => {
    if (!project) return

    setBatchGenerating(true)
    setBatchProgress({ current: 0, total: 0, message: "准备生成..." })

    // 用于跟踪是否需要保持进度消息
    let shouldKeepProgress = false

    try {
      const requestBody: {
        mode: "auto" | "manual"
        targetChapterCount?: number
        additionalChapters?: number
        isEndingMode?: boolean
      } = { mode: generateMode, isEndingMode }

      if (generateMode === "manual") {
        if (targetChapterCount > 0) {
          requestBody.targetChapterCount = targetChapterCount
        } else {
          requestBody.additionalChapters = additionalChapters
        }
      }

      const res = await fetch(`/api/projects/${resolvedParams.id}/batch-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      // 处理流式响应
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error("无法读取响应流")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case "start":
                  setBatchProgress({
                    current: 0,
                    total: data.total,
                    message: data.message,
                  })
                  break

                case "progress":
                  setBatchProgress({
                    current: data.current,
                    total: data.total,
                    message: data.message,
                  })
                  break

                case "chapter":
                  // 章节生成完成
                  if (data.success) {
                    setBatchProgress((prev) => ({
                      ...prev!,
                      message: `第 ${data.order} 章《${data.title}》已生成 (${data.wordCount} 字)`,
                    }))
                  } else {
                    setBatchProgress((prev) => ({
                      ...prev!,
                      message: `第 ${data.order} 章生成失败: ${data.error}`,
                    }))
                  }
                  break

                case "complete":
                  // 检查是否需要切换到人工模式
                  if (data.needsManualMode) {
                    setBatchProgress({
                      current: 0,
                      total: 0,
                      message: data.message,
                    })
                    // 切换到人工指定模式
                    setGenerateMode("manual")
                    // 保持进度消息显示
                    shouldKeepProgress = true
                    // 不关闭弹窗，让用户选择人工指定
                  } else {
                    setBatchProgress({
                      current: data.generatedCount,
                      total: data.totalRequested,
                      message: data.message,
                    })
                    // 刷新项目数据以显示新章节
                    setTimeout(async () => {
                      await refreshProjectData()
                      // 如果是完结模式且全部生成成功，自动标记为完结
                      if (isEndingMode && data.generatedCount === data.totalRequested) {
                        await updateProjectStatus("completed")
                      }
                      router.refresh()
                      setCompletionDialogOpen(false)
                    }, 1000)
                  }
                  break

                case "error":
                  alert(data.message)
                  break
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Batch generate error:", error)
      alert("生成失败，请稍后重试")
    } finally {
      setBatchGenerating(false)
      // 只有不需保持进度消息时才清除
      if (!shouldKeepProgress) {
        setBatchProgress(null)
      }
    }
  }

  // 打开完结分析对话框
  const openCompletionDialog = () => {
    setCompletionDialogOpen(true)
    fetchCompletionAnalysis()
  }

  // 刷新项目数据（包含章节列表）
  const refreshProjectData = async () => {
    try {
      const [projectRes, knowledgeRes] = await Promise.all([
        fetch(`/api/projects/${resolvedParams.id}`),
        fetch(`/api/knowledge?projectId=${resolvedParams.id}`).catch(() => ({ json: () => ({ entries: [], stats: {} }) }))
      ])

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data.project)
      }

      // 获取知识库统计
      if ('ok' in knowledgeRes && knowledgeRes.ok) {
        const knowledgeData = await knowledgeRes.json()
        setKnowledgeStats(knowledgeData.stats || { total: 0, character: 0, world: 0, plot: 0 })
      }
    } catch (err) {
      console.error("Failed to refresh project:", err)
    }
  }

  useEffect(() => {
    async function fetchProject() {
      try {
        const [projectRes, knowledgeRes] = await Promise.all([
          fetch(`/api/projects/${resolvedParams.id}`),
          fetch(`/api/knowledge?projectId=${resolvedParams.id}`).catch(() => ({ json: () => ({ entries: [], stats: {} }) }))
        ])

        if (!projectRes.ok) {
          throw new Error("Failed to fetch project")
        }
        const data = await projectRes.json()
        setProject(data.project)

        // 获取知识库统计
        if ('ok' in knowledgeRes && knowledgeRes.ok) {
          const knowledgeData = await knowledgeRes.json()
          setKnowledgeStats(knowledgeData.stats || { total: 0, character: 0, world: 0, plot: 0 })
        }
      } catch (err) {
        console.error(err)
        setError("加载项目失败")
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [resolvedParams.id])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/projects")
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.message || "删除失败")
      }
    } catch {
      alert("删除失败，请稍后重试")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function handleDeleteChapter() {
    if (!chapterToDelete) return

    setDeletingChapter(true)
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}/chapters/${chapterToDelete.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // 更新本地状态
        setProject(prev => prev ? {
          ...prev,
          chapters: prev.chapters.filter(c => c.id !== chapterToDelete.id)
        } : null)
      } else {
        const data = await res.json()
        alert(data.message || "删除章节失败")
      }
    } catch {
      alert("删除章节失败，请稍后重试")
    } finally {
      setDeletingChapter(false)
      setShowDeleteChapterDialog(false)
      setChapterToDelete(null)
    }
  }

  async function handleDeleteAllChapters() {
    if (!project || chapters.length === 0) return

    setDeletingAll(true)
    try {
      // 逐个删除所有章节
      for (const chapter of chapters) {
        const res = await fetch(`/api/projects/${resolvedParams.id}/chapters/${chapter.id}`, {
          method: "DELETE",
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || "删除章节失败")
        }
      }
      // 更新本地状态
      setProject(prev => prev ? { ...prev, chapters: [] } : null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除所有章节失败，请稍后重试")
    } finally {
      setDeletingAll(false)
      setShowDeleteAllDialog(false)
    }
  }

  function confirmDeleteChapter(chapter: Chapter) {
    setChapterToDelete(chapter)
    setShowDeleteChapterDialog(true)
  }

  // 处理导出
  const handleExport = async () => {
    if (!project) return

    // PDF 格式使用浏览器打印功能
    if (exportFormat === "pdf") {
      const exportUrl = `/api/projects/${resolvedParams.id}/export?format=html&includeMetadata=${exportIncludeMetadata}&print=1`
      // 打开新窗口并自动打印
      const printWindow = window.open(exportUrl, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
      setExportDialogOpen(false)
      return
    }

    setExporting(true)
    try {
      // 构建导出 URL
      const exportUrl = `/api/projects/${resolvedParams.id}/export?format=${exportFormat}&includeMetadata=${exportIncludeMetadata}`

      // 使用 fetch 获取文件
      const response = await fetch(exportUrl)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "导出失败" }))
        throw new Error(errorData.message || "导出失败")
      }

      // 获取文件名从 Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${project.title}.${exportFormat === "markdown" ? "md" : exportFormat}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1])
        } else {
          const simpleMatch = contentDisposition.match(/filename="?([^"]+)"?/)
          if (simpleMatch) {
            filename = simpleMatch[1]
          }
        }
      }

      // 创建 Blob 并下载
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExportDialogOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      alert(error instanceof Error ? error.message : "导出失败，请稍后重试")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "项目不存在"}</p>
          <Link href="/projects">
            <Button>返回项目列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  const chapters = project.chapters || []
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">返回项目列表</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/dashboard" className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              <span className="text-lg font-bold">AI小说创作能手</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* 阅读按钮 */}
            {chapters.length > 0 && (
              <Link href={`/projects/${resolvedParams.id}/read`}>
                <Button variant="outline" size="sm">
                  <BookMarked className="h-4 w-4 mr-2" />
                  阅读
                </Button>
              </Link>
            )}

            {/* 导出按钮 */}
            {chapters.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/projects/${resolvedParams.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑项目
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除项目
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认删除</DialogTitle>
                  <DialogDescription>
                    确定要删除项目「{project?.title}」吗？此操作不可撤销，所有章节和相关数据都将被永久删除。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    删除
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Chapter Dialog */}
            <AlertDialog open={showDeleteChapterDialog} onOpenChange={setShowDeleteChapterDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除章节</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除章节「{chapterToDelete?.title}」吗？此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingChapter}>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteChapter}
                    disabled={deletingChapter}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingChapter && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Chapters Dialog */}
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除所有章节</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除「{project?.title}」的所有 {chapters.length} 个章节吗？此操作不可撤销，所有章节内容将被永久删除。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllChapters}
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    删除全部
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Project Info */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {/* 完结状态 Badge */}
              {project.status === "completed" ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  已完结
                </Badge>
              ) : project.status === "writing" ? (
                <Badge variant="secondary">
                  <Circle className="h-3 w-3 mr-1" />
                  写作中
                </Badge>
              ) : (
                <Badge variant="outline">草稿</Badge>
              )}
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{chapters.length} 章节</span>
              <span>·</span>
              <span>{totalWords.toLocaleString()} 字</span>
              {project.genre && (
                <>
                  <span>·</span>
                  <span>{project.genre}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{project.membershipPlan}</Badge>
            {/* 完结管理按钮 */}
            {project.status !== "completed" && (
              <Button variant="outline" size="sm" onClick={openCompletionDialog}>
                <Target className="h-4 w-4 mr-2" />
                完结管理
              </Button>
            )}
            {project.status === "completed" && (
              <Button variant="outline" size="sm" onClick={openCompletionDialog}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                完结信息
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link href={`/projects/${resolvedParams.id}/chapters/new`}>
            <Card className="hover:border-primary cursor-pointer transition-all h-full">
              <CardHeader>
                <Plus className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>添加章节</CardTitle>
                <CardDescription>创建新章节</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/knowledge?projectId=${resolvedParams.id}`}>
            <Card className="hover:border-primary cursor-pointer transition-all h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-8 w-8 mb-2 text-primary" />
                  {knowledgeStats.total > 0 && (
                    <Badge variant="secondary" className="mb-2">{knowledgeStats.total}</Badge>
                  )}
                </div>
                <CardTitle>知识库</CardTitle>
                <CardDescription>
                  {knowledgeStats.total > 0
                    ? `${knowledgeStats.character} 人物 · ${knowledgeStats.world} 世界观 · ${knowledgeStats.plot} 剧情`
                    : "人物和世界观设定"
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {chapters.length > 0 && (
            <Link href={`/projects/${resolvedParams.id}/read`}>
              <Card className="hover:border-primary cursor-pointer transition-all h-full">
                <CardHeader>
                  <BookMarked className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>阅读小说</CardTitle>
                  <CardDescription>连续阅读所有章节</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {chapters.length > 0 && (
            <Card
              className="hover:border-primary cursor-pointer transition-all h-full"
              onClick={() => setExportDialogOpen(true)}
            >
              <CardHeader>
                <FileDown className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>导出小说</CardTitle>
                <CardDescription>TXT / Word / PDF</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <Separator className="my-8" />

        {/* Chapters */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">章节列表</h2>
          <div className="flex items-center gap-2">
            {chapters.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除全部章节
              </Button>
            )}
            <Link href={`/projects/${resolvedParams.id}/chapters/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加章节
              </Button>
            </Link>
          </div>
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
              <Card key={chapter.id} className="hover:border-primary transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/projects/${resolvedParams.id}/chapters/${chapter.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <span className="text-sm text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium">{chapter.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {chapter.wordCount.toLocaleString()} 字 · {new Date(chapter.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="预览"
                        onClick={async () => {
                          setPreviewChapter(chapter)
                          // 将 markdown 转换为 HTML
                          const plainText = chapter.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
                          const html = await marked.parse(plainText) as string
                          setPreviewHtml(html)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link href={`/projects/${resolvedParams.id}/chapters/${chapter.id}`}>
                        <Button variant="ghost" size="sm" title="编辑">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title="删除"
                        onClick={(e) => {
                          e.preventDefault()
                          confirmDeleteChapter(chapter)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Separator className="my-8" />
        <div className="text-sm text-muted-foreground">
          创建于 {new Date(project.createdAt).toLocaleDateString()} · 更新于 {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </main>

      {/* 预览对话框 */}
      <Dialog open={!!previewChapter} onOpenChange={() => setPreviewChapter(null)}>
        <DialogContent className="!max-w-[60vw] !w-[60vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewChapter?.title}</DialogTitle>
            <DialogDescription>
              {previewChapter?.wordCount.toLocaleString()} 字
            </DialogDescription>
          </DialogHeader>
          <div
            className="tiptap flex-1 overflow-y-auto p-6 border rounded-md bg-muted/30"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPreviewChapter(null)}>
              关闭
            </Button>
            <Link href={`/projects/${resolvedParams.id}/chapters/${previewChapter?.id}`}>
              <Button onClick={() => setPreviewChapter(null)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出对话框 */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              导出小说
            </DialogTitle>
            <DialogDescription>
              选择导出格式和选项
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 格式选择 */}
            <div className="space-y-2">
              <Label>导出格式</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as typeof exportFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择格式">
                    {exportFormat === "txt" && "TXT 纯文本"}
                    {exportFormat === "markdown" && "Markdown (.md)"}
                    {exportFormat === "html" && "HTML 网页"}
                    {exportFormat === "docx" && "Word 文档 (.docx)"}
                    {exportFormat === "pdf" && "PDF 文档"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">TXT 纯文本</SelectItem>
                  <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  <SelectItem value="html">HTML 网页</SelectItem>
                  <SelectItem value="docx">Word 文档 (.docx)</SelectItem>
                  <SelectItem value="pdf">PDF 文档</SelectItem>
                </SelectContent>
              </Select>
              {exportFormat === "pdf" && (
                <p className="text-xs text-muted-foreground mt-1">
                  将打开打印预览窗口，请使用"另存为 PDF"保存
                </p>
              )}
            </div>

            {/* 选项 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={exportIncludeMetadata}
                onCheckedChange={(checked) => setExportIncludeMetadata(checked as boolean)}
              />
              <Label htmlFor="includeMetadata" className="text-sm font-normal">
                包含书名和简介
              </Label>
            </div>

            {/* 导出信息 */}
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              <p className="text-muted-foreground">
                将导出 <span className="font-medium text-foreground">{chapters.length}</span> 个章节，
                共 <span className="font-medium text-foreground">{totalWords.toLocaleString()}</span> 字
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              开始导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完结管理对话框 */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              完结管理
            </DialogTitle>
            <DialogDescription>
              AI 辅助分析小说完结状态，由您决定是否标记为完结
            </DialogDescription>
          </DialogHeader>

          {analyzingCompletion ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">AI 正在分析小说完结状态...</p>
            </div>
          ) : completionData ? (
            <div className="space-y-6 py-4">
              {/* 完结度评分 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">完结度评分</Label>
                  <span className={`text-2xl font-bold ${
                    completionData.analysis.completionScore >= 80 ? "text-green-600" :
                    completionData.analysis.completionScore >= 50 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {completionData.analysis.completionScore}分
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      completionData.analysis.completionScore >= 80 ? "bg-green-600" :
                      completionData.analysis.completionScore >= 50 ? "bg-yellow-600" : "bg-red-600"
                    }`}
                    style={{ width: `${completionData.analysis.completionScore}%` }}
                  />
                </div>
              </div>

              {/* 状态统计 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">字数统计</div>
                  <div className="text-lg font-medium">{completionData.totalWordCount.toLocaleString()} 字</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {completionData.analysis.analysis.wordCountStatus}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">章节统计</div>
                  <div className="text-lg font-medium">{completionData.totalChapterCount} 章</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {completionData.analysis.analysis.chapterStatus}
                  </div>
                </div>
              </div>

              {/* 最后一章信号检测 */}
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-3">结局信号检测</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>结局关键词（大结局、尾声等）</span>
                    {completionData.analysis.lastChapterSignals.hasEndingKeywords ? (
                      <Badge variant="default" className="bg-green-600">检测到</Badge>
                    ) : (
                      <Badge variant="secondary">未检测到</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>尾声/后记</span>
                    {completionData.analysis.lastChapterSignals.hasEpilogue ? (
                      <Badge variant="default" className="bg-green-600">检测到</Badge>
                    ) : (
                      <Badge variant="secondary">未检测到</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>主要冲突解决</span>
                    {completionData.analysis.lastChapterSignals.conflictResolved ? (
                      <Badge variant="default" className="bg-green-600">已解决</Badge>
                    ) : (
                      <Badge variant="secondary">未明确</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* 故事结局分析 */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">AI 分析</div>
                <p className="text-sm text-muted-foreground">
                  {completionData.analysis.analysis.storyEnding}
                </p>
              </div>

              {/* 建议 */}
              {completionData.analysis.analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">建议</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {completionData.analysis.analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI 判断结果 */}
              <div className={`p-4 rounded-lg ${
                completionData.analysis.isCompletable ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-5 w-5 ${completionData.analysis.isCompletable ? "text-green-600" : "text-yellow-600"}`} />
                  <span className={`font-medium ${completionData.analysis.isCompletable ? "text-green-700" : "text-yellow-700"}`}>
                    {completionData.analysis.isCompletable ? "AI 判断：可以完结" : "AI 判断：建议继续创作"}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${completionData.analysis.isCompletable ? "text-green-600" : "text-yellow-600"}`}>
                  {completionData.analysis.isCompletable
                    ? "小说已达到完结条件，您可以审核后标记为完结"
                    : "小说尚未达到完结条件，建议继续创作"}
                </p>
              </div>

              {/* 继续创作选项 - 当未完结时显示 */}
              {!completionData.analysis.isCompletable && project?.status !== "completed" && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-medium">继续创作</span>
                  </div>

                  <div className="space-y-4">
                    {/* 模式选择 */}
                    <div className="space-y-2">
                      <Label>生成模式</Label>
                      <Select
                        value={generateMode}
                        onValueChange={(value) => setGenerateMode(value as "auto" | "manual")}
                      >
                        <SelectTrigger className="w-1/2">
                          <SelectValue>
                            {generateMode === "auto" ? "AI 自动规划" : "人工指定"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            <div className="flex flex-col items-start">
                              <span>AI 自动规划</span>
                              <span className="text-xs text-muted-foreground">让 AI 根据小说长度自动决定后续章节</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="manual">
                            <div className="flex flex-col items-start">
                              <span>人工指定</span>
                              <span className="text-xs text-muted-foreground">自行指定目标章节数或新增章节数</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 人工指定模式的选项 */}
                    {generateMode === "manual" && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-2">
                          <Label>目标总章节数</Label>
                          <div className="flex items-center gap-2 w-1/2">
                            <input
                              type="number"
                              min={completionData.totalChapterCount + 1}
                              max={100}
                              value={targetChapterCount || ""}
                              onChange={(e) => setTargetChapterCount(parseInt(e.target.value) || 0)}
                              placeholder="例如：30"
                              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">章</span>
                          </div>
                          <p className="text-xs text-muted-foreground">当前 {completionData.totalChapterCount} 章</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground w-1/2">
                          <span>或者</span>
                        </div>

                        <div className="space-y-2">
                          <Label>新增章节数</Label>
                          <div className="flex items-center gap-2 w-1/2">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={additionalChapters}
                              onChange={(e) => {
                                setAdditionalChapters(parseInt(e.target.value) || 1)
                                setTargetChapterCount(0)
                              }}
                              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">章</span>
                          </div>
                          <p className="text-xs text-muted-foreground">单次最多10章</p>
                        </div>
                      </div>
                    )}

                    {/* AI 自动模式的提示 */}
                    {generateMode === "auto" && (
                      <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                        <p>AI 将根据小说长度设定（{project?.novelLength === "micro" ? "微小说1章" :
                          project?.novelLength === "short" ? "短篇小说1-5章" :
                          project?.novelLength === "medium" ? "中篇小说10-30章" :
                          "长篇小说50章以上"}）自动规划后续章节。</p>
                        <p className="mt-2">单次最多生成 10 个章节。</p>
                      </div>
                    )}

                    {/* 完结模式选项 */}
                    <div className="flex items-start space-x-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Checkbox
                        id="endingMode"
                        checked={isEndingMode}
                        onCheckedChange={(checked) => setIsEndingMode(checked as boolean)}
                      />
                      <div className="grid gap-1 leading-none">
                        <Label htmlFor="endingMode" className="font-medium text-green-800 dark:text-green-200">
                          完结模式
                        </Label>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          开启后，AI 将分析前文内容，规划合理的结局，并在最后一章完成故事收尾
                        </p>
                      </div>
                    </div>

                    {/* 进度消息提示 */}
                    {batchProgress && !batchGenerating && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              提示
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              {batchProgress.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 批量生成按钮 */}
                    <Button
                      className="w-full"
                      onClick={handleBatchGenerate}
                      disabled={batchGenerating}
                    >
                      {batchGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {batchProgress?.message || "生成中..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          一键生成后续章节
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              加载失败，请重试
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setCompletionDialogOpen(false)}>
              关闭
            </Button>
            {!analyzingCompletion && completionData && (
              <>
                {project?.status === "completed" ? (
                  <Button
                    variant="secondary"
                    onClick={() => updateProjectStatus("writing")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    取消完结标记
                  </Button>
                ) : completionData.analysis.isCompletable ? (
                  <Button
                    onClick={() => updateProjectStatus("completed")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    标记为完结
                  </Button>
                ) : null}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
