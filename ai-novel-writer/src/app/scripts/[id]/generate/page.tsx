"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Film,
  Clock,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// 类型定义
// ============================================

interface GenerateState {
  status: "idle" | "running" | "paused" | "completed" | "error"
  progress: number
  currentScene?: number
  totalScenes: number
  currentShot?: number
  totalShots: number
  message?: string
  error?: string
}

interface Project {
  id: string
  title: string
  status: string
  subStatus: string | null
  progress: number
  totalScenes: number
  totalShots: number
  totalDuration: number
}

interface Scene {
  id: string
  sceneNumber: number
  title: string
  location: string | null
  timeOfDay: string | null
  mood: string | null
  shotCount: number
}

// ============================================
// 页面组件
// ============================================

export default function ScriptGeneratePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  // 状态
  const [project, setProject] = useState<Project | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [generateState, setGenerateState] = useState<GenerateState>({
    status: "idle",
    progress: 0,
    totalScenes: 0,
    totalShots: 0,
  })
  const [options, setOptions] = useState({
    overwrite: false,
    batchSize: 1,
  })
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // 加载项目数据
  const fetchProject = useCallback(async () => {
    try {
      const [projectRes, scenesRes] = await Promise.all([
        fetch(`/api/scripts/${projectId}`),
        fetch(`/api/scripts/${projectId}/generate`),
      ])

      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData.project)
      }

      if (scenesRes.ok) {
        const scenesData = await scenesRes.json()
        setScenes(scenesData.scenes || [])

        // 更新生成状态
        setGenerateState({
          status: mapProjectStatus(scenesData.project?.status),
          progress: scenesData.project?.progress || 0,
          totalScenes: scenesData.stats?.totalScenes || 0,
          totalShots: scenesData.stats?.totalShots || 0,
        })
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 映射项目状态
  const mapProjectStatus = (status: string): GenerateState["status"] => {
    switch (status) {
      case "draft": return "idle"
      case "generating": return "running"
      case "paused": return "paused"
      case "completed": return "completed"
      case "error": return "error"
      default: return "idle"
    }
  }

  // 启动生成
  const startGeneration = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/scripts/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneIds: selectedScenes.length > 0 ? selectedScenes : undefined,
          options,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGenerateState((prev) => ({
          ...prev,
          status: "running",
          message: data.message,
        }))
        // 开始轮询进度
        startPolling()
      } else {
        setGenerateState((prev) => ({
          ...prev,
          status: "error",
          error: data.error || "生成启动失败",
        }))
      }
    } catch (error) {
      setGenerateState((prev) => ({
        ...prev,
        status: "error",
        error: "网络错误，请重试",
      }))
    } finally {
      setActionLoading(false)
    }
  }

  // 轮询进度
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scripts/${projectId}/generate`)
        if (response.ok) {
          const data = await response.json()

          setGenerateState({
            status: mapProjectStatus(data.project?.status),
            progress: data.project?.progress || 0,
            totalScenes: data.stats?.totalScenes || 0,
            totalShots: data.stats?.totalShots || 0,
          })

          // 如果已完成或出错，停止轮询
          if (data.project?.status === "paused" || data.project?.status === "error") {
            clearInterval(interval)
            await fetchProject() // 刷新完整数据
          }
        }
      } catch (error) {
        console.error("Failed to poll progress:", error)
      }
    }, 2000) // 每2秒轮询一次

    return () => clearInterval(interval)
  }

  // 切换场景选择
  const toggleScene = (sceneId: string) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneId)
        ? prev.filter((id) => id !== sceneId)
        : [...prev, sceneId]
    )
  }

  // 全选/取消全选
  const toggleAllScenes = () => {
    if (selectedScenes.length === scenes.length) {
      setSelectedScenes([])
    } else {
      setSelectedScenes(scenes.map((s) => s.id))
    }
  }

  // 初始加载
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // 如果正在运行，启动轮询
  useEffect(() => {
    if (generateState.status === "running") {
      const cleanup = startPolling()
      return cleanup
    }
  }, [generateState.status])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Film className="h-6 w-6" />
              <span className="text-xl font-bold">生成分镜</span>
            </div>
            {project && (
              <Badge variant={generateState.status === "running" ? "default" : "secondary"}>
                {getStatusText(generateState.status)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {generateState.status === "running" && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                生成中
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-6xl">
        {/* 项目信息 */}
        {project && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>
                共 {project.totalScenes} 个场景，
                已生成 {project.totalShots} 个镜头，
                总时长 {formatDuration(project.totalDuration)}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* 进度卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>生成进度</CardTitle>
                <CardDescription>
                  {generateState.message || getStatusMessage(generateState)}
                </CardDescription>
              </div>
              {getStatusIcon(generateState.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>总体进度</span>
                <span className="font-medium">{generateState.progress}%</span>
              </div>
              <Progress value={generateState.progress} className="h-2" />
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{generateState.totalScenes}</p>
                <p className="text-xs text-muted-foreground">场景总数</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{generateState.totalShots}</p>
                <p className="text-xs text-muted-foreground">镜头总数</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatDuration(project?.totalDuration || 0)}</p>
                <p className="text-xs text-muted-foreground">总时长</p>
              </div>
            </div>

            {/* 错误信息 */}
            {generateState.error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">{generateState.error}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              生成选项
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 覆盖已有镜头 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>覆盖已有镜头</Label>
                <p className="text-xs text-muted-foreground">
                  重新生成已存在镜头的场景
                </p>
              </div>
              <Switch
                checked={options.overwrite}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, overwrite: checked }))
                }
                disabled={generateState.status === "running"}
              />
            </div>

            {/* 批量大小 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>批量大小</Label>
                <p className="text-xs text-muted-foreground">
                  每次生成的场景数量
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOptions((prev) => ({
                      ...prev,
                      batchSize: Math.max(1, prev.batchSize - 1),
                    }))
                  }
                  disabled={generateState.status === "running" || options.batchSize <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center">{options.batchSize}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOptions((prev) => ({
                      ...prev,
                      batchSize: prev.batchSize + 1,
                    }))
                  }
                  disabled={generateState.status === "running"}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 场景列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>场景列表</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllScenes}
                disabled={generateState.status === "running"}
              >
                {selectedScenes.length === scenes.length ? "取消全选" : "全选"}
              </Button>
            </div>
            <CardDescription>
              已选择 {selectedScenes.length} / {scenes.length} 个场景
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    selectedScenes.includes(scene.id) && "bg-primary/5 border-primary"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedScenes.includes(scene.id)}
                    onChange={() => toggleScene(scene.id)}
                    disabled={generateState.status === "running"}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">场景 {scene.sceneNumber}</span>
                      <span className="text-sm truncate">{scene.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {scene.location && <span>{scene.location}</span>}
                      {scene.timeOfDay && <span>·</span>}
                      {scene.timeOfDay && <span>{scene.timeOfDay}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Film className="h-3 w-3" />
                      {scene.shotCount}
                    </Badge>
                  </div>
                </div>
              ))}
              {scenes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无场景，请先进行内容分析
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {generateState.status === "idle" || generateState.status === "completed" || generateState.status === "error" ? (
            <Button
              size="lg"
              onClick={startGeneration}
              disabled={scenes.length === 0 || actionLoading}
              className="min-w-32"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  启动中
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始生成
                </>
              )}
            </Button>
          ) : generateState.status === "running" ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(`/scripts/${projectId}`)}
              className="min-w-32"
            >
              查看详情
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  )
}

// ============================================
// 辅助函数
// ============================================

function getStatusText(status: GenerateState["status"]): string {
  switch (status) {
    case "idle": return "待生成"
    case "running": return "生成中"
    case "paused": return "已暂停"
    case "completed": return "已完成"
    case "error": return "错误"
  }
}

function getStatusMessage(state: GenerateState): string {
  switch (state.status) {
    case "idle":
      return "准备就绪，点击下方按钮开始生成分镜"
    case "running":
      return `正在生成... ${state.progress}%`
    case "paused":
      return "生成已暂停"
    case "completed":
      return "生成完成！"
    case "error":
      return "生成过程中出现错误"
  }
}

function getStatusIcon(status: GenerateState["status"]) {
  switch (status) {
    case "idle":
      return <Clock className="h-5 w-5 text-muted-foreground" />
    case "running":
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />
    case "paused":
      return <Pause className="h-5 w-5 text-yellow-500" />
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "error":
      return <XCircle className="h-5 w-5 text-destructive" />
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}
