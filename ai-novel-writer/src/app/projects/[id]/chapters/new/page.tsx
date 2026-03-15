"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Sparkles,
  Wand2,
  Trash2,
  GripVertical,
  FileText,
  BookOpen,
  Users,
  AlertCircle,
} from "lucide-react"

interface ChapterInput {
  id: string
  title: string
}

interface Project {
  id: string
  title: string
  genre?: string
  outline: string | null
  description?: string | null
  novelLength?: string | null
}

interface KnowledgeEntry {
  id: string
  entryType: string
  title: string
  content: any
}

interface GenreInfo {
  value: string
  label: string
}

export default function NewChapterPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [chapters, setChapters] = useState<ChapterInput[]>([
    { id: crypto.randomUUID(), title: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction, setAiAction] = useState("outline")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiCount, setAiCount] = useState(5)
  const [genres, setGenres] = useState<GenreInfo[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>("")

  // 加载项目信息和知识库
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, knowledgeRes, genresRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`).then((r) => r.json()),
          fetch(`/api/knowledge?projectId=${params.id}`).then((r) => r.json()).catch(() => ({ entries: [] })),
          fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getGenres", projectId: params.id, params: {} }),
          }).then((r) => r.json()).catch(() => ({ genres: [] })),
        ])

        setProject(projectRes.project)
        setKnowledge(knowledgeRes.entries || [])
        setGenres(genresRes.genres || [])
        if (projectRes.project?.genre) {
          setSelectedGenre(projectRes.project.genre)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [params.id])

  // 获取知识库信息
  const characters = knowledge.filter((k) => k.entryType === "character")
  const worldBuilding = knowledge.find((k) => k.entryType === "world")
  const plots = knowledge.filter((k) => k.entryType === "plot")

  // 检查知识库是否为空
  const hasKnowledge = knowledge.length > 0
  const hasCharacters = characters.length > 0
  const hasWorldOrPlot = worldBuilding || plots.length > 0
  // 用于判断是否显示知识库警告（没有知识库时显示）
  const hasKnowledgeBase = hasKnowledge

  // 添加章节输入
  function addChapter() {
    setChapters([...chapters, { id: crypto.randomUUID(), title: "" }])
  }

  // 删除章节输入
  function removeChapter(id: string) {
    if (chapters.length > 1) {
      setChapters(chapters.filter((c) => c.id !== id))
    }
  }

  // 更新章节标题
  function updateChapterTitle(id: string, title: string) {
    setChapters(
      chapters.map((c) => (c.id === id ? { ...c, title } : c))
    )
  }

  // 批量创建章节
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validChapters = chapters.filter((c) => c.title.trim())
    if (validChapters.length === 0) {
      setError("请至少输入一个章节标题")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let lastCreatedChapterId: string | null = null

      for (const chapter of validChapters) {
        const res = await fetch(`/api/projects/${params.id}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: chapter.title.trim() }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "创建失败")
        }

        lastCreatedChapterId = data.chapter.id
      }

      // 跳转到项目详情页
      router.push(`/projects/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // AI 生成章节大纲
  async function handleAIGenerate() {
    setAiLoading(true)
    setError(null)

    try {
      // 构建上下文信息
      const contextInfo = {
        characters: characters.map((c) => `${c.title}: ${c.content?.description || ""}`).join("\n"),
        world: worldBuilding?.content?.description || "",
        plot: plots.map((p) => p.content?.description || "").join("\n"),
      }

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateChapterOutline",
          projectId: params.id,
          params: {
            prompt: aiPrompt,
            count: aiCount,
            outline: project?.outline || "",
            genre: selectedGenre || project?.genre,
            characters: contextInfo.characters,
            world: contextInfo.world,
            plot: contextInfo.plot,
            title: project?.title || "",
            description: project?.description || "",
            novelLength: project?.novelLength || "medium",
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "AI生成失败")
      }

      const data = await res.json()

      // 解析 AI 返回的章节列表
      const lines = data.result
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && /^[\d一二三四五六七八九十]+[\.、:：\s]/.test(line))

      if (lines.length > 0) {
        // 提取章节标题
        const newChapters = lines.map((line: string) => ({
          id: crypto.randomUUID(),
          title: line.replace(/^[\d一二三四五六七八九十]+[\.、:：\s]*/, "").trim(),
        }))
        setChapters(newChapters)
      } else {
        // 如果解析失败，尝试按换行分割
        const titles = data.result
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && line.length < 100)

        if (titles.length > 0) {
          setChapters(
            titles.map((title: string) => ({
              id: crypto.randomUUID(),
              title,
            }))
          )
        }
      }

      setAiDialogOpen(false)
      setAiPrompt("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI生成失败，请稍后重试")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href={`/projects/${params.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回项目</span>
          </Link>
          {project && (
            <span className="text-sm text-muted-foreground">
              {project.title}
            </span>
          )}
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">添加章节</CardTitle>
                  <CardDescription>为你的小说添加一个或多个章节</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiDialogOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI 生成
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              {/* 知识库检查提示 */}
              {!hasKnowledgeBase && (
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">知识库为空</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    建议先创建知识库（人物、世界观、剧情），AI 生成章节时会保持内容一致性
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${params.id}/knowledge`)}
                  >
                    前往知识库
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <Label>章节列表</Label>
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm text-muted-foreground bg-muted rounded">
                        {index + 1}
                      </div>
                      <Input
                        placeholder={`第${index + 1}章 标题`}
                        value={chapter.title}
                        onChange={(e) =>
                          updateChapterTitle(chapter.id, e.target.value)
                        }
                        disabled={loading}
                        maxLength={200}
                        className="flex-1"
                      />
                      {chapters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChapter(chapter.id)}
                          disabled={loading}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChapter}
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加更多章节
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                已输入 {chapters.filter((c) => c.title.trim()).length} 个有效章节
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading || chapters.filter((c) => c.title.trim()).length === 0}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  创建 {chapters.filter((c) => c.title.trim()).length} 个章节
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* AI 对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI 生成章节大纲
            </DialogTitle>
            <DialogDescription>
              让 AI 帮你生成章节标题，保持内容、人物、故事的一致性
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 题材选择 */}
            {genres.length > 0 && (
              <div className="space-y-2">
                <Label>小说题材</Label>
                <Select
                  value={selectedGenre || project?.genre || ""}
                  onValueChange={(value) => setSelectedGenre(value || "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择题材（影响生成风格）">
                      {genres.find(g => g.value === (selectedGenre || project?.genre))?.label || "选择题材（影响生成风格）"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>生成方式</Label>
              <Select
                value={aiAction}
                onValueChange={(value) => setAiAction(value || "outline")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {aiAction === "outline" ? "根据大纲生成" : aiAction === "theme" ? "根据主题生成" : "自定义提示"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outline">根据大纲生成</SelectItem>
                  <SelectItem value="theme">根据主题生成</SelectItem>
                  <SelectItem value="custom">自定义提示</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>章节数量</Label>
              <Select
                value={aiCount.toString()}
                onValueChange={(v) => setAiCount(parseInt(v || "5"))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {aiCount} 章
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 章</SelectItem>
                  <SelectItem value="5">5 章</SelectItem>
                  <SelectItem value="10">10 章</SelectItem>
                  <SelectItem value="15">15 章</SelectItem>
                  <SelectItem value="20">20 章</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {aiAction === "outline"
                  ? "补充说明（可选）"
                  : aiAction === "theme"
                  ? "故事主题/题材"
                  : "提示词"}
              </Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder={
                  aiAction === "outline"
                    ? "例如：前5章重点描写主角的成长经历..."
                    : aiAction === "theme"
                    ? "例如：玄幻修仙，主角从废柴逆袭成为强者..."
                    : "例如：生成一个关于友情和冒险的故事大纲..."
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>

            {/* 知识库提示 */}
            {(characters.length > 0 || worldBuilding) && (
              <div className="p-3 bg-muted/50 rounded-md space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  知识库已同步，AI 将保持一致性
                </div>
                <div className="flex flex-wrap gap-2">
                  {characters.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {characters.length} 个人物
                    </Badge>
                  )}
                  {worldBuilding && (
                    <Badge variant="secondary" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      世界观
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {project?.outline && aiAction === "outline" && (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">
                  项目大纲
                </div>
                <div className="text-sm line-clamp-3">
                  {project.outline || "暂无大纲"}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading || (aiAction !== "outline" && !aiPrompt.trim())}
            >
              {aiLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {aiLoading ? "生成中..." : "开始生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
