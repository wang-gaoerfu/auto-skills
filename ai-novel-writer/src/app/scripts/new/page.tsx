"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Film, FileText, Upload, PenTool, Loader2, Sparkles, Check } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Genre options
const GENRE_OPTIONS = [
  { value: "", label: "选择题材" },
  { value: "都市", label: "都市" },
  { value: "玄幻", label: "玄幻" },
  { value: "修仙", label: "修仙" },
  { value: "言情", label: "言情" },
  { value: "悬疑", label: "悬疑" },
  { value: "历史", label: "历史" },
  { value: "科幻", label: "科幻" },
  { value: "武侠", label: "武侠" },
  { value: "其他", label: "其他" },
]

// Source types
type SourceType = 'OWN_PROJECT' | 'EXTERNAL' | 'ORIGINAL' | 'PASTE'

interface Project {
  id: string
  title: string
  _count?: {
    chapters: number
  }
}

export default function NewScriptPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [genre, setGenre] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI suggestion states
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    title: string
    description: string
    genre: string
    reasoning: string
  } | null>(null)

  // For ORIGINAL mode: multiple AI suggestions
  const [originalSuggestions, setOriginalSuggestions] = useState<Array<{
    title: string
    description: string
    reasoning: string
  }>>([])
  const [generatingOriginalSuggestions, setGeneratingOriginalSuggestions] = useState(false)

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; content: string }>>([])

  // Paste state
  const [pastedChapters, setPastedChapters] = useState<Array<{ id: string; title: string; content: string }>>([])

  // Load projects when user selects OWN_PROJECT
  useEffect(() => {
    async function loadProjects() {
      if (sourceType === 'OWN_PROJECT') {
        try {
          const res = await fetch("/api/projects?limit=100")
          const data = await res.json()
          setProjects(data.projects || [])
        } catch (err) {
          console.error("Failed to load projects:", err)
        }
      }
    }
    loadProjects()
  }, [sourceType])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newFiles: Array<{ name: string; content: string }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string || "")
        reader.readAsText(file)
      })
      newFiles.push({
        name: file.name.replace(/\.(txt|text)$/i, ""),
        content,
      })
    }

    setUploadedFiles(newFiles)
  }

  // Add pasted chapter
  const addPastedChapter = () => {
    const newChapter = {
      id: `chapter-${Date.now()}`,
      title: `第${pastedChapters.length + 1}章`,
      content: "",
    }
    setPastedChapters([...pastedChapters, newChapter])
  }

  // Remove pasted chapter
  const removePastedChapter = (id: string) => {
    setPastedChapters(pastedChapters.filter(c => c.id !== id))
  }

  // Update pasted chapter
  const updatePastedChapter = (id: string, field: "title" | "content", value: string) => {
    setPastedChapters(
      pastedChapters.map(c => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  // Validate form
  const validateForm = (): string | null => {
    if (!title.trim()) return "请输入剧本标题"
    if (!sourceType) return "请选择内容来源"
    if (sourceType === "OWN_PROJECT" && !selectedProjectId) return "请选择一个小说项目"
    if (sourceType === "PASTE" && pastedChapters.length === 0) return "请至少添加一个章节"
    if (sourceType === "EXTERNAL" && uploadedFiles.length === 0) return "请上传至少一个文件"
    return null
  }

  // Get content for AI suggestion
  const getContentForSuggestion = (): string => {
    if (sourceType === "OWN_PROJECT" && selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId)
      return project?.title || ""
    }
    if (sourceType === "EXTERNAL" && uploadedFiles.length > 0) {
      return uploadedFiles.map(f => f.content).join("\n\n").slice(0, 1000)
    }
    if (sourceType === "PASTE" && pastedChapters.length > 0) {
      return pastedChapters.map(c => c.content).join("\n\n").slice(0, 1000)
    }
    return ""
  }

  // Trigger AI suggestion
  const triggerSuggestion = async () => {
    const content = getContentForSuggestion()
    if (!content) {
      setError("请先选择或输入内容")
      return
    }

    setSuggesting(true)
    setError(null)

    try {
      const res = await fetch("/api/scripts/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sourceType,
          sourceProjectId: selectedProjectId,
        }),
      })

      if (!res.ok) {
        throw new Error("AI 推荐失败")
      }

      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      setError("AI 推荐失败，请稍后重试")
    } finally {
      setSuggesting(false)
    }
  }

  // Apply AI suggestions
  const applySuggestions = () => {
    if (suggestions) {
      setTitle(suggestions.title)
      setDescription(suggestions.description)
      setGenre(suggestions.genre)
    }
  }

  // Apply single original suggestion
  const applyOriginalSuggestion = (suggestion: { title: string; description: string }) => {
    setTitle(suggestion.title)
    setDescription(suggestion.description)
  }

  // Generate suggestions for ORIGINAL mode
  const generateOriginalSuggestions = async () => {
    if (!genre) return

    setGeneratingOriginalSuggestions(true)
    try {
      const res = await fetch("/api/scripts/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "ORIGINAL",
          genre,
        }),
      })

      if (!res.ok) throw new Error("获取推荐失败")

      const data = await res.json()
      setOriginalSuggestions(data.suggestions || [])
    } catch (err) {
      console.error("Failed to generate original suggestions:", err)
    } finally {
      setGeneratingOriginalSuggestions(false)
    }
  }

  // Trigger suggestion generation when genre changes in ORIGINAL mode
  useEffect(() => {
    if (sourceType === "ORIGINAL" && genre) {
      generateOriginalSuggestions()
    } else {
      setOriginalSuggestions([])
    }
  }, [genre, sourceType])

  // Handle submit
  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Step 1: Create project
      const createRes = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          sourceType,
          sourceProjectId: selectedProjectId || undefined,
          sourceNovelTitle: projects.find(p => p.id === selectedProjectId)?.title,
          genre: genre || undefined,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.message || "创建失败")
      }

      const { project } = await createRes.json()

      // Step 2: Import content if needed
      if (sourceType === "OWN_PROJECT" && selectedProjectId) {
        const importRes = await fetch(`/api/scripts/${project.id}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "OWN_PROJECT",
            sourceProjectId: selectedProjectId,
          }),
        })
        if (!importRes.ok) {
          const data = await importRes.json()
          throw new Error(data.message || "导入失败")
        }
      } else if (sourceType === "EXTERNAL" && uploadedFiles.length > 0) {
        const importRes = await fetch(`/api/scripts/${project.id}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "EXTERNAL",
            files: uploadedFiles,
          }),
        })
        if (!importRes.ok) {
          const data = await importRes.json()
          throw new Error(data.message || "导入失败")
        }
      } else if (sourceType === "PASTE" && pastedChapters.length > 0) {
        const importRes = await fetch(`/api/scripts/${project.id}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "PASTE",
            chapters: pastedChapters.map(c => ({ title: c.title, content: c.content })),
          }),
        })
        if (!importRes.ok) {
          const data = await importRes.json()
          throw new Error(data.message || "导入失败")
        }
      }

      // Navigate to edit page
      router.push(`/scripts/${project.id}`)
    } catch (err) {
      setError((err as Error).message || "创建失败，请稍后重试")
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/scripts" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>返回列表</span>
            </Link>
            <h1 className="text-xl font-bold">新建剧本</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {/* Source Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>选择内容来源</CardTitle>
            <CardDescription>选择您想要如何创建这个剧本的内容来源</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'OWN_PROJECT' as SourceType, label: '自有小说项目', icon: <FileText className="h-5 w-5" /> },
                { id: 'EXTERNAL' as SourceType, label: '外部导入', icon: <Upload className="h-5 w-5" /> },
                { id: 'PASTE' as SourceType, label: '粘贴文本', icon: <FileText className="h-5 w-5" /> },
                { id: 'ORIGINAL' as SourceType, label: '原创创作', icon: <PenTool className="h-5 w-5" /> },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSourceType(type.id)
                    setSuggestions(null) // Reset suggestions when changing source type
                  }}
                  className={`p-4 border rounded-lg transition-all ${
                    sourceType === type.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg ${sourceType === type.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestion Card - for non-ORIGINAL modes */}
        {sourceType && sourceType !== "ORIGINAL" && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI 智能推荐
                  </CardTitle>
                  <CardDescription>让 AI 根据您的内容自动推荐标题、描述和题材</CardDescription>
                </div>
                {!suggestions ? (
                  <Button
                    onClick={triggerSuggestion}
                    disabled={suggesting || !getContentForSuggestion()}
                    size="sm"
                  >
                    {suggesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        获取推荐
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={applySuggestions} size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    应用推荐
                  </Button>
                )}
              </div>
            </CardHeader>
            {suggestions && (
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">推荐标题</div>
                    <div className="font-medium">{suggestions.title}</div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">推荐描述</div>
                    <div className="text-sm">{suggestions.description}</div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">推荐题材</div>
                    <div className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {suggestions.genre}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground italic">
                    💡 {suggestions.reasoning}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* AI Suggestions for ORIGINAL mode */}
        {sourceType === "ORIGINAL" && genre && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI 创意推荐
                  </CardTitle>
                  <CardDescription>基于"{genre}"题材的创意灵感</CardDescription>
                </div>
                {generatingOriginalSuggestions && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
            </CardHeader>
            {originalSuggestions.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {originalSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => applyOriginalSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium mb-1">{suggestion.title}</div>
                          <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                          <div className="text-xs text-muted-foreground mt-2 italic">
                            💡 {suggestion.reasoning}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4 mr-1" />
                          使用
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  点击任意创意即可应用到下方表单
                </p>
              </CardContent>
            )}
          </Card>
        )}

        {/* Basic Info Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">剧本标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入剧本标题"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述（可选）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这个剧本的内容..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">题材</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {GENRE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.value === ""}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Source-specific content */}
        {sourceType === "OWN_PROJECT" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>选择小说项目</CardTitle>
              <CardDescription>从您的小说项目中选择要导入的章节</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无小说项目</p>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="mt-2">创建小说项目</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择项目 *</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">请选择项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title} ({project._count?.chapters || 0} 章)
                      </option>
                    ))}
                  </select>
                  {selectedProjectId && (
                    <p className="text-sm text-muted-foreground">将导入该项目下的所有章节</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {sourceType === "EXTERNAL" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>上传文件</CardTitle>
              <CardDescription>支持 TXT 格式，每个文件将被视为一个章节</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".txt,.text"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">点击上传或拖拽文件</p>
                  <p className="text-xs text-muted-foreground">支持 TXT 格式，可多选</p>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{file.content.length} 字</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {sourceType === "PASTE" && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>粘贴内容</CardTitle>
                <CardDescription>将内容粘贴到下方，每个条目将作为一个章节</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addPastedChapter}>
                <Plus className="h-4 w-4 mr-2" />
                添加章节
              </Button>
            </CardHeader>
            <CardContent>
              {pastedChapters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无章节内容</p>
                  <p className="text-xs mt-1">点击"添加章节"开始添加内容</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastedChapters.map((chapter) => (
                    <div key={chapter.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updatePastedChapter(chapter.id, "title", e.target.value)}
                          placeholder="章节标题"
                          className="flex-1 text-sm font-medium bg-transparent border-none outline-none"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removePastedChapter(chapter.id)}>
                          删除
                        </Button>
                      </div>
                      <textarea
                        value={chapter.content}
                        onChange={(e) => updatePastedChapter(chapter.id, "content", e.target.value)}
                        placeholder="粘贴章节内容..."
                        rows={5}
                        className="w-full text-sm bg-muted/50 rounded-md p-2 border-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {sourceType === "ORIGINAL" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>原创创作</CardTitle>
              <CardDescription>创建一个空白的剧本项目，稍后可以在编辑器中添加内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">空白项目</p>
                <p className="text-sm mt-1">创建后可在编辑器中添加场景、角色和镜头</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/scripts">
            <Button variant="outline">取消</Button>
          </Link>
          <Button onClick={handleSubmit} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              "创建剧本"
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
