"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  Minus,
} from "lucide-react"
import { marked } from "marked"

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
  title: string
  description: string | null
  chapters: Chapter[]
}

export default function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 阅读状态
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [chapterHtml, setChapterHtml] = useState("")
  const [showToc, setShowToc] = useState(false)

  // 阅读设置
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [darkMode, setDarkMode] = useState(false)

  // 加载项目数据
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${resolvedParams.id}`)
        if (!res.ok) {
          throw new Error("Failed to fetch project")
        }
        const data = await res.json()
        setProject(data.project)

        // 从 localStorage 恢复阅读进度
        if (typeof window !== "undefined") {
          const savedProgress = localStorage.getItem(`read-progress-${resolvedParams.id}`)
          if (savedProgress) {
            const index = parseInt(savedProgress, 10)
            if (!isNaN(index) && index >= 0 && index < data.project.chapters.length) {
              setCurrentChapterIndex(index)
            }
          }

          // 恢复阅读设置
          const savedSettings = localStorage.getItem("read-settings")
          if (savedSettings) {
            try {
              const settings = JSON.parse(savedSettings)
              if (settings.fontSize) setFontSize(settings.fontSize)
              if (settings.lineHeight) setLineHeight(settings.lineHeight)
              if (settings.darkMode !== undefined) setDarkMode(settings.darkMode)
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        console.error(err)
        setError("加载失败")
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [resolvedParams.id])

  // 渲染章节内容
  useEffect(() => {
    if (project && project.chapters[currentChapterIndex]) {
      const chapter = project.chapters[currentChapterIndex]

      // 处理内容：支持 Markdown、HTML 和纯文本
      let content = chapter.content || ""

      // 优先检查 Markdown 标题语法（行首的 #）
      const hasMarkdownHeadings = /^#{1,6}\s/m.test(content)
      const hasMarkdownSyntax = content.includes("**") || content.includes("*") || content.includes("`")

      if (hasMarkdownHeadings || hasMarkdownSyntax) {
        // Markdown 内容，使用 marked 转换
        content = marked.parse(content) as string
      } else if (content.includes("<p") || content.includes("<div") || content.includes("<h")) {
        // 已经是 HTML 内容，直接使用
        // 清理一些可能影响阅读的标签
        content = content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      } else {
        // 纯文本转换为段落
        content = content.split("\n\n").map(p => `<p>${p}</p>`).join("")
      }

      setChapterHtml(content)

      // 保存阅读进度
      if (typeof window !== "undefined") {
        localStorage.setItem(`read-progress-${resolvedParams.id}`, currentChapterIndex.toString())
      }
    }
  }, [project, currentChapterIndex, resolvedParams.id])

  // 保存阅读设置
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("read-settings", JSON.stringify({
        fontSize,
        lineHeight,
        darkMode,
      }))
    }
  }, [fontSize, lineHeight, darkMode])

  // 章节导航
  const goToChapter = (index: number) => {
    if (project && index >= 0 && index < project.chapters.length) {
      setCurrentChapterIndex(index)
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevChapter = () => goToChapter(currentChapterIndex - 1)
  const nextChapter = () => goToChapter(currentChapterIndex + 1)

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === "ArrowLeft") {
        prevChapter()
      } else if (e.key === "ArrowRight") {
        nextChapter()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentChapterIndex, project])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-background"}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${darkMode ? "text-gray-400" : "text-muted-foreground"}`} />
      </div>
    )
  }

  if (error || !project || project.chapters.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-background"}`}>
        <div className="text-center">
          <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-destructive"}`}>{error || "暂无章节可阅读"}</p>
          <Link href={`/projects/${resolvedParams.id}`}>
            <Button>返回项目</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentChapter = project.chapters[currentChapterIndex]
  const totalChapters = project.chapters.length
  const progress = Math.round(((currentChapterIndex + 1) / totalChapters) * 100)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-background"}`}>
      {/* 顶部工具栏 */}
      <header className={`sticky top-0 z-20 border-b ${darkMode ? "bg-gray-900 border-gray-700" : "bg-background"}`}>
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${resolvedParams.id}`}
              className={`flex items-center gap-2 hover:opacity-80 ${darkMode ? "text-gray-300" : "text-muted-foreground"}`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">返回</span>
            </Link>
            <div>
              <h1 className="font-medium truncate max-w-[150px] sm:max-w-[300px]">{project.title}</h1>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                {currentChapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 阅读进度 */}
            <div className={`hidden sm:flex items-center gap-2 text-sm ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              <span>{currentChapterIndex + 1} / {totalChapters}</span>
              <span className="text-xs">({progress}%)</span>
            </div>

            {/* 目录按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToc(!showToc)}
              title="目录"
            >
              <List className="h-4 w-4" />
            </Button>

            {/* 设置按钮 */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" title="阅读设置" />}>
                <Settings className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-4 space-y-4">
                  {/* 字体大小 */}
                  <div className="space-y-2">
                    <Label className="text-xs">字体大小</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{fontSize}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 行高 */}
                  <div className="space-y-2">
                    <Label className="text-xs">行间距</Label>
                    <div className="flex items-center gap-1">
                      {[1.5, 1.8, 2, 2.2].map((h) => (
                        <Button
                          key={h}
                          variant={lineHeight === h ? "default" : "outline"}
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => setLineHeight(h)}
                        >
                          {h}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 深色模式 */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">深色模式</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 进度条 */}
        <div className={`h-1 ${darkMode ? "bg-gray-800" : "bg-muted"}`}>
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex">
        {/* 侧边目录 */}
        {showToc && (
          <aside className={`w-64 shrink-0 border-r h-[calc(100vh-3.5rem)] overflow-y-auto sticky top-14 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-background"}`}>
            <div className="p-4">
              <h2 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                目录
              </h2>
              <nav className="space-y-1">
                {project.chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      goToChapter(index)
                      setShowToc(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      index === currentChapterIndex
                        ? "bg-primary text-primary-foreground"
                        : darkMode
                        ? "hover:bg-gray-800 text-gray-300"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {index + 1}. {chapter.title}
                      </span>
                      <span className={`text-xs ${index === currentChapterIndex ? "text-primary-foreground/70" : darkMode ? "text-gray-500" : "text-muted-foreground"}`}>
                        {chapter.wordCount}
                      </span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* 阅读区域 */}
        <main className="flex-1 min-w-0">
          <article
            className="max-w-3xl mx-auto px-4 py-8"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {/* 章节标题 */}
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">
                第{currentChapterIndex + 1}章 {currentChapter.title}
              </h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                {currentChapter.wordCount.toLocaleString()} 字
              </p>
            </header>

            {/* 章节内容 */}
            <div
              className={`prose prose-lg max-w-none ${darkMode ? "prose-invert" : ""}`}
              style={{
                wordBreak: "break-word",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: chapterHtml }}
                className="read-content"
              />
            </div>

            {/* 章节导航 */}
            <footer className={`mt-12 pt-8 border-t ${darkMode ? "border-gray-700" : ""}`}>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevChapter}
                  disabled={currentChapterIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  上一章
                </Button>

                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                  {currentChapterIndex + 1} / {totalChapters}
                </span>

                <Button
                  variant="outline"
                  onClick={nextChapter}
                  disabled={currentChapterIndex === totalChapters - 1}
                >
                  下一章
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </footer>
          </article>
        </main>
      </div>

      {/* 底部导航（移动端） */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t md:hidden ${darkMode ? "bg-gray-900 border-gray-700" : "bg-background"}`}>
        <div className="flex items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevChapter}
            disabled={currentChapterIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              {currentChapterIndex + 1}/{totalChapters}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextChapter}
            disabled={currentChapterIndex === totalChapters - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>

      {/* 阅读内容样式 */}
      <style jsx global>{`
        .read-content p {
          margin-bottom: 1em;
          text-indent: 2em;
        }
        .read-content h1 {
          text-indent: 0;
          font-size: 1.75em;
          font-weight: bold;
          margin-top: 2em;
          margin-bottom: 1em;
          line-height: 1.3;
        }
        .read-content h2 {
          text-indent: 0;
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          line-height: 1.4;
        }
        .read-content h3 {
          text-indent: 0;
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 1.25em;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }
        .read-content blockquote {
          border-left: 3px solid ${darkMode ? "#4B5563" : "#E5E7EB"};
          padding-left: 1em;
          margin-left: 0;
          color: ${darkMode ? "#9CA3AF" : "#6B7280"};
        }
      `}</style>
    </div>
  )
}
