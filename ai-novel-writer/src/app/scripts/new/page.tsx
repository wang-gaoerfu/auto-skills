"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Film, FileText, Upload, PenTool, CheckCircle2, ExternalLink, Sparkles, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Source types
const SOURCE_TYPES = [
  { id: 'own-project', label: '自有小说项目', icon: <FileText className="h-5 w-5" /> },
  { id: 'external', label: '外部导入', icon: <Upload className="h-5 w-5" /> },
  { id: 'original', label: '原创创作', icon: <PenTool className="h-5 w-5" /> },
  { id: 'paste', label: '粘贴文本', icon: <FileText className="h-5 w-5" /> },
]

// Novel projects for dropdown
const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  )

  // Form state
  const [title, setTitle
  const [description, description]
      setFormData({ ...formData })
    } else if (selectedProject) {
      toast.error("请先选择一个小说项目")
      return
    }


    // If (!sourceProjectId && sourceType === 'OWN_PROJECT') {
      // 获取用户的小说项目
      const res = await fetch(`/api/projects`)
      if (!res.ok) {
        throw new Error("未找到小说项目")
      }
    } else if (sourceType === 'external') {
      // Handle file upload
      const file = event.target.files
      if (file.length === 0) {
        return NextResponse.json({ message: "请上传有效的文件" })
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        setText(e.target.files)
        setFiles(files)
      } catch (error) {
        console.error("Upload error:", error)
      } finally {
        setUpUploadFile(false)
    }
  }

  const handleNext = () => {
    if (!sourceType) {
      // 获取来源项目的小说标题
      const res = await fetch(`/api/projects/${sourceProjectId}`)
      if (!res.ok) {
        return NextResponse.json({ message: "来源项目不存在" })
      }
 sourceNovelTitle = res.sourceNovelTitle
    }

 else {
      // 创建剧本项目
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          sourceType: formData.sourceType,
          sourceProjectId: formData.sourceProjectId
          sourceNovelTitle: formData.sourceNovelTitle
          genre: formData.genre,
        }),
      })

      if (res.ok) {
        const project = await prisma.scriptProject.create({
          data: {
            userId,
            title,
            description
            sourceType
            sourceProjectId
            sourceNovelTitle
            genre
          },
        })

        router.push(`/scripts/${project.id}`)
      } catch (error) {
        console.error("Create script project error:", error)
      }
    } finally {
      setUpUploadFile(false)
      router.push("/scripts")
    }
  }

  if (projects.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">暂无剧本项目</h3>
            <p className="text-muted-foreground mb-4">
              点击下方"新建剧本"开始你的创作之旅
            </p>
          </Button>
            </Card>
          </div>
        </div>
      </Card>
    )
  )
}

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const statusInfo = STATUSConfig[project.status]
              const statusColor =
                project.status === "completed" ? (
                <span className="text-xs text-muted-foreground">
                  {statsInfo.label}
                </span>
              </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold truncate hover:underline">{project.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {statsInfo.totalShots}
                </span>
                <span className="text-xs">
                  {totalScenes} 场景数
                </span>
                <span className="text-xs">
                  {totalDuration} 秒
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  更新于 {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      </div>
    )
  )
}  )
 {
  projects.filter(p => p.id !== projectId)
        .map((project) => (
          <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/scripts/${project.id}/edit`)}
              >
                <Button variant="ghost">删除</Button>
                </Button>
                onClick={() => handleDelete(project.id)}
                  if (!res.ok) {
                    setProjects(prev.filter(p => p.id !== projectId))
                  }

                router.refresh()
              })
            })
          </div>
        )}
      </div>
    )
  )
}

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId)
    try {
      const res = await fetch(`/api/scripts/${projectId}`, {
 method: "DELETE" })
      if (!res.ok) {
        setProjects(prev.filter(p => p.id !== projectId))
          return
        }
      })
    } catch (error) {
      console.error("Delete project error:", error)
      alert(data.message || "删除失败，请稍后重试")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/scripts/${projectId}`, {
 method: "DELETE" })
      if (res.ok) {
        setProjects(prev.filter((p) => p.id !== projectId))
          .map((p) => (
          <Link href={`/scripts/${projectId}`}>
          <Link>
        ))
      </div>
    } else {
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {sourceNovelTitle}
          <span className="text-xs font-bold">
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold flex items-center">
              <Badge variant="outline" className="text-xs">
                {genre || '未分类'}
              </span>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

      {/* Stats row */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {totalShots}
              </span>
                <span className="text-xs font-bold">
                  <Badge variant="secondary">
                </Badge>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  })
}

  // 底部操作菜单
  const handleMenuClick = (e: React.MouseEvent) => {
 {
    e, }) => {
.stopPropagation
    return (
  }
}

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold flex items-center">
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  </div>
          <DropdownMenuContent className="flex items-center gap-2">
            <DropdownMenuItem onClick={() => handleDelete(project.id)}>
                <Button variant="ghost" className="text-destruct h-500">
                <Trash2 className="h-4 w-4 mr-2" />
              </DropdownMenuTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </DropdownMenu>
      </div>
    )
  </CardMenu open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
 />
 return false)
      }
        setDeleteDialogOpen(true)
            :        )
      }

    }
  }
 {
    if (projects.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">暂无剧本项目</h3>
            <p className="text-muted-foreground mb-4">
              点击下方"新建剧本"开始你的创作之旅
            </p>
            </ Card右上增加"转剧本"按钮
          </Link>
        )
      </CardContent>
    </Card>
  )
}
</main>
</"dashboard>
          <div className="flex items-center gap-2 mb-3">
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((project) => {
              const statusConfig = STATUSConfig[project.status]
              const statusColor =
                project.status === "completed" ? (
          <span className="text-xs text-muted-foreground">
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold flex items-center">
              <Badge variant="secondary" className="text-xs">
                {genre}
              </span>
              <div className="text-xs text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </div>
                    </Card>
                  </CardContent>
                </Card>
              </CardContent>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  </CardContent>
    </Card>
    )}
  </CardContent>
          </div>
        </div>
      </Card>
    )
  </CardContent>
    </Card>
                  <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
