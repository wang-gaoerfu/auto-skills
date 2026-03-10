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
import { ScrollArea } from "@/components/ui/scroll-area"
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
  BookOpen,
  Users,
  Globe,
  Zap,
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
  genre?: string
  outline?: string | null
  chapters: Chapter[]
}

interface KnowledgeEntry {
  id: string
  entryType: string
  title: string
  content: any
  tags: string[]
}

interface MenuOption {
  name: string
  prompt: string
}

interface GenreInfo {
  value: string
  label: string
}

export default function ChapterEditPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction, setAiAction] = useState<string>("generateContent")
  const [aiPrompt, setAiPrompt] = useState("")
  const [genres, setGenres] = useState<GenreInfo[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>("")
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([])
  const [selectedMenuAction, setSelectedMenuAction] = useState<string>("")
  const [fullscreen, setFullscreen] = useState(false)

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, chapterRes, knowledgeRes] = await Promise.all([
            fetch(`/api/projects/${params.id}`).then((r) => r.json()),
            fetch(`/api/projects/${params.id}/chapters/${params.chapterId}`).then((r) => r.json()),
            fetch(`/api/knowledge?projectId=${params.id}`).then((r) => r.json()).catch(() => ({ entries: [] })),
        ])

        setProject(projectRes.project)
        setChapter(chapterRes.chapter)
        setKnowledge(knowledgeRes.entries || [])

        // 获取题材列表
        const genresRes = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getGenres", projectId: params.id, params: {} }),
        })
        if (genresRes.ok) {
          const genresData = await genresRes.json()
          setGenres(genresData.genres || [])
          if (projectRes.project?.genre) {
            setSelectedGenre(projectRes.project.genre)
          }
        }
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
    setAiLoading(true)
    try {
      let res: Response

      if (aiAction === "menuOptimize") {
        // 右键菜单优化
        res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "menuOptimize",
            projectId: params.id,
            params: {
              menuType: "content",
              actionName: selectedMenuAction,
              selectedText: aiPrompt || chapter?.content?.slice(-500) || "",
              genre: selectedGenre || project?.genre,
            },
          }),
        })
      } else if (aiAction === "generateContent") {
        // 题材化生成章节内容
        res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateGenreChapterContent",
            projectId: params.id,
            params: {
              genre: selectedGenre || project?.genre || "urbanReborn",
              chapterTitle: chapter?.title,
              chapterOutline: aiPrompt,
              previousContent: chapter?.content?.slice(-1000) || "",
            },
          }),
        })
      } else {
        // 传统操作
        res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: aiAction,
            projectId: params.id,
            params: {
              content: chapter?.content || "",
              direction: aiPrompt,
            },
          }),
        })
      }

      if (res.ok) {
        const data = await res.json()
        setChapter((prev) => ({
          ...prev!,
          content: data.result,
        }))
        setAiDialogOpen(false)
        setAiPrompt("")
        setSelectedMenuAction("")
      }
    } catch (error) {
      console.error("AI generate failed:", error)
    } finally {
      setAiLoading(false)
    }
  }

  // 加载菜单选项
  const loadMenuOptions = async () => {
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getMenus",
          projectId: params.id,
          params: { genre: selectedGenre || project?.genre },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMenuOptions(data.menus?.content || [])
      }
    } catch (error) {
      console.error("Failed to load menus:", error)
    }
  }

  // 当 AI 操作改变时加载相应菜单
  useEffect(() => {
    if (aiAction === "menuOptimize") {
      loadMenuOptions()
    }
  }, [aiAction, selectedGenre])

  // 获取知识库信息用于显示
  const characters = knowledge.filter((k) => k.entryType === "character")
  const worldBuilding = knowledge.find((k) => k.entryType === "world")
  const plots = knowledge.filter((k) => k.entryType === "plot")

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
              onSave={saveChapter}
              fullscreen={fullscreen}
              onFullscreenChange={setFullscreen}
            />
          </div>

          {/* 侧边栏 */}
          {!fullscreen && (
            <div className="hidden lg:block space-y-4">
              {/* 章节导航 */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    章节导航
                  </h3>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
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
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 知识库概览 */}
              {(characters.length > 0 || worldBuilding || plots.length > 0) && (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      知识库
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 人物 */}
                    {characters.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          人物设定
                        </div>
                        <div className="space-y-1">
                          {characters.slice(0, 3).map((char) => (
                            <div key={char.id} className="text-xs p-2 bg-muted/50 rounded truncate">
                              {char.title}
                            </div>
                          ))}
                          {characters.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              还有 {characters.length - 3} 个...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 世界观 */}
                    {worldBuilding && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          世界观
                        </div>
                        <div className="text-xs p-2 bg-muted/50 rounded line-clamp-2">
                          {worldBuilding.content?.description || worldBuilding.title}
                        </div>
                      </div>
                    )}

                    {/* 剧情 */}
                    {plots.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          剧情设定
                        </div>
                        <div className="space-y-1">
                          {plots.slice(0, 2).map((plot) => (
                            <div key={plot.id} className="text-xs p-2 bg-muted/50 rounded truncate">
                              {plot.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/knowledge?projectId=${params.id}`}
                      className="block text-xs text-primary hover:underline mt-2"
                    >
                      管理知识库 →
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* AI 对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI 写作助手
            </DialogTitle>
            <DialogDescription>使用 AI 增强你的创作，保持内容、人物、故事的一致性</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 题材选择 */}
            <div className="space-y-2">
              <Label>小说题材</Label>
              <Select
                value={selectedGenre || project?.genre || ""}
                onValueChange={(value) => setSelectedGenre(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择题材（影响AI生成风格）" />
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

            {/* AI 操作类型 */}
            <div className="space-y-2">
              <Label>AI 操作</Label>
              <Select
                value={aiAction}
                onValueChange={(value) => setAiAction(value || "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generateContent">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      生成章节内容
                    </div>
                  </SelectItem>
                  <SelectItem value="menuOptimize">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      智能优化
                    </div>
                  </SelectItem>
                  <SelectItem value="polish">润色文本</SelectItem>
                  <SelectItem value="expand">扩写细节</SelectItem>
                  <SelectItem value="continue">续写内容</SelectItem>
                  <SelectItem value="removeAI">去除AI味</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 智能优化菜单 */}
            {aiAction === "menuOptimize" && menuOptions.length > 0 && (
              <div className="space-y-2">
                <Label>优化选项</Label>
                <div className="grid grid-cols-2 gap-2">
                  {menuOptions.map((option) => (
                    <Button
                      key={option.name}
                      type="button"
                      variant={selectedMenuAction === option.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMenuAction(option.name)}
                      className="justify-start"
                    >
                      {option.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 提示词输入 */}
            <div className="space-y-2">
              <Label>
                {aiAction === "generateContent"
                  ? "章节大纲/要点（可选）"
                  : aiAction === "menuOptimize"
                  ? "选中要优化的文本（可选）"
                  : "提示词"}
              </Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder={
                  aiAction === "generateContent"
                    ? "描述本章的核心情节、关键事件、人物互动等..."
                    : aiAction === "menuOptimize"
                    ? "如果没有选中文本，将优化最近的500字内容..."
                    : "输入你的要求..."
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>

            {/* 知识库提示 */}
            {(characters.length > 0 || worldBuilding || plots.length > 0) && (
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
                      <Globe className="h-3 w-3 mr-1" />
                      世界观
                    </Badge>
                  )}
                  {plots.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {plots.length} 个剧情
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAiDialogOpen(false)
              setAiPrompt("")
              setSelectedMenuAction("")
            }}>
              取消
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading || (aiAction === "menuOptimize" && !selectedMenuAction)}
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
