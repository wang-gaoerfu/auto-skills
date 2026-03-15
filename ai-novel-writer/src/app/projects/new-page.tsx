"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  PenTool,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { getAllGenres } from "@/lib/ai/deepseek"
import { ThemeToggle } from "@/components/theme-toggle"

// 小说长度配置
const NOVEL_LENGTHS = [
  { value: "micro", label: "微小说", wordCount: "100-500字", chapterRange: "1章", description: "短小精悍，一气呵成" },
  { value: "short", label: "短篇小说", wordCount: "500-20000字", chapterRange: "1-5章", description: "适合短篇故事" },
  { value: "medium", label: "中篇小说", wordCount: "2-10万字", chapterRange: "10-30章", description: "平衡篇幅和深度" },
  { value: "long", label: "长篇小说", wordCount: "10万字以上", chapterRange: "50章以上", description: "史诗巨著" },
]

// 鎷取所有题材
const genres = getAllGenres()

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("urbanReborn")
  const [novelLength, setNovelLength] = useState("medium")
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; description: string }>>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

    // 加载 AI 建议
    const loadAiSuggestions = async () => {
        if (!title.trim()) {
            toast.error("请输入项目标题")
            return
        }

        setAiLoading(true)
        try {
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generateProjectSuggestions",
                    projectId: "new",
                    params: {
                        genre,
                        novelLength,
                    },
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setAiSuggestions(data.suggestions || [])
            } else {
                toast.error(data.message || "获取建议失败")
            }
        } catch {
            toast.error("获取建议失败，请稍后重试")
        } finally {
            setAiLoading(false)
        }
    }

    // 处理提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error("请输入项目标题")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    genre,
                    novelLength,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/projects/${data.project.id}`)
            } else {
                const errorData = await res.json()
                toast.error(errorData.message || "创建失败")
            }
        } catch {
            toast.error("创建失败，请稍后重试")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                            <span>返回项目列表</span>
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <PenTool className="h-6 w-6" />
                            <span className="text-xl font-bold">AI小说创作能手</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <Button variant="ghost">返回仪表盘</Button>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="container max-w-3xl px-4 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <PenTool className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">创建新项目</CardTitle>
                                <CardDescription>
                                    开始你的AI小说创作之旅
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 标题 */}
                            <div className="space-y-2">
                                <Label htmlFor="title">项目标题 *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="输入小说标题"
                                    required
                                    disabled={loading}
                                    maxLength={100}
                                />
                                <p className="text-sm text-muted-foreground">
                                    给你的小说起一个吸引人的名字
                                </p>
                            </div>

                            {/* 简介 */}
                            <div className="space-y-2">
                                <Label htmlFor="description">项目简介</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="简单描述一下这个故事..."
                                    disabled={loading}
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className="text-sm text-muted-foreground">
                                    简要描述故事背景、主题或风格（可选)
                                </p>
                            </div>

                            {/* 騡板和简介 */}
                            <div className="space-y-2">
                                <Label>小说题材</Label>
                                <Select
                                    value={genre}
                                    onValueChange={(value) => setGenre(value || "")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择题材（影响AI生成风格）">{genres.find(g => g.value === genre)?.label || "选择题材（影响AI生成风格）"}</SelectValue>
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

                            {/* 小说长度 */}
                            <div className="space-y-2">
                                <Label>小说长度</Label>
                                <Select
                                    value={novelLength}
                                    onValueChange={(value) => setNovelLength(value || "")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择长度">
                                            {NOVEL_LENGTHS.find(l => l.value === novelLength)
                                                ? `${NOVEL_LENGTHS.find(l => l.value === novelLength)?.label}（${NOVEL_LENGTHS.find(l => l.value === novelLength)?.wordCount}）`
                                                : "选择长度"}
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
                                <p className="text-sm text-muted-foreground">
                                    选择小说的目标长度，影响AI生成的内容量
                                </p>
                            </div>

                            {/* AI 建议 */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>AI 建议</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={loadAiSuggestions}
                                        disabled={aiLoading || !title.trim()}
                                    >
                                        {aiLoading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2" />
                                        )}
                                        {aiLoading ? "生成中..." : "获取建议"}
                                    </Button>
                                </div>

                                {aiSuggestions.length > 0 ? (
                                    <div className="space-y-2">
                                        {aiSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                                                onClick={() => {
                                                    setTitle(suggestion.title)
                                                    setDescription(suggestion.description)
                                                    setAiSuggestions([])
                                                }}
                                            >
                                                <div className="font-medium">{suggestion.title}</div>
                                                <div className="text-sm text-muted-foreground line-clamp-2">
                                                    {suggestion.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                                        输入标题后点击"获取建议"按钮， AI 会根据你的标题生成创作建议
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/projects")}
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
        </div>
    )
}