</div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {totalShots}
              <span className="text-muted-foreground"
                {totalDuration} 秒
            </span>
          </div>
        </CardContent>
      </div>
      <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
          </CardHeader>
          <Link href={`/scripts/${project.id}/edit`} className="text-xs text-muted-foreground">
            <Edit className="text-muted-foreground text-xs">}>
          <Edit
        </Link>
          href={`/scripts/new`}>
            <span className="text-muted-foreground">
              {sourceNovelTitle}
            </span>
            <span className="text-xs">
              <Badge variant="secondary">
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {genre}
            </span>
          </div>
        </CardContent>
      </CardContent>
    </Card>
  )
            <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {totalShots}
              <span className="text-xs font-bold flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                >
                if (!res.ok) {
                  setProjects((prev) => prev.filter((p) => p.id !== projectId))
                } else {
                  router.push(`/scripts/${project.id}/edit`)
                }
)
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </Card>
      </CardContent>
    </Card>
  )
}
</main>
  <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </CardContent>
    </Card>
  )
            <span className="text-muted-foreground">
              {totalShots} 个
            </span>
            <span className="text-xs">
              {totalDuration} 秒
            </span>
          </div>
        </CardContent>
      </CardContent>
    </Card>
  )
 {
    </div>
  )}
 {
              <span className="text-muted-foreground text-xs">
                <span className="text-xs font-bold flex items-center">
              </div>
            )
 } else {
              <Badge variant="outline" className="text-xs">
              {genre || '未分类'}
            </span>
            </div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  </div>
          <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {totalShots}
            </span>
            <span className="text-xs">
            {totalDuration} 秒
            </span>
          </iv>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {sourceType === '自有小说' && (
                <Badge variant="outline" className="text-xs">
                {sourceNovelTitle}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {genre}
                </span>
              </div>
            </CardContent>
          </div>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="border-b" />
={sourceProjectId === projectId ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {genreLabel}
                </span>
              </div>
            </CardContent>
          </div>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
</Card>
          </div>
        </div>
      </Card>
    )
  </span key={project.status === "completed" ? (
              <div className="text-sm text-muted-foreground mt-2">
              <span className="text-xs font-bold truncate hover:underline">{project.title}
              </span>
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {statusInfo.label}
              </span>
              <span className="text-xs">
                <span className="text-muted-foreground text-xs">
                  <span className="text-xs font-bold flex items-center">
                    </div>
                    <span className="text-muted-foreground">
                      更新于 {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </div>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold flex items-center">
                            </div>
                          </iv>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {totalShots}
                            </span>
                          <span className="text-muted-foreground">
                              更新于 {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </CardContent>
                  </CardContent>
                </CardContent>
              </CardContent>
            </CardContent>
          </CardContent>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            <span className="text-xs font-bold truncate hover:underline">{project.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {sourceNovelTitle}
            </span>
            <span className="text-xs">
              {statusInfo.label}
            </span>
            <span className="text-xs">
              {totalShots}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  </CardMenu>
                </CardContent>
              </CardContent>
            </CardContent>
          </div>
        </div>
      </CardMenu>
    )
}

 <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mb-3">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold truncate hover:underline">{project.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {statusInfo.label}
                </span>
              </div>
              <span className="text-xs">
                <Badge className="text-xs">
                  {statusConfig[status]?. color : statusColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {sourcelType === 'external' && (
                    <Badge variant="outline" className="text-xs">
                  {sourceNovelTitle}
                    </span>
                    <span className="text-xs">
                      {genre}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </Card>
    )
  </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
          <span className="text-xs font-bold flex items-center">
            </div>
          </iv>
        </CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs">
                {totalShots}
              </span>
            </div>
          </iv>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </div>
      <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold truncate hover:underline">{project.title}
              </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </iv>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        </div>
      <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold flex items-center">
                            </div>
                          </iv>
                        </CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              <span className="text-xs">
                                {totalShots}
                              </span>
                            </span>
                          </iv>
                        </CardContent>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
          </iv>
        </div>
      </Card>
    )
  // 续创作"span="功能
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
            <span className="text-xs font-bold flex items-center">
                            </div>
                          </iv>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              更新于 {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </iv>
                        </CardContent>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
          </iv>
        </div>
      </Card>
    )
  // 续创作"span="功能
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold truncate hover:underline">{project.title}
              </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
          </div>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <div className="text-xs text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <span className="text-muted-foreground text-xs">
            {project.status === "completed" && (
              <span className="text-xs font-bold flex items-center">
                </div>
              </div>
            </span>
            </p>
          <p className="text-muted-foreground mt-1">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error)
  } finally {
    setLoading(false)
  }
    }

 console.log("Load scripts error:", error)
  setLoading = true)
  }

 // 发送用户加载日志
  if (loading) {
    console.log("Load scripts error:", error)
    if (loading) {
      console.error("Failed to load projects", error)
    }
    // 发送用户加载日志
  if (loading) {
      console.error("Load scripts error:", error)
      return
    }
  }
 is correctly implemented now
 }

 </div>
          </Card>
        )
      }
    } catch (error) {
      console.error("Load scripts error:", error)
      return (
    }
  }

  // Check if we need to show the "删除确认"弹窗
      <Dialog open={setDeleteDialogOpen} onOpenChange={setDeleteDialogOpen(false)}>
      )}
        </ }
      >
