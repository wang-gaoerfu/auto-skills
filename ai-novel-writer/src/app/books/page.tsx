"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BookOpen,
  Upload,
  FileText,
  Layers,
  Sparkles,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

// 模拟的书籍分析状态
interface BookAnalysis {
  id: string
  title: string
  status: "pending" | "analyzing" | "completed" | "error"
  progress: number
  totalChapters: number
  processedChapters: number
  createdAt: Date
  genre?: string
  style?: string
  chapters?: Array<{
    id: string
    title: string
    wordCount: number
    summary?: string
  }>
}

// 模拟数据
const mockAnalyses: BookAnalysis[] = [
  {
    id: "1",
    title: "示例书籍分析",
    status: "completed",
    progress: 100,
    totalChapters: 30,
    processedChapters: 30,
    createdAt: new Date("2024-01-15"),
    genre: "都市重生",
    style: "轻松幽默",
    chapters: [
      { id: "1-1", title: "第一章 重生归来", wordCount: 3200, summary: "主角意外重生回到高中时代..." },
      { id: "1-2", title: "第二章 改变命运", wordCount: 2800, summary: "决定利用前世知识改变人生..." },
    ],
  },
]

export default function BooksPage() {
  const [analyses, setAnalyses] = useState<BookAnalysis[]>(mockAnalyses)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // 处理文件上传
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      const validTypes = [".txt", ".pdf", ".epub", ".docx"]
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      if (!validTypes.includes(ext)) {
        toast.error("不支持的文件格式", {
          description: "请上传 TXT、PDF、EPUB 或 DOCX 格式的文件",
        })
        return
      }

      // 检查文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件过大", {
          description: "文件大小不能超过 10MB",
        })
        return
      }

      setSelectedFile(file)
    }
  }

  // 开始分析
  const handleStartAnalysis = async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/books/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("功能开发中", {
          description: "智能拆书功能正在紧张开发中，敬请期待！",
        })
        setUploadDialogOpen(false)
        setSelectedFile(null)
      } else {
        toast.error("分析失败", {
          description: data.message || "请稍后重试",
        })
      }
    } catch (error) {
      toast.error("功能开发中", {
        description: "智能拆书功能正在紧张开发中，敬请期待！",
      })
    } finally {
      setUploading(false)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: BookAnalysis["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "analyzing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: BookAnalysis["status"]) => {
    switch (status) {
      case "completed":
        return "分析完成"
      case "analyzing":
        return "分析中..."
      case "error":
        return "分析失败"
      default:
        return "等待中"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
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
      <main className="container px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary" />
              智能拆书
            </h1>
            <p className="text-muted-foreground mt-1">
              上传书籍，AI 自动分析章节结构、人物关系、剧情走向
            </p>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger
              nativeButton={false}
              render={<span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 cursor-pointer" />}
            >
              <Upload className="h-4 w-4 mr-2" />
              上传书籍
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>上传书籍进行分析</DialogTitle>
                <DialogDescription>
                  支持 TXT、PDF、EPUB、DOCX 格式，文件大小不超过 10MB
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 文件上传区域 */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="book-file"
                    className="hidden"
                    accept=".txt,.pdf,.epub,.docx"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="book-file"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : "点击选择文件或拖拽到此处"}
                    </span>
                  </label>
                </div>

                {/* 功能说明 */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">AI 将自动完成：</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      识别章节结构和标题
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      分析人物设定和关系
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      提取剧情脉络和转折点
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      分析写作风格特点
                    </li>
                  </ul>
                </div>

                {/* 开发中提示 */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        功能开发中
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        智能拆书功能正在紧张开发中，即将上线。敬请期待！
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false)
                    setSelectedFile(null)
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleStartAnalysis}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      开始分析
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                智能分章
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI 自动识别书籍的章节结构，准确分割每一章内容，支持多种章节标题格式
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                风格分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                深入分析原作的写作风格、叙事节奏、对话特点，帮助你学习和借鉴
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                结构提取
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                提取人物关系、剧情脉络、世界观设定，形成结构化的知识库
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">分析记录</h2>

          {analyses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">还没有分析记录</p>
                <p className="text-sm text-muted-foreground mb-4">
                  点击上方"上传书籍"按钮，开始你的第一次智能拆书
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  上传书籍
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{analysis.title}</CardTitle>
                        {analysis.genre && (
                          <Badge variant="secondary">{analysis.genre}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(analysis.status)}
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(analysis.status)}
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      {analysis.totalChapters} 章节 · {analysis.style || "风格分析中"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.status === "analyzing" && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">分析进度</span>
                          <span>{analysis.processedChapters}/{analysis.totalChapters} 章</span>
                        </div>
                        <Progress value={analysis.progress} />
                      </div>
                    )}

                    {analysis.status === "completed" && analysis.chapters && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">章节预览：</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {analysis.chapters.slice(0, 5).map((chapter) => (
                            <div
                              key={chapter.id}
                              className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                            >
                              <span className="truncate">{chapter.title}</span>
                              <span className="text-muted-foreground">
                                {chapter.wordCount} 字
                              </span>
                            </div>
                          ))}
                          {analysis.chapters.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center">
                              还有 {analysis.chapters.length - 5} 章...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-xs text-muted-foreground">
                        创建于 {analysis.createdAt.toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {analysis.status === "completed" && (
                          <>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              导出
                            </Button>
                            <Button variant="outline" size="sm">
                              <Sparkles className="h-4 w-4 mr-1" />
                              模仿创作
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
