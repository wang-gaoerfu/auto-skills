import { prisma } from "@/lib/prisma"

// 导出格式类型
export type ExportFormat = "txt" | "html" | "markdown"

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean // 包含标题、简介等
  chapterRange?: {
    start: number
    end: number
  }
}

// HTML 转 Markdown
function htmlToMarkdown(html: string): string {
  let markdown = html

  // 标题
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")

  // 粗体、斜体
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")

  // 删除线、高亮
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~")
  markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~")
  markdown = markdown.replace(/<mark[^>]*>(.*?)<\/mark>/gi, "==$1==")

  // 引用
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n\n")

  // 列表
  markdown = markdown.replace(/<ul[^>]*>/gi, "\n")
  markdown = markdown.replace(/<\/ul>/gi, "\n")
  markdown = markdown.replace(/<ol[^>]*>/gi, "\n")
  markdown = markdown.replace(/<\/ol>/gi, "\n")
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")

  // 段落
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n")
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n")

  // 清理剩余标签
  markdown = markdown.replace(/<[^>]+>/g, "")

  // 清理多余空行
  markdown = markdown.replace(/\n{3,}/g, "\n\n")

  // 解码 HTML 实体
  markdown = markdown
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')

  return markdown.trim()
}

// HTML 转纯文本
function htmlToText(html: string): string {
  let text = html

  // 段落和换行
  text = text.replace(/<br\s*\/?>/gi, "\n")
  text = text.replace(/<\/p>/gi, "\n\n")
  text = text.replace(/<\/div>/gi, "\n")
  text = text.replace(/<\/h[1-6]>/gi, "\n\n")

  // 列表项
  text = text.replace(/<\/li>/gi, "\n")

  // 清理所有标签
  text = text.replace(/<[^>]+>/g, "")

  // 解码 HTML 实体
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')

  // 清理多余空行
  text = text.replace(/\n{3,}/g, "\n\n")

  return text.trim()
}

// 导出项目为 TXT
export async function exportToTxt(
  projectId: string,
  options: ExportOptions = { format: "txt" }
): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        where: options.chapterRange
          ? {
              order: {
                gte: options.chapterRange.start,
                lte: options.chapterRange.end,
              },
            }
          : undefined,
      },
    },
  })

  if (!project) {
    throw new Error("项目不存在")
  }

  let content = ""

  // 添加元数据
  if (options.includeMetadata !== false) {
    content += `${project.title}\n`
    content += `${"=".repeat(project.title.length * 2)}\n\n`

    if (project.description) {
      content += `${project.description}\n\n`
    }

    content += `\n${"=".repeat(50)}\n\n`
  }

  // 添加章节
  for (const chapter of project.chapters) {
    content += `第${chapter.order}章 ${chapter.title}\n\n`
    content += `${"─".repeat(50)}\n\n`

    const chapterText = htmlToText(chapter.content || "")
    content += `${chapterText}\n\n\n`
  }

  return content
}

// 导出项目为 Markdown
export async function exportToMarkdown(
  projectId: string,
  options: ExportOptions = { format: "markdown" }
): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        where: options.chapterRange
          ? {
              order: {
                gte: options.chapterRange.start,
                lte: options.chapterRange.end,
              },
            }
          : undefined,
      },
    },
  })

  if (!project) {
    throw new Error("项目不存在")
  }

  let content = ""

  // 添加元数据
  if (options.includeMetadata !== false) {
    content += `# ${project.title}\n\n`

    if (project.description) {
      content += `> ${project.description}\n\n`
    }

    content += `---\n\n`
  }

  // 添加章节
  for (const chapter of project.chapters) {
    content += `## 第${chapter.order}章 ${chapter.title}\n\n`

    const chapterMarkdown = htmlToMarkdown(chapter.content || "")
    content += `${chapterMarkdown}\n\n`

    content += `---\n\n`
  }

  return content
}

// 导出项目为 HTML
export async function exportToHtml(
  projectId: string,
  options: ExportOptions = { format: "html" }
): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        where: options.chapterRange
          ? {
              order: {
                gte: options.chapterRange.start,
                lte: options.chapterRange.end,
              },
            }
          : undefined,
      },
    },
  })

  if (!project) {
    throw new Error("项目不存在")
  }

  let content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.8;
    }
    h1 { text-align: center; }
    h2 { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    blockquote { border-left: 3px solid #ccc; padding-left: 15px; color: #666; }
    hr { border: none; border-top: 1px solid #eee; margin: 30px 0; }
  </style>
</head>
<body>
`

  // 添加元数据
  if (options.includeMetadata !== false) {
    content += `<h1>${project.title}</h1>\n`
    if (project.description) {
      content += `<p style="text-align: center; color: #666;">${project.description}</p>\n`
    }
    content += `<hr>\n`
  }

  // 添加章节
  for (const chapter of project.chapters) {
    content += `<h2>第${chapter.order}章 ${chapter.title}</h2>\n`
    content += `<article>${chapter.content || ""}</article>\n`
    content += `<hr>\n`
  }

  content += `</body>\n</html>`

  return content
}

// 获取导出内容
export async function exportProject(
  projectId: string,
  format: ExportFormat,
  options: ExportOptions = { format: "txt" }
): Promise<{ content: string; filename: string; mimeType: string }> {
  let content: string
  let filename: string
  let mimeType: string

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true },
  })

  if (!project) {
    throw new Error("项目不存在")
  }

  // 清理文件名
  const safeTitle = project.title.replace(/[<>:"/\\|?*]/g, "_")

  switch (format) {
    case "txt":
      content = await exportToTxt(projectId, options)
      filename = `${safeTitle}.txt`
      mimeType = "text/plain;charset=utf-8"
      break
    case "markdown":
      content = await exportToMarkdown(projectId, options)
      filename = `${safeTitle}.md`
      mimeType = "text/markdown;charset=utf-8"
      break
    case "html":
      content = await exportToHtml(projectId, options)
      filename = `${safeTitle}.html`
      mimeType = "text/html;charset=utf-8"
      break
    default:
      throw new Error(`不支持的导出格式: ${format}`)
  }

  return { content, filename, mimeType }
}