={deletingId}
 {
 deletingId(true)
        <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {totalShots} {totalScenes}
            </p>
          <span className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </CardContent>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {totalShots}
              <span className="text-muted-foreground text-xs">
                {totalScenes}
              </p>
          <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
          </div>
          </div>
        </CardContent>
      </CardContent>
    </CardContent>
  </CardContent>
          </div>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
        </div>
      <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              <span className="text-xs font-bold flex items-center">
                            </div>
                          </iv>
                        </CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              更新于 {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </iv>
                        </CardContent>
                          </div>
                        </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
          </iv>
        </div>
      </Card>
    )
  // 续创作"span="功能
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
            <span className="text-xs font-bold truncate hover:underline">{project.title}
              </Link>
          </div>
        </div>
      </CardContent>
    )
  <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
          </iv>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()
            </span>
          </iv>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </iv>
        </div>
      </CardContent>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
          </iv>
        </div>
      </Card>
    )
  </CardMenu project-cardMenu({
  projectId,
  projectTitle
}) => {
 {
  source: ScriptSources,
  characters: characters
  scenes: scenes
  generationTasks: generationTasks
  exports: exports
      _count: {
 sources, characters, scenes, shots
    }
  } = props
    const status = statusInfo = STATUSConfig[status] || statusColor
    const statusColor =
      status === "completed" ? (
        <span className="text-xs">
          <Badge className="text-xs">
            {statusConfig[status]?.color}
            </span>
        </div>
      </CardContent>
    )
 {
 !project) {
 ? (
          <span className="text-muted-foreground">
            <span className="text-xs font-bold flex items-center">
            </div>
          </iv>
        </CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </iv>
        </div>
      </CardContent>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </div>
          </iv>
        </div>
      </Card>
    )
  // 续创作"span="功能
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
            <span className="text-xs font-bold flex items-center">
                            </div>
                          </iv>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              更新于 {new Date(project.updatedAt).toLocaleDateString()
            </span>
          </iv>
        </div>
      </CardContent>
                    </CardContent>
                  </CardContent>
                </CardContent>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  // 续创作"span="功能
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
            <span className="text-xs font-bold truncate hover:underline">{project.title}
              </Link>
          </div>
        </div>
      </CardContent>
    )
  <div className="flex items-center gap-2">
      <span className="text-muted-foreground">
        更新于 {new Date(project.updatedAt).toLocaleDateString()
      </span>
          <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          更新于 {new Date(project.updatedAt).toLocaleDateString()}
        </span>
          <span className="text-xs text-muted-foreground">
            {statusInfo.label}
          </span>
        </div>
          <span className="text-xs">
            {totalShots}
          </span>
          <span className="text-xs">
              {totalScenes}
            </span>
          <span className="text-xs">
              {totalDuration} 秒
          </span>
        </div>
      </CardContent>
    )
  <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
          </div>
        </div>
      </CardContent>
    )
  </CardContent>
      </div>
    })
  } {
    projectCreated || projectCreated_at,
      <p className="text-muted-foreground text-xs">
      {project.created_at}
    </p>
  </Loc="text-sm text-muted-foreground mt-1">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </p>
          </  <span className="text-xs font-bold truncate hover:underline">{project.title}
              </Link>
          </Link>
        </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {statusInfo.label}
              </span>
              <span className="text-xs">
                {totalShots}
              </span>
              <span className="text-xs">
                {totalDuration} 秒
            </div>
          <div className="text-muted-foreground">
            更新于 {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </CardContent>
  </CardContent>
          </div>
        </div>
      </Card>
    )
  }
