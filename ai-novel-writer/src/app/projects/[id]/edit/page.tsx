"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, PenTool, Lock, CheckCircle2, Circle } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string | null
  genre: string | null
  novelLength: string | null
  status: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  targetWords: number | null
  targetChapters: number | null
  chapters: Array<{ id: string; wordCount: number }>
}

// 小说长度配置
const NOVEL_LENGTHS = [
  { value: "micro", label: "微小说", wordCount: "100-500字", chapterRange: "1章" },
  { value: "short", label: "短篇小说", wordCount: "500-20000字", chapterRange: "1-5章" },
  { value: "medium", label: "中篇小说", wordCount: "2-10万字", chapterRange: "10-30章" },
  { value: "long", label: "长篇小说", wordCount: "10万字以上", chapterRange: "50章以上" },
]

// 获取长度标签
function getLengthLabel(length: string | null) {
  const config = NOVEL_LENGTHS.find(l => l.value === length)
    return config?.label || "未设置"
}

// 获取题材标签
function getGenreLabel(genre: string | null) {
    const genreMap: Record<string, string> = {
      urbanReborn: "都市重生",
      fantasy: "玄幻奇幻",
      romance: "现代言情",
      historical: "历史架空",
      scifi: "科幻未来",
      suspense: "悬疑推理",
      wuxia: "武侠仙侠",
      game: "游戏竞技",
    }
    return genre ? genreMap[genre] || genre : "未设置"
  }

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
    const [project, setProject] = useState<Project | null>(null)

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects/${projectId}`)
                const data = await res.json()

                if (res.ok) {
                    setProject(data.project)
                } else {
                    setError(data.message || "获取项目失败")
                }
            } catch {
                setError("获取项目失败，请稍后重试")
            } finally {
                setFetching(false)
            }
        }

        fetchProject()
    }, [projectId])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const title = formData.get("title") as string
        const description = formData.get("description") as string

        if (!title.trim()) {
            setError("请输入项目标题")
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            })

            const data = await res.json()

            if (res.ok) {
                router.push(`/projects/${projectId}`)
                router.refresh()
            } else {
                setError(data.message || "更新失败")
            }
        } catch {
            setError("更新失败，请稍后重试")
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container flex h-16 items-center px-4">
                        <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                            <span>返回项目列表</span>
                        </Link>
                    </div>
                </header>
                <main className="container max-w-2xl px-4 py-8">
                    <Alert variant="destructive">
                        <AlertDescription>{error || "项目不存在"}</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }

    const totalWords = project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    const lengthInfo = NOVEL_LENGTHS.find(l => l.value === project.novelLength)
    const genreLabel = getGenreLabel(project.genre)

    return (
        <div className="min-h-screen bg-background">
            {/* 顶部导航 */}
            <header className="border-b">
                <div className="container flex h-16 items-center px-4">
                    <Link href={`/projects/${projectId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        <span>返回项目</span>
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
                                <CardTitle className="text-2xl">编辑项目</CardTitle>
                                <CardDescription>
                                    修改小说项目信息
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

                            {/* 项目状态信息（只读） */}
                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                    项目信息（只读）
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 状态 */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">状态</span>
                                        <div>
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
                                    </div>

                                    {/* 题材 */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">题材</span>
                                        <div className="text-sm font-medium">{genreLabel}</div>
                                    </div>

                                    {/* 小说长度 */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">小说长度</span>
                                        <div className="text-sm font-medium">{lengthInfo?.label || "未设置"}</div>
                                        <div className="text-xs text-muted-foreground">{lengthInfo?.wordCount} · {lengthInfo?.chapterRange}</div>
                                    </div>

                                    {/* 章节统计 */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">章节/字数</span>
                                        <div className="text-sm font-medium">{project.chapters.length} 章 · {totalWords.toLocaleString()} 字</div>
                                    </div>

                                    {/* 目标 */}
                                    {(project.targetWords || project.targetChapters) && (
                                        <div className="col-span-2 space-y-1">
                                            <span className="text-xs text-muted-foreground">目标</span>
                                            <div className="text-sm font-medium">
                                                {project.targetWords && `${project.targetWords.toLocaleString()} 字`}
                                                {project.targetWords && project.targetChapters && " · "}
                                                {project.targetChapters && `${project.targetChapters} 章`}
                                            </div>
                                        </div>
                                    )}

                                    {/* 时间 */}
                                    <div className="col-span-2 space-y-1">
                                        <span className="text-xs text-muted-foreground">创建时间</span>
                                        <div className="text-sm">{new Date(project.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* 可编辑字段 */}
                            <div className="space-y-2">
                                <Label htmlFor="title">项目标题 *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="输入小说标题"
                                    required
                                    disabled={loading}
                                    maxLength={100}
                                    defaultValue={project.title}
                                />
                                <p className="text-sm text-muted-foreground">
                                    给你的小说起一个吸引人的名字
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">项目简介</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="简单描述一下这个故事..."
                                    disabled={loading}
                                    rows={4}
                                    maxLength={500}
                                    defaultValue={project.description || ""}
                                />
                                <p className="text-sm text-muted-foreground">
                                    简要描述故事背景、主题或风格（可选)
                                </p>
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
                                    保存修改
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
