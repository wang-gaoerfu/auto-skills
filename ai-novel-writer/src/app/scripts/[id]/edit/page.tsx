"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Film,
  Edit3,
  Clock,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// 类型定义
// ============================================

interface Scene {
  id: string
  sceneNumber: number
  title: string
  location: string | null
  timeOfDay: string | null
  mood: string | null
  description: string | null
  shotCount: number
  totalDuration: number
  shots?: Shot[]
}

interface Shot {
  id: string
  shotNumber: string
  shotType: string
  angle: string | null
  duration: number
  visual: {
    description?: string
    mood?: string
    reference?: string
  } | null
  audio: {
    action?: string
    dialogue?: string
  } | null
  order: number
  isEdited: boolean
}

interface Project {
  id: string
  title: string
  status: string
  totalScenes: number
  totalShots: number
  totalDuration: number
}

// ============================================
// 页面组件
// ============================================

export default function ScriptEditPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  // 状态
  const [project, setProject] = useState<Project | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [editingShot, setEditingShot] = useState<Shot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState(0)
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(null)

  // 加载项目数据
  const fetchProject = useCallback(async () => {
    setLoading(true)
    try {
      const [projectRes, scenesRes] = await Promise.all([
        fetch(`/api/scripts/${projectId}`),
        fetch(`/api/scripts/${projectId}/analyze`),
      ])

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data.project)
      }

      if (scenesRes.ok) {
        const data = await scenesRes.json()
        // 映射 API 返回的字段到接口定义
        const mappedScenes = (data.analysis.scenes || []).map((s: any) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          title: s.title,
          location: s.location,
          timeOfDay: s.time, // API 返回 time
          mood: s.mood,
          description: s.summary, // API 返回 summary
          shotCount: s.shotCount,
          totalDuration: 0,
          shots: s.shots || [],
        }))
        setScenes(mappedScenes)
        if (mappedScenes.length > 0) {
          setSelectedScene(mappedScenes[0])
          // 如果有镜头数据，直接设置
          if (mappedScenes[0].shots && mappedScenes[0].shots.length > 0) {
            setShots(mappedScenes[0].shots)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 加载镜头
  const fetchShots = useCallback(async (sceneId: string): Promise<Shot[]> => {
    try {
      const response = await fetch(`/api/scripts/${projectId}/analyze`)
      if (response.ok) {
        const data = await response.json()
        const scene = data.analysis.scenes.find((s: Scene) => s.id === sceneId)
        if (scene && scene.shots) {
          setShots(scene.shots)
          return scene.shots
        } else {
          setShots([])
          return []
        }
      }
      return []
    } catch (error) {
      console.error("Failed to fetch shots:", error)
      return []
    }
  }, [projectId])

  // 保存镜头编辑
  const saveShot = async () => {
    if (!editingShot) return

    setSaving(true)
    try {
      const response = await fetch(`/api/scripts/${projectId}/shots/${editingShot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editingShot.visual?.description,
          action: editingShot.audio?.action,
          dialogue: editingShot.audio?.dialogue,
          mood: editingShot.visual?.mood,
          visualReference: editingShot.visual?.reference,
          shotType: editingShot.shotType,
          angle: editingShot.angle || undefined,
          duration: editingShot.duration,
        }),
      })

      if (response.ok) {
        showSavedMessage("保存成功")
        setEditingShot({ ...editingShot, isEdited: true })
        // 更新镜头列表
        await fetchShots(selectedScene!.id)
      } else {
        showSavedMessage("保存失败")
      }
    } catch (error) {
      console.error("Failed to save shot:", error)
      showSavedMessage("保存失败")
    } finally {
      setSaving(false)
    }
  }

  // 删除镜头
  const deleteShot = async (shotId: string) => {
    if (!confirm("确定要删除这个镜头吗？")) return

    try {
      const response = await fetch(`/api/scripts/${projectId}/shots/${shotId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showSavedMessage("删除成功")
        await fetchShots(selectedScene!.id)
        if (editingShot?.id === shotId) {
          setEditingShot(null)
        }
      } else {
        showSavedMessage("删除失败")
      }
    } catch (error) {
      console.error("Failed to delete shot:", error)
      showSavedMessage("删除失败")
    }
  }

  // 保存场景编辑
  const saveScene = async () => {
    if (!selectedScene) return

    setSaving(true)
    try {
      const response = await fetch(`/api/scripts/${projectId}/scenes/${selectedScene.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedScene.title,
          location: selectedScene.location || undefined,
          timeOfDay: selectedScene.timeOfDay || undefined,
          mood: selectedScene.mood || undefined,
          description: selectedScene.description || undefined,
        }),
      })

      if (response.ok) {
        showSavedMessage("保存成功")
      } else {
        showSavedMessage("保存失败")
      }
    } catch (error) {
      console.error("Failed to save scene:", error)
      showSavedMessage("保存失败")
    } finally {
      setSaving(false)
    }
  }

  // 显示保存消息
  const showSavedMessage = (message: string) => {
    setSavedMessage(message)
    setTimeout(() => setSavedMessage(null), 2000)
  }

  // 选择场景
  const selectScene = (scene: Scene) => {
    setSelectedScene(scene)
    setEditingShot(null)
    fetchShots(scene.id)
  }

  // 生成镜头
  const handleGenerateShots = async () => {
    if (!selectedScene) return

    setGenerating(true)
    setGeneratingProgress(0)
    setGeneratingMessage("正在启动生成...")

    try {
      const response = await fetch(`/api/scripts/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneIds: [selectedScene.id],
          options: {
            overwrite: shots.length > 0,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratingMessage(`已启动生成，共 ${data.totalScenes || 1} 个场景`)
        // 开始轮询进度
        pollGenerationStatus()
      } else if (response.status === 409) {
        // 正在生成中，开始轮询
        const data = await response.json()
        setGeneratingMessage("已有生成任务在进行中，正在等待...")
        pollGenerationStatus()
      } else {
        const data = await response.json()
        showSavedMessage(data.error || data.message || "生成失败")
        setGenerating(false)
        setGeneratingMessage(null)
      }
    } catch (error) {
      console.error("Failed to generate shots:", error)
      showSavedMessage("生成失败")
      setGenerating(false)
      setGeneratingMessage(null)
    }
  }

  // 轮询生成状态
  const pollGenerationStatus = async () => {
    let attempts = 0
    const maxAttempts = 120 // 最多轮询 2 分钟（每秒一次）

    const poll = async () => {
      try {
        const response = await fetch(`/api/scripts/${projectId}/generate`)
        if (response.ok) {
          const data = await response.json()
          const { project, stats } = data

          if (project.status === "generating") {
            // 更新进度 - 显示完成场景/总场景
            const progressPercent = stats.totalScenes > 0
              ? Math.round((stats.completedScenes / stats.totalScenes) * 100)
              : 0
            setGeneratingProgress(progressPercent)
            setGeneratingMessage(`创作中... ${stats.completedScenes}/${stats.totalScenes} 场景`)
            attempts++

            if (attempts < maxAttempts) {
              setTimeout(poll, 1000)
            } else {
              showSavedMessage("生成超时，请稍后刷新查看")
              setGenerating(false)
              setGeneratingMessage(null)
            }
          } else if (project.status === "completed") {
            // 生成完成
            setGeneratingProgress(100)
            setGeneratingMessage("创作完成！")
            showSavedMessage(`创作完成！共 ${stats.totalShots} 个镜头`)

            // 刷新镜头列表（保持当前选中的场景）
            setTimeout(async () => {
              if (selectedScene) {
                const newShots = await fetchShots(selectedScene.id)
                // 更新当前选中的场景的镜头数量
                setSelectedScene(prev => prev ? {
                  ...prev,
                  shotCount: newShots.length
                } : null)
                // 同时更新场景列表中的镜头数量
                setScenes(prev => prev.map(s =>
                  s.id === selectedScene.id
                    ? { ...s, shotCount: newShots.length }
                    : s
                ))
              }
              setGenerating(false)
              setGeneratingMessage(null)
            }, 1000)
          } else if (project.status === "error") {
            showSavedMessage("生成失败，请重试")
            setGenerating(false)
            setGeneratingMessage(null)
          }
        }
      } catch (error) {
        console.error("Poll error:", error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000)
        } else {
          setGenerating(false)
          setGeneratingMessage(null)
        }
      }
    }

    poll()
  }

  // 初始加载
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

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
              <Edit3 className="h-6 w-6" />
              <span className="text-xl font-bold">编辑工作台</span>
            </div>
            {project && (
              <Badge variant="secondary">{project.title}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {savedMessage && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {savedMessage}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧：场景列表 */}
          <div className="col-span-3">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">场景列表</CardTitle>
                <CardDescription className="text-xs">
                  共 {scenes.length} 个场景
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className={cn(
                        "p-2.5 rounded-lg border cursor-pointer transition-colors",
                        selectedScene?.id === scene.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => selectScene(scene)}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-xs">场景 {scene.sceneNumber}</span>
                        <Badge variant="outline" className="gap-1 text-[10px] h-4 px-1">
                          <Film className="h-2.5 w-2.5" />
                          {scene.shotCount}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{scene.title}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        {scene.location && <span>{scene.location}</span>}
                        {scene.timeOfDay && <span>·</span>}
                        {scene.timeOfDay && <span>{scene.timeOfDay}</span>}
                      </div>
                    </div>
                  ))}
                  {scenes.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Film className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">暂无场景</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中间：场景信息 + 镜头列表 */}
          <div className="col-span-5 space-y-4">
            {selectedScene ? (
              <>
                {/* 场景信息 */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">
                            {selectedScene.sceneNumber}
                          </span>
                          {selectedScene.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {selectedScene.location && <span>{selectedScene.location}</span>}
                          {selectedScene.timeOfDay && <span> · {selectedScene.timeOfDay}</span>}
                          {selectedScene.mood && <span> · {selectedScene.mood}</span>}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={saveScene}
                        disabled={saving}
                        className="h-7 text-xs"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            保存中
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            保存
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">标题</Label>
                        <Input
                          value={selectedScene.title}
                          onChange={(e) =>
                            setSelectedScene({ ...selectedScene, title: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">地点</Label>
                        <Input
                          value={selectedScene.location || ""}
                          onChange={(e) =>
                            setSelectedScene({ ...selectedScene, location: e.target.value })
                          }
                          placeholder="内/外"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">时间</Label>
                        <Input
                          value={selectedScene.timeOfDay || ""}
                          onChange={(e) =>
                            setSelectedScene({ ...selectedScene, timeOfDay: e.target.value })
                          }
                          placeholder="日/夜"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">氛围</Label>
                        <Input
                          value={selectedScene.mood || ""}
                          onChange={(e) =>
                            setSelectedScene({ ...selectedScene, mood: e.target.value })
                          }
                          placeholder="紧张/温馨"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">场景描述</Label>
                      <Textarea
                        value={selectedScene.description || ""}
                        onChange={(e) =>
                          setSelectedScene({ ...selectedScene, description: e.target.value })
                        }
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 镜头列表 */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">镜头列表</CardTitle>
                        <CardDescription className="text-xs">
                          {shots.length} 个镜头 · {formatDuration(shots.reduce((sum, s) => sum + s.duration, 0))}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {shots.map((shot) => (
                        <div
                          key={shot.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            editingShot?.id === shot.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setEditingShot(shot)}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                          <Badge variant="outline" className="shrink-0 text-[10px] h-5">{shot.shotType}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {shot.visual?.description || "无描述"}
                            </p>
                            {shot.audio?.dialogue && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                "{shot.audio.dialogue}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="gap-0.5 text-[10px] h-5">
                              <Clock className="h-2.5 w-2.5" />
                              {shot.duration}s
                            </Badge>
                            {shot.isEdited && (
                              <Badge variant="secondary" className="text-[10px] h-5">
                                已编辑
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {shots.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          该场景暂无镜头，在右侧生成
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Edit3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">请从左侧选择一个场景</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：生成镜头 + 镜头编辑 */}
          <div className="col-span-4 space-y-4">
            {selectedScene ? (
              <>
                {/* 生成镜头 */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI 生成镜头
                    </CardTitle>
                    <CardDescription className="text-xs">
                      为当前场景生成分镜镜头
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <div className="font-medium text-foreground mb-1">当前场景</div>
                      <div>场景 {selectedScene.sceneNumber}: {selectedScene.title}</div>
                      {selectedScene.description && (
                        <div className="mt-1 line-clamp-2">{selectedScene.description}</div>
                      )}
                    </div>

                    {/* 生成进度 */}
                    {generating && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{generatingMessage}</span>
                          <span className="font-medium">{generatingProgress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${generatingProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGenerateShots}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          生成镜头
                        </>
                      )}
                    </Button>
                    {shots.length > 0 && !generating && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleGenerateShots}
                        disabled={generating}
                      >
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          重新生成镜头
                        </>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* 镜头编辑 */}
                {editingShot && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">编辑镜头</CardTitle>
                          <CardDescription className="text-xs">{editingShot.shotNumber}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => deleteShot(editingShot.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">镜头类型</Label>
                          <Select
                            value={editingShot.shotType}
                            onValueChange={(value) =>
                              value && setEditingShot({ ...editingShot, shotType: value })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="特写">特写 (CU)</SelectItem>
                              <SelectItem value="近景">近景 (MCU)</SelectItem>
                              <SelectItem value="中景">中景 (MS)</SelectItem>
                              <SelectItem value="全景">全景 (FS)</SelectItem>
                              <SelectItem value="远景">远景 (LS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">镜头运动</Label>
                          <Input
                            value={editingShot.angle || ""}
                            onChange={(e) =>
                              setEditingShot({ ...editingShot, angle: e.target.value })
                            }
                            placeholder="推/拉/摇/移"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">时长(秒)</Label>
                          <Input
                            type="number"
                            value={editingShot.duration}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                duration: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            min={1}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">画面描述</Label>
                        <Textarea
                          value={editingShot.visual?.description || ""}
                          onChange={(e) =>
                            setEditingShot({
                              ...editingShot,
                              visual: { ...editingShot.visual, description: e.target.value },
                            })
                          }
                          rows={2}
                          className="text-xs"
                          placeholder="描述画面内容..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">动作</Label>
                          <Textarea
                            value={editingShot.audio?.action || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                audio: { ...editingShot.audio, action: e.target.value },
                              })
                            }
                            rows={2}
                            className="text-xs"
                            placeholder="角色动作..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">对话</Label>
                          <Textarea
                            value={editingShot.audio?.dialogue || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                audio: { ...editingShot.audio, dialogue: e.target.value },
                              })
                            }
                            rows={2}
                            className="text-xs"
                            placeholder="角色对话..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">氛围</Label>
                          <Input
                            value={editingShot.visual?.mood || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                visual: { ...editingShot.visual, mood: e.target.value },
                              })
                            }
                            placeholder="紧张/温馨"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">视觉参考</Label>
                          <Input
                            value={editingShot.visual?.reference || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                visual: { ...editingShot.visual, reference: e.target.value },
                              })
                            }
                            placeholder="参考画面"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={saveShot}
                        disabled={saving}
                        className="w-full h-8 text-xs"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            保存中
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            保存镜头
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">选择场景后可生成镜头</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================
// 辅助函数
// ============================================

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}