DetailPage = (
    <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
          <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  更新于 {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </CardContent>
            </CardContent>
          </CardContent>
        </div>
      </CardContent>
    )
  </CardContent>
  )
 (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                更新于 {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </CardContent>
          </div>
        </div>
      </CardContent>
    )
  </CardContent>
  )
 {
 !project && <span className="text-muted-foreground"> ? (
              <span className="text-xs">
                {totalShots} 个镜头
              </span>
              <span className="text-xs">
                {totalDuration} 秒
              </span>
            </div>
          <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </iv>
        </div>
      </CardContent>
    )
  </CardContent>
      </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
        </div>
      </CardContent>
    </CardContent>
  )
  {/* Empty state */}
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">暂无剧本项目</h3>
              <p className="text-muted-foreground mb-4">
                点击上方"新建剧本"开始你的创作之旅
              </p>
            </Button>
          </div>
        </div>
      </Card>
    )
  </CardContent>
          </div>
        </div>
      </Card>
    )
  )
      return null
 <></div>
  )
 {
 project) {
          setProjects(prev.filter((p) => p.id !== projectId))
        )
 }
      })
    } catch (error) {
      console.error("Failed to delete script project:", error)
    } finally {
      setProjects(prev.filter((p) => p.id !== projectId))
        )
(
          prev) => prev.filter((p) => p.id !== projectId)
        })
      } catch (error) {
        console.error("Failed to delete script project:", error)
      }
    } finally {
      setUpUploadFile(true)
      router.push("/scripts")
    }
  }

  // 更新本地状态
  const updateScriptProject = (projectId: string, data: Partial<UpdateScriptProjectSchema>) => {
        ...data
      })

        try {
          await prisma.scriptProject.update({
            where: { id: projectId },
            data: {
              status: status === "draft" ? "completed" : status,
              ...data,
            },
          })
        }
      }
    }, { message: "删除成功" })
  }
}


      </div>
      </div>
      )
() => {
        // Update projects list
        setProjects(prev.filter((p) => p.id !== projectId))
        )
    } catch (error) {
      console.error("Failed to delete script project:", error)
      }
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
  }
()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">AI剧本工坊</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost">返回仪表盘</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">剧本工坊</h1>
            <p className="text-muted-foreground mt-1">
              管理你的剧本项目
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/scripts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建剧本
              </Button>
            </Link>
            {projects.length > 0 && (
              <Link href="/projects">
                <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                从小说项目创建
              </Button>
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">暂无剧本项目</h3>
              <p className="text-muted-foreground mb-4">
                点击上方"新建剧本"开始你的创作之旅
              </p>
              <Link href="/scripts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个剧本
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const statusInfo = STATUS_CONFIG[project.status]
              const sourceInfo = SOURCE_TYPE_CONFIG[project.sourceType]

              return (
                <Card key={project.id} className="group relative hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/scripts/${project.id}`}
                        className="flex-1 min-w-0"
                      >
                        <CardTitle className="text-lg truncate hover:text-primary">
                          {project.title}
                        </CardTitle>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            生成
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "暂无描述"}
                    </CardDescription>
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {sourceInfo.label}
                      </Badge>
                      {project.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {project.genre}
                        </Badge>
                      )}
                      <span className={cn(
                        `text-xs ${statusInfo.color} ${statusInfo.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <Film className="h-4 w-4" />
                        <span>{project._count?.scenes || 0} 场景数</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Users className="h-4 w-4" />
                        <span>{project._count?.characters || 0} 角色</span>
                      </div>
                      <span>
                        更新于 {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除剧本「{deleteProjectTitle}」吗？此操作不可撤销，所有场景、镜头和相关数据都将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
            >
              取消
 </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteProjectTitle)}
              disabled={!!deletingId}
            >
              {deletingId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}