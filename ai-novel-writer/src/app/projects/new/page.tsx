"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Loader2, PenTool, Sparkles, Wand2 } from "lucide-react"
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  创建项目
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
    </div>
  )
}
