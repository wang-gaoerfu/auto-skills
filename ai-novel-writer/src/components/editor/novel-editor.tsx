"use client"

import { marked } from "marked"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Maximize,
  Minimize,
  Save,
  Keyboard,
  Eye,
} from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"

interface NovelEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onSave?: () => void
  fullscreen?: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
}

export function NovelEditor({
  content,
  onChange,
  placeholder = "开始写作...",
  editable = true,
  className = "",
  onSave,
  fullscreen = false,
  onFullscreenChange,
}: NovelEditorProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  // 计算字数
  const wordCount = content.replace(/<[^>]*>/g, "").replace(/\s/g, "").length

  // 打开预览
  const openPreview = useCallback(async () => {
    const plainText = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
    const html = await marked.parse(plainText) as string
    setPreviewHtml(html)
    setPreviewOpen(true)
  }, [content])

  // 记录历史用于撤销
  const pushHistory = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-50), content])
    setRedoStack([])
  }, [content])

  // 撤销
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const prevContent = undoStack[undoStack.length - 1]
      setRedoStack((prev) => [...prev, content])
      setUndoStack((prev) => prev.slice(0, -1))
      onChange(prevContent)
    }
  }, [undoStack, content, onChange])

  // 重做
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1]
      setUndoStack((prev) => [...prev, content])
      setRedoStack((prev) => prev.slice(0, -1))
      onChange(nextContent)
    }
  }, [redoStack, content, onChange])

  // 保存快捷键
  useEffect(() => {
    if (!editable) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        onSave?.()
        setLastSaved(new Date())
      }
      // Ctrl/Cmd + Shift + F 全屏
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault()
        onFullscreenChange?.(!fullscreen)
      }
      // Esc 退出全屏
      if (e.key === "Escape" && fullscreen) {
        onFullscreenChange?.(false)
      }
      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Y 或 Ctrl+Shift+Z 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
      // Ctrl+P 预览
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        openPreview()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editable, onSave, fullscreen, onFullscreenChange, handleUndo, handleRedo, openPreview])

  // 插入 markdown 格式
  const insertFormat = useCallback((format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ""
    let cursorOffset = 0

    switch (format) {
      case "bold":
        newText = `**${selectedText || "粗体文字"}**`
        cursorOffset = selectedText ? newText.length : 2
        break
      case "italic":
        newText = `*${selectedText || "斜体文字"}*`
        cursorOffset = selectedText ? newText.length : 1
        break
      case "underline":
        newText = `<u>${selectedText || "下划线文字"}</u>`
        cursorOffset = selectedText ? newText.length : 3
        break
      case "strike":
        newText = `~~${selectedText || "删除线文字"}~~`
        cursorOffset = selectedText ? newText.length : 2
        break
      case "highlight":
        newText = `==${selectedText || "高亮文字"}==`
        cursorOffset = selectedText ? newText.length : 2
        break
      case "h1":
        newText = `# ${selectedText || "标题1"}`
        cursorOffset = newText.length
        break
      case "h2":
        newText = `## ${selectedText || "标题2"}`
        cursorOffset = newText.length
        break
      case "h3":
        newText = `### ${selectedText || "标题3"}`
        cursorOffset = newText.length
        break
      case "bulletList":
        newText = `- ${selectedText || "列表项"}`
        cursorOffset = newText.length
        break
      case "orderedList":
        newText = `1. ${selectedText || "列表项"}`
        cursorOffset = newText.length
        break
      case "blockquote":
        newText = `> ${selectedText || "引用文字"}`
        cursorOffset = newText.length
        break
      default:
        return
    }

    pushHistory()
    const newContent = content.substring(0, start) + newText + content.substring(end)
    onChange(newContent)

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + cursorOffset
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [content, onChange, pushHistory])

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    pushHistory()
    onChange(e.target.value)
  }

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 bg-background"
    : `border rounded-lg ${className}`

  return (
    <>
      <div className={containerClass}>
        {/* 工具栏 */}
        {editable && (
          <div className="border-b p-2 flex flex-wrap items-center justify-between gap-1 bg-muted/30">
            <div className="flex flex-wrap gap-1">
              {/* 格式按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("bold")}
                title="粗体 (**文字**)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("italic")}
                title="斜体 (*文字*)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("underline")}
                title="下划线 (<u>文字</u>)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("strike")}
                title="删除线 (~~文字~~)"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("highlight")}
                title="高亮 (==文字==)"
              >
                <Highlighter className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("h1")}
                title="标题1 (# 标题)"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("h2")}
                title="标题2 (## 标题)"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("h3")}
                title="标题3 (### 标题)"
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("bulletList")}
                title="无序列表 (- 项)"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("orderedList")}
                title="有序列表 (1. 项)"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormat("blockquote")}
                title="引用 (> 文字)"
              >
                <Quote className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="撤销 (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="重做 (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* 右侧工具 */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  已保存 {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {wordCount.toLocaleString()} 字
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openPreview}
                title="预览 (Ctrl+P)"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {onSave && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSave()
                    setLastSaved(new Date())
                  }}
                  title="保存 (Ctrl+S)"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              {onFullscreenChange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFullscreenChange(!fullscreen)}
                  title={fullscreen ? "退出全屏 (Esc)" : "全屏 (Ctrl+Shift+F)"}
                >
                  {fullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 编辑区域 - 纯文本 textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          className="w-full p-4 min-h-[400px] resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed whitespace-pre-wrap"
          disabled={!editable}
        />

        {/* 快捷键提示 */}
        {editable && (
          <div className="border-t p-2 text-xs text-muted-foreground text-center">
            <Keyboard className="h-3 w-3 inline mr-1" />
            Ctrl+S 保存 · Ctrl+P 预览 · Ctrl+Shift+F 全屏 · Ctrl+Z 撤销 · Ctrl+Y 重做
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!max-w-[60vw] !w-[60vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>预览</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 h-[80vh]">
            <div
              className="tiptap p-6"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
