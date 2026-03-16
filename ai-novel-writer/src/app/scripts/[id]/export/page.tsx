"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  FileCode,
  FileText,
  Table,
  Loader2,
  Check,
  Film,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface ScriptProject {
  id: string
  title: string
  status: string
  _count?: {
    scenes: number
    shots: number
  }
}

type ExportFormat = "json" | "md" | "pdf" | "excel"

const FORMAT_OPTIONS: Array<{
  value: ExportFormat
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: "json",
    label: "JSON",
    description: "结构化数据格式，适合程序处理",
    icon: <FileCode className="h-5 w-5" />,
  },
  {
    value: "md",
    label: "Markdown",
    description: "纯文本格式，适合阅读和编辑",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    value: "pdf",
    label: "HTML/PDF",
    description: "可直接打印或转为 PDF",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    value: "excel",
    label: "CSV",
    description: "表格格式，适合导入 Excel",
    icon: <Table className="h-5 w-5" />,
  },
]

export default function ScriptExportPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [project, setProject] = useState<ScriptProject | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json")
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [exportSuccess, setExportSuccess] = useState(false)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/scripts/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setProject(data.project)
        }
      } catch (error) {
        console.error("Failed to fetch project:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  async function handleExport() {
    if (!project) return

    setExporting(true)
    setExportSuccess(false)

    try {
      const res = await fetch(
        `/api/scripts/${project.id}/export?format=${selectedFormat}&watermark=${includeWatermark}`
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "导出失败")
      }

      // 获取文件并下载
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${project.title}_剧本.${selectedFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportSuccess(true)
    } catch (error) {
      console.error("Export failed:", error)
      alert(error instanceof Error ? error.message : "导出失败，请稍后重试")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/scripts/${projectId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>返回详情</span>
            </Link>
            <h1 className="text-xl font-bold">导出剧本</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl px-4 py-8">
        {/* Project Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              {project.title}
            </CardTitle>
            <CardDescription>
              {project._count?.scenes || 0} 个场景 · {project._count?.shots || 0} 个镜头
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Export Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>选择导出格式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {FORMAT_OPTIONS.map((format) => (
                <div
                  key={format.value}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedFormat(format.value)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    {format.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-muted-foreground">{format.description}</div>
                  </div>
                  {selectedFormat === format.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Watermark Option */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>水印设置</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">添加水印</div>
                <div className="text-sm text-muted-foreground">
                  在导出文件中添加"由 AI 剧本工坊生成"水印
                </div>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            className="w-full"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                导出 {FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.label} 文件
              </>
            )}
          </Button>

          {exportSuccess && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>导出成功！文件已开始下载</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
