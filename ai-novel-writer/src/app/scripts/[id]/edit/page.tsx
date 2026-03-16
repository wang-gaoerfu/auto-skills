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
        setScenes(data.analysis.scenes || [])
        if (data.analysis.scenes.length > 0) {
          setSelectedScene(data.analysis.scenes[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 加载镜头
  const fetchShots = useCallback(async (sceneId: string) => {
    try {
      const response = await fetch(`/api/scripts/${projectId}/analyze`)
      if (response.ok) {
        const data = await response.json()
        const scene = data.analysis.scenes.find((s: Scene) => s.id === sceneId)
        if (scene && scene.shots) {
          setShots(scene.shots)
        } else {
          setShots([])
        }
      }
    } catch (error) {
      console.error("Failed to fetch shots:", error)
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

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：场景列表 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">场景列表</CardTitle>
                <CardDescription>
                  共 {scenes.length} 个场景
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedScene?.id === scene.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => selectScene(scene)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">场景 {scene.sceneNumber}</span>
                        <Badge variant="outline" className="gap-1">
                          <Film className="h-3 w-3" />
                          {scene.shotCount}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{scene.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {scene.location && <span>{scene.location}</span>}
                        {scene.timeOfDay && <span>·</span>}
                        {scene.timeOfDay && <span>{scene.timeOfDay}</span>}
                      </div>
                    </div>
                  ))}
                  {scenes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      暂无场景
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 场景编辑 */}
            {selectedScene && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">场景信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>场景标题</Label>
                    <Input
                      value={selectedScene.title}
                      onChange={(e) =>
                        setSelectedScene({ ...selectedScene, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>地点</Label>
                      <Input
                        value={selectedScene.location || ""}
                        onChange={(e) =>
                          setSelectedScene({ ...selectedScene, location: e.target.value })
                        }
                        placeholder="内/外"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>时间</Label>
                      <Input
                        value={selectedScene.timeOfDay || ""}
                        onChange={(e) =>
                          setSelectedScene({ ...selectedScene, timeOfDay: e.target.value })
                        }
                        placeholder="日/夜"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>氛围</Label>
                    <Input
                      value={selectedScene.mood || ""}
                      onChange={(e) =>
                        setSelectedScene({ ...selectedScene, mood: e.target.value })
                      }
                      placeholder="紧张、温馨等"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea
                      value={selectedScene.description || ""}
                      onChange={(e) =>
                        setSelectedScene({ ...selectedScene, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={saveScene}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存场景
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：镜头列表和编辑 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedScene ? (
              <>
                {/* 镜头列表 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">镜头列表</CardTitle>
                    <CardDescription>
                      共 {shots.length} 个镜头，总时长 {formatDuration(shots.reduce((sum, s) => sum + s.duration, 0))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {shots.map((shot) => (
                        <div
                          key={shot.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            editingShot?.id === shot.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setEditingShot(shot)}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <Badge variant="outline">{shot.shotType}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {shot.visual?.description || "无描述"}
                            </p>
                            {shot.audio?.dialogue && (
                              <p className="text-xs text-muted-foreground truncate">
                                "{shot.audio.dialogue}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {shot.duration}s
                            </Badge>
                            {shot.isEdited && (
                              <Badge variant="secondary" className="text-xs">
                                已编辑
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {shots.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          该场景暂无镜头
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 镜头编辑 */}
                {editingShot && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">编辑镜头</CardTitle>
                          <CardDescription>{editingShot.shotNumber}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteShot(editingShot.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>镜头类型</Label>
                          <Select
                            value={editingShot.shotType}
                            onValueChange={(value) =>
                              value && setEditingShot({ ...editingShot, shotType: value })
                            }
                          >
                            <SelectTrigger>
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
                        <div className="space-y-2">
                          <Label>镜头运动</Label>
                          <Input
                            value={editingShot.angle || ""}
                            onChange={(e) =>
                              setEditingShot({ ...editingShot, angle: e.target.value })
                            }
                            placeholder="推/拉/摇/移"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>时长（秒）</Label>
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
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>画面描述</Label>
                        <Textarea
                          value={editingShot.visual?.description || ""}
                          onChange={(e) =>
                            setEditingShot({
                              ...editingShot,
                              visual: { ...editingShot.visual, description: e.target.value },
                            })
                          }
                          rows={3}
                          placeholder="描述画面内容..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>动作</Label>
                        <Textarea
                          value={editingShot.audio?.action || ""}
                          onChange={(e) =>
                            setEditingShot({
                              ...editingShot,
                              audio: { ...editingShot.audio, action: e.target.value },
                            })
                          }
                          rows={2}
                          placeholder="角色动作..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>对话</Label>
                        <Textarea
                          value={editingShot.audio?.dialogue || ""}
                          onChange={(e) =>
                            setEditingShot({
                              ...editingShot,
                              audio: { ...editingShot.audio, dialogue: e.target.value },
                            })
                          }
                          rows={2}
                          placeholder="角色对话..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>氛围</Label>
                          <Input
                            value={editingShot.visual?.mood || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                visual: { ...editingShot.visual, mood: e.target.value },
                              })
                            }
                            placeholder="紧张、温馨等"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>视觉参考</Label>
                          <Input
                            value={editingShot.visual?.reference || ""}
                            onChange={(e) =>
                              setEditingShot({
                                ...editingShot,
                                visual: { ...editingShot.visual, reference: e.target.value },
                              })
                            }
                            placeholder="参考画面描述"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={saveShot}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            保存中
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
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
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>请选择一个场景开始编辑</p>
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
