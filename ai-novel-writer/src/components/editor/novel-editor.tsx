"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Typography from "@tiptap/extension-typography"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

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
  const [wordCount, setWordCount] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Strike,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem,
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      // 计算字数
      const text = editor.getText()
      setWordCount(text.replace(/\s/g, "").length)
    },
  })

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
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editable, onSave, fullscreen, onFullscreenChange])

  // 格式化文本快捷键
  const setFormat = useCallback(
    (format: string) => {
      if (!editor) return

      const chain = editor.chain().focus()

      switch (format) {
        case "bold":
          chain.toggleBold().run()
          break
        case "italic":
          chain.toggleItalic().run()
          break
        case "underline":
          chain.toggleUnderline().run()
          break
        case "strike":
          chain.toggleStrike().run()
          break
        case "highlight":
          chain.toggleHighlight().run()
          break
        case "h1":
          chain.toggleHeading({ level: 1 }).run()
          break
        case "h2":
          chain.toggleHeading({ level: 2 }).run()
          break
        case "h3":
          chain.toggleHeading({ level: 3 }).run()
          break
        case "bulletList":
          chain.toggleBulletList().run()
          break
        case "orderedList":
          chain.toggleOrderedList().run()
          break
        case "blockquote":
          chain.toggleBlockquote().run()
          break
      }
    },
    [editor]
  )

  if (!editor) {
    return null
  }

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 bg-background"
    : `border rounded-lg ${className}`

  return (
    <div className={containerClass}>
      {/* 工具栏 */}
      {editable && (
        <div className="border-b p-2 flex flex-wrap items-center justify-between gap-1 bg-muted/30">
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("bold")}
              className={editor.isActive("bold") ? "bg-muted" : ""}
              title="粗体 (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("italic")}
              className={editor.isActive("italic") ? "bg-muted" : ""}
              title="斜体 (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("underline")}
              className={editor.isActive("underline") ? "bg-muted" : ""}
              title="下划线 (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("strike")}
              className={editor.isActive("strike") ? "bg-muted" : ""}
              title="删除线"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("highlight")}
              className={editor.isActive("highlight") ? "bg-muted" : ""}
              title="高亮"
            >
              <Highlighter className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("h1")}
              className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
              title="标题1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("h2")}
              className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
              title="标题2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("h3")}
              className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
              title="标题3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("bulletList")}
              className={editor.isActive("bulletList") ? "bg-muted" : ""}
              title="无序列表"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("orderedList")}
              className={editor.isActive("orderedList") ? "bg-muted" : ""}
              title="有序列表"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormat("blockquote")}
              className={editor.isActive("blockquote") ? "bg-muted" : ""}
              title="引用"
            >
              <Quote className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销 (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
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

      {/* 编辑区域 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none"
      />

      {/* 快捷键提示 */}
      {editable && (
        <div className="border-t p-2 text-xs text-muted-foreground text-center">
          <Keyboard className="h-3 w-3 inline mr-1" />
          Ctrl+S 保存 · Ctrl+Shift+F 全屏 · Ctrl+Z 撤销 · Ctrl+Y 重做
        </div>
      )}
    </div>
  )
}
