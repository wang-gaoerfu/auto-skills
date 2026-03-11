"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { marked } from "marked"
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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
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

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${resolvedParams.id}`)
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
                <DropdownMenuItem onClick={() => router.push(`/projects/${resolvedParams.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑项目
                </DropdownMenuItem>
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
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <Badge variant="secondary">{project.membershipPlan}</Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link href={`/projects/${resolvedParams.id}/chapters/new`}>
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
    </div>
  )
}
