"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, PenTool, Sparkles, Wand2, Rocket, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import Link from "next/link"

// 小说长度配置
const NOVEL_LENGTHS = [
  {
    value: "micro",
    label: "微小说",
    wordCount: "100-500字",
    chapterRange: "1章",
    description: "短小精悍，一气呵成"
  },
  {
    value: "short",
    label: "短篇小说",
    wordCount: "500-20000字",
    chapterRange: "1-5章",
    description: "完整故事，紧凑有力"
  },
  {
    value: "medium",
    label: "中篇小说",
    wordCount: "2-10万字",
    chapterRange: "10-30章",
    description: "情节丰富，人物饱满"
  },
  {
    value: "long",
    label: "长篇小说",
    wordCount: "10万字以上",
    chapterRange: "50章以上",
    description: "宏大叙事，连载追更"
  },
]

interface GenreInfo {
  value: string
  label: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<GenreInfo[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>("")
  const [selectedLength, setSelectedLength] = useState<string>("medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; description: string }>>([])

  // 一键自动创作状态
  const [autoCreateDialogOpen, setAutoCreateDialogOpen] = useState(false)
  const [autoCreateLoading, setAutoCreateLoading] = useState(false)
  const [autoCreateStage, setAutoCreateStage] = useState<string>("")
  const [autoCreateMessage, setAutoCreateMessage] = useState<string>("")
  const [autoCreateProgress, setAutoCreateProgress] = useState({ current: 0, total: 0 })
  const [autoCreateChapterProgress, setAutoCreateChapterProgress] = useState({ current: 0, total: 0 })
  const [autoCreateKnowledgeStatus, setAutoCreateKnowledgeStatus] = useState({
    character: "pending",
    world: "pending",
    plot: "pending",
  })
  const [autoCreateCreatedProjectId, setAutoCreateCreatedProjectId] = useState<string | null>(null)
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null)

  // 新增：Token 统计和取消控制
  const [autoCreateTaskId, setAutoCreateTaskId] = useState<string | null>(null)
  const [autoCreateTokensUsed, setAutoCreateTokensUsed] = useState(0)
  const [autoCreateEstimatedTokens, setAutoCreateEstimatedTokens] = useState(0)
  const [autoCreateTotalWordCount, setAutoCreateTotalWordCount] = useState(0)
  const [isCancelled, setIsCancelled] = useState(false)

  // 加载题材列表
  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getGenres", projectId: "new", params: {} }),
        })
        if (res.ok) {
          const data = await res.json()
          setGenres(data.genres || [])
        }
      } catch (error) {
        console.error("Failed to fetch genres:", error)
      }
    }
    fetchGenres()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    if (!title.trim()) {
      setError("请输入项目标题")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          genre: selectedGenre,
          novelLength: selectedLength,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/projects/${data.project.id}`)
      } else {
        setError(data.message || "创建失败")
      }
    } catch {
      setError("创建失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // AI 生成推荐
  async function handleAIGenerate() {
    if (!selectedGenre) {
      setError("请先选择小说题材")
      return
    }

    setAiLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateProjectSuggestions",
          projectId: "new",
          params: {
            genre: selectedGenre,
            novelLength: selectedLength,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "AI生成失败")
      }

      const data = await res.json()

      // 解析 AI 返回的建议
      const suggestions = parseAiSuggestions(data.result)
      setAiSuggestions(suggestions)
      setAiDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI生成失败，请稍后重试")
    } finally {
      setAiLoading(false)
    }
  }

  // 解析 AI 返回的建议
  function parseAiSuggestions(result: string): Array<{ title: string; description: string }> {
    const suggestions: Array<{ title: string; description: string }> = []
    const lines = result.split("\n").filter(line => line.trim())

    let currentTitle = ""
    let currentDesc = ""

    for (const line of lines) {
      // 匹配标题格式：数字. 书名 或 【书名】
      const titleMatch = line.match(/^(?:\d+[\.、\s]+|【)(.+?)(?:】)?$|(?:《)(.+?)(?:》)/)
      if (titleMatch) {
        if (currentTitle && currentDesc) {
          suggestions.push({ title: currentTitle, description: currentDesc.trim() })
        }
        currentTitle = titleMatch[1] || titleMatch[2] || line.replace(/^[\d\.、\s【】《》]+/, "").trim()
        currentDesc = ""
      } else if (currentTitle) {
        // 累积描述内容
        currentDesc += (currentDesc ? "\n" : "") + line.trim()
      }
    }

    // 添加最后一个
    if (currentTitle && currentDesc) {
      suggestions.push({ title: currentTitle, description: currentDesc.trim() })
    }

    // 如果解析失败，尝试简单的行解析
    if (suggestions.length === 0) {
      const chunks = result.split(/\n{2,}/)
      for (const chunk of chunks) {
        const lines = chunk.split("\n").filter(l => l.trim())
        if (lines.length >= 2) {
          suggestions.push({
            title: lines[0].replace(/^[\d\.、\s【】《》]+/, "").trim(),
            description: lines.slice(1).join("\n").trim()
          })
        }
      }
    }

    return suggestions.slice(0, 5) // 最多返回5个建议
  }

  // 选择 AI 建议
  function selectSuggestion(suggestion: { title: string; description: string }) {
    setTitle(suggestion.title)
    setDescription(suggestion.description)
    setAiDialogOpen(false)
  }

  // 重置自动创作状态
  const resetAutoCreateState = useCallback(() => {
    setAutoCreateStage("")
    setAutoCreateMessage("")
    setAutoCreateProgress({ current: 0, total: 0 })
    setAutoCreateChapterProgress({ current: 0, total: 0 })
    setAutoCreateKnowledgeStatus({ character: "pending", world: "pending", plot: "pending" })
    setAutoCreateCreatedProjectId(null)
    setAutoCreateError(null)
    setAutoCreateTaskId(null)
    setAutoCreateTokensUsed(0)
    setAutoCreateEstimatedTokens(0)
    setAutoCreateTotalWordCount(0)
    setIsCancelled(false)
  }, [])

  // 取消自动创作
  const handleCancelAutoCreate = useCallback(async () => {
    if (!autoCreateTaskId) return

    try {
      await fetch(`/api/projects/auto-create?taskId=${autoCreateTaskId}`, {
        method: "DELETE",
      })
      setIsCancelled(true)
      setAutoCreateStage("cancelled")
      setAutoCreateMessage("任务已取消")
    } catch (error) {
      console.error("Failed to cancel task:", error)
    }
  }, [autoCreateTaskId])

  // 一键自动创作
  const handleAutoCreate = useCallback(async (resumeTaskId?: string) => {
    if (!title.trim() && !resumeTaskId) {
      setError("请输入项目标题")
      return
    }

    // 重置状态
    resetAutoCreateState()
    setAutoCreateLoading(true)
    setAutoCreateDialogOpen(true)

    try {
      const response = await fetch("/api/projects/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeTaskId ? { resumeTaskId } : {
          title,
          description,
          genre: selectedGenre || "urbanReborn",
          novelLength: selectedLength,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "创建失败")
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("无法读取响应流")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case "start":
                  setAutoCreateEstimatedTokens(data.estimatedTokens || 0)
                  setAutoCreateChapterProgress({ current: 0, total: data.targetChapters || 0 })
                  break

                case "resume":
                  setAutoCreateMessage(data.message)
                  if (data.progress) {
                    setAutoCreateChapterProgress({
                      current: data.progress.currentChapter || 0,
                      total: data.progress.totalChapters || 0
                    })
                    if (data.progress.knowledgeGenerated) {
                      setAutoCreateKnowledgeStatus(prev => {
                        const newStatus = { ...prev }
                        data.progress.knowledgeGenerated.forEach((type: string) => {
                          if (type in newStatus) {
                            newStatus[type as keyof typeof newStatus] = "completed"
                          }
                        })
                        return newStatus
                      })
                    }
                  }
                  break

                case "progress":
                  setAutoCreateStage(data.stage)
                  setAutoCreateMessage(data.message)
                  if (data.progress) {
                    setAutoCreateProgress(data.progress)
                  }
                  if (data.totalChapters) {
                    setAutoCreateChapterProgress({ current: 0, total: data.totalChapters })
                  }
                  break

                case "project_created":
                  setAutoCreateCreatedProjectId(data.projectId)
                  if (data.taskId) {
                    setAutoCreateTaskId(data.taskId)
                  }
                  break

                case "knowledge_progress":
                  setAutoCreateMessage(data.message)
                  break

                case "knowledge_generated":
                  setAutoCreateKnowledgeStatus(prev => ({
                    ...prev,
                    [data.entryType]: "completed"
                  }))
                  if (data.tokensUsed) {
                    setAutoCreateTokensUsed(data.tokensUsed)
                  }
                  break

                case "chapter_progress":
                  setAutoCreateStage("generating_chapters")
                  setAutoCreateMessage(data.message)
                  setAutoCreateChapterProgress({
                    current: data.current,
                    total: data.total
                  })
                  break

                case "chapter_generated":
                  setAutoCreateChapterProgress(prev => ({
                    ...prev,
                    current: data.order
                  }))
                  if (data.tokensUsed) {
                    setAutoCreateTokensUsed(data.tokensUsed)
                  }
                  if (data.wordCount) {
                    setAutoCreateTotalWordCount(prev => prev + data.wordCount)
                  }
                  break

                case "complete":
                  setAutoCreateStage("completed")
                  setAutoCreateMessage(data.message)
                  if (data.tokensUsed) {
                    setAutoCreateTokensUsed(data.tokensUsed)
                  }
                  if (data.totalWordCount) {
                    setAutoCreateTotalWordCount(data.totalWordCount)
                  }
                  // 跳转到项目页面
                  setTimeout(() => {
                    if (data.projectId) {
                      router.push(`/projects/${data.projectId}`)
                    }
                  }, 1500)
                  break

                case "cancelled":
                  setAutoCreateStage("cancelled")
                  setAutoCreateMessage(data.message)
                  break

                case "error":
                  setAutoCreateError(data.message)
                  setAutoCreateStage("error")
                  break
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      setAutoCreateError(err instanceof Error ? err.message : "自动创作失败")
      setAutoCreateStage("error")
    } finally {
      setAutoCreateLoading(false)
    }
  }, [title, description, selectedGenre, selectedLength, resetAutoCreateState, router])

  const selectedLengthInfo = NOVEL_LENGTHS.find(l => l.value === selectedLength)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>返回项目列表</span>
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <PenTool className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">新建项目</CardTitle>
                <CardDescription>
                  创建一个新的小说创作项目，选择题材让 AI 更懂你
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 题材选择 */}
              <div className="space-y-2">
                <Label>小说题材</Label>
                <Select value={selectedGenre} onValueChange={(value) => setSelectedGenre(value || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择题材类型">
                      {genres.find(g => g.value === selectedGenre)?.label || "选择题材类型"}
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
                <p className="text-sm text-muted-foreground">
                  选择题材后，AI 会根据题材特点生成内容
                </p>
              </div>

              {/* 小说长度 */}
              <div className="space-y-2">
                <Label>小说长度</Label>
                <Select value={selectedLength} onValueChange={(value) => setSelectedLength(value || "medium")}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectedLengthInfo ? `${selectedLengthInfo.label}（${selectedLengthInfo.wordCount}）` : "选择长度"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {NOVEL_LENGTHS.map((length) => (
                      <SelectItem key={length.value} value={length.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{length.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {length.wordCount} · {length.chapterRange}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLengthInfo && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLengthInfo.description}
                  </p>
                )}
              </div>

              {/* AI 生成推荐按钮 */}
              {selectedGenre && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {aiLoading ? "AI 思考中..." : "AI 生成推荐标题和简介"}
                </Button>
              )}

              <div className="border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">项目标题 *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="输入小说标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    给你的小说起一个吸引人的名字
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="description">项目简介</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="简单描述一下这个故事..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground">
                    简要描述故事背景、主题或风格（可选）
                  </p>
                </div>
              </div>

              {/* 一键自动创作提示 */}
              {title.trim() && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Rocket className="h-5 w-5" />
                    <span className="font-medium">一键自动创作</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    自动生成完整的小说，包括知识库（人物、世界观、剧情）和所有章节，并通过完结检测
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => handleAutoCreate()}
                    disabled={autoCreateLoading || loading}
                  >
                    {autoCreateLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    {autoCreateLoading ? "创作中..." : "一键自动创作整本小说"}
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading || autoCreateLoading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading || autoCreateLoading} variant="secondary">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  仅创建项目
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* AI 建议选择弹窗 */}
      {aiDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <CardTitle>AI 推荐标题</CardTitle>
              </div>
              <CardDescription>
                选择一个你喜欢的标题和简介，或手动修改
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[50vh]">
              {aiSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {suggestion.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>AI 暂无建议，请手动输入标题和简介</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                关闭
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 一键自动创作进度弹窗 */}
      <Dialog open={autoCreateDialogOpen} onOpenChange={(open) => {
        if (!open && !autoCreateLoading) {
          setAutoCreateDialogOpen(false)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {autoCreateStage === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : autoCreateStage === "error" ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {autoCreateStage === "completed"
                ? "创作完成"
                : autoCreateStage === "error"
                ? "创作失败"
                : "正在自动创作小说..."}
            </DialogTitle>
            <DialogDescription>{autoCreateMessage}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 步骤列表 */}
            <div className="space-y-3">
              {/* Step 1: 创建项目 */}
              <div className="flex items-center gap-3">
                {autoCreateCreatedProjectId ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : autoCreateStage === "creating_project" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={autoCreateCreatedProjectId ? "text-foreground" : "text-muted-foreground"}>
                  创建项目
                </span>
              </div>

              {/* Step 2: 生成知识库 */}
              <div className="flex items-center gap-3">
                {autoCreateKnowledgeStatus.character === "completed" &&
                autoCreateKnowledgeStatus.world === "completed" &&
                autoCreateKnowledgeStatus.plot === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : autoCreateStage === "generating_knowledge" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <span className={autoCreateKnowledgeStatus.character === "completed" ? "text-foreground" : "text-muted-foreground"}>
                    生成知识库
                  </span>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    {autoCreateKnowledgeStatus.character === "completed" && <span>✓ 人物</span>}
                    {autoCreateKnowledgeStatus.world === "completed" && <span>✓ 世界观</span>}
                    {autoCreateKnowledgeStatus.plot === "completed" && <span>✓ 剧情</span>}
                  </div>
                </div>
              </div>

              {/* Step 3: 生成章节 */}
              <div className="flex items-center gap-3">
                {autoCreateChapterProgress.current === autoCreateChapterProgress.total &&
                autoCreateChapterProgress.total > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : autoCreateStage === "generating_chapters" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <span className={autoCreateChapterProgress.current > 0 ? "text-foreground" : "text-muted-foreground"}>
                    生成章节
                  </span>
                  {autoCreateChapterProgress.total > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({autoCreateChapterProgress.current}/{autoCreateChapterProgress.total})
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4: 标记完结 */}
              <div className="flex items-center gap-3">
                {autoCreateStage === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : autoCreateStage === "completing" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={autoCreateStage === "completed" ? "text-foreground" : "text-muted-foreground"}>
                  标记完结
                </span>
              </div>
            </div>

            {/* 进度条 */}
            {autoCreateChapterProgress.total > 0 && autoCreateStage === "generating_chapters" && (
              <div className="space-y-2">
                <Progress
                  value={(autoCreateChapterProgress.current / autoCreateChapterProgress.total) * 100}
                />
                <p className="text-xs text-center text-muted-foreground">
                  正在生成第 {autoCreateChapterProgress.current} 章，共 {autoCreateChapterProgress.total} 章
                </p>
              </div>
            )}

            {/* Token 使用统计 */}
            {(autoCreateTokensUsed > 0 || autoCreateEstimatedTokens > 0) && (
              <div className="p-3 bg-muted/50 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token 消耗</span>
                  <span>
                    {autoCreateTokensUsed.toLocaleString()}
                    {autoCreateEstimatedTokens > 0 && (
                      <span className="text-muted-foreground"> / {autoCreateEstimatedTokens.toLocaleString()}</span>
                    )}
                  </span>
                </div>
                {autoCreateTotalWordCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已生成字数</span>
                    <span>{autoCreateTotalWordCount.toLocaleString()} 字</span>
                  </div>
                )}
              </div>
            )}

            {/* 错误信息 */}
            {autoCreateError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {autoCreateError}
              </div>
            )}

            {/* 取消提示 */}
            {autoCreateStage === "cancelled" && (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-md">
                任务已取消，已生成的内容已保存。您可以稍后继续创作。
              </div>
            )}

            {/* 完成提示 */}
            {autoCreateStage === "completed" && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md space-y-1">
                <p>小说创作完成！正在跳转到项目页面...</p>
                {autoCreateTotalWordCount > 0 && (
                  <p className="text-xs text-green-500">
                    共生成 {autoCreateChapterProgress.total} 章，{autoCreateTotalWordCount.toLocaleString()} 字
                  </p>
                )}
              </div>
            )}

            {/* 取消按钮 */}
            {autoCreateLoading && autoCreateTaskId && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleCancelAutoCreate}
                disabled={isCancelled}
              >
                {isCancelled ? "正在取消..." : "取消创作"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
