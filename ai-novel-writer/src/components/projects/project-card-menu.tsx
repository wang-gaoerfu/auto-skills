"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, MoreVertical, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProjectCardMenuProps {
  projectId: string
  projectTitle: string
}

export function ProjectCardMenu({ projectId, projectTitle }: ProjectCardMenuProps) {
  console.log("ProjectCardMenu rendered, projectId:", projectId)
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function handleDelete() {
    console.log("handleDelete called, projectId:", projectId)
    setDeleting(true)

    try {
      console.log("Fetching DELETE /api/projects/" + projectId)
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      console.log("Response status:", res.status)

      if (res.ok) {
        setShowDeleteDialog(false)
        router.refresh()
      } else {
        const data = await res.json()
        console.error("Delete failed:", data)
        alert(data.message || "删除失败")
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("删除失败，请稍后重试")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative">
      {/* 三个点按钮 */}
      <button
        onClick={() => {
          console.log("三个点按钮点击")
          setShowMenu(!showMenu)
        }}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-popover border rounded-md shadow-lg z-50">
          <button
            onClick={() => {
              console.log("编辑按钮点击")
              setShowMenu(false)
              router.push(`/projects/${projectId}/edit`)
            }}
            className="w-full flex items-center px-3 py-2 text-sm hover:bg-accent"
          >
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </button>
          <button
            onClick={() => {
              console.log("删除按钮点击")
              setShowMenu(false)
              setShowDeleteDialog(true)
            }}
            className="w-full flex items-center px-3 py-2 text-sm text-destructive hover:bg-accent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </button>
        </div>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除项目「{projectTitle}」吗？此操作不可撤销，所有章节和相关数据都将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log("确认删除按钮点击")
                handleDelete()
              }}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
