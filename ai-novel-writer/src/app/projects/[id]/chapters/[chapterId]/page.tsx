"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NovelEditor } from "@/components/editor/novel-editor"
import {
  PenTool,
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Wand2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  wordCount: number
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  title: string
  chapters: Chapter[]
}

export default function ChapterEditPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction, setAiAction] = useState<string>("generate")
  const [aiPrompt, setAiPrompt] = useState("")

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, chapterRes] = await Promise.all([
            fetch(`/api/projects/${params.id}`).then((r) => r.json()),
            fetch(`/api/projects/${params.id}/chapters/${params.chapterId}`).then((r) => r.json()),
        ])

        setProject(projectRes.project)
        setChapter(chapterRes.chapter)
      } catch (error) {
        console.error("Failed to fetch:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, params.chapterId])

  // 自动保存
  const saveChapter = async () => {
    if (!chapter) return

    setSaving(true)
    try {
      const res = await fetch(
        `/api/projects/${params.id}/chapters/${params.chapterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: chapter.title,
            content: chapter.content,
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        setChapter(data.chapter)
      }
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setSaving(false)
    }
  }

  // AI 生成
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return

    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAction,
          projectId: params.id,
          params: {
            prompt: aiPrompt,
            currentContent: chapter?.content || "",
            context: `章节标题：${chapter?.title}`,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setChapter((prev) => ({
          ...prev!,
          content: data.result,
        }))
        setAiDialogOpen(false)
      }
    } catch (error) {
      console.error("AI generate failed:", error)
    } finally {
      setAiLoading(false)
    }
  }

  // 字数统计
  const wordCount = chapter?.content
    ? chapter.content.replace(/<[^>]*>/g, "").replace(/\s/g, "").length
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${params.id}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{chapter?.title}</h1>
              <p className="text-sm text-muted-foreground">
                {project?.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{wordCount.toLocaleString()} 字</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiDialogOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 助手
            </Button>
            <Button onClick={saveChapter} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* 编辑器 */}
          <div className="lg:col-span-1">
            <NovelEditor
              content={chapter?.content || ""}
              onChange={(content) =>
                setChapter((prev) => ({ ...prev!, content }))
              }
              placeholder="开始写作..."
            />
          </div>

          {/* 侧边栏 */}
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-medium">章节导航</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {project?.chapters?.map((ch, index) => (
                    <Link
                      key={ch.id}
                      href={`/projects/${params.id}/chapters/${ch.id}`}
                      className={`block px-3 py-2 rounded text-sm ${
                        ch.id === params.chapterId
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">
                          {index + 1}. {ch.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ch.wordCount}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* AI 对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI 写作助手
            </DialogTitle>
            <DialogDescription>使用 AI 噺强你的创作</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>AI 操作</Label>
              <Select
                value={aiAction}
                onValueChange={setAiAction}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate">续写内容</SelectItem>
                  <SelectItem value="polish">润色文本</SelectItem>
                  <SelectItem value="expand">扩写细节</SelectItem>
                  <SelectItem value="summarize">精简内容</SelectItem>
                  <SelectItem value="improve">改进文笔</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>提示词</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="输入你的要求，例如：增加一段对话描写..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {aiLoading ? "生成中..." : "开始生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
