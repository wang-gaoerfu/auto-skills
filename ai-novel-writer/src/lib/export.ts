import { prisma } from "@/lib/prisma"
import { marked } from "marked"
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
} from "docx"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// 导出格式类型
export type ExportFormat = "txt" | "html" | "markdown" | "docx" | "pdf"

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean // 包含标题、简介等
  printMode?: boolean // 打印模式（用于 PDF 导出）
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
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")

  // 列表
  markdown = markdown.replace(/<ul[^>]*>/gi, "\n")
  markdown = markdown.replace(/<\/ul>/gi, "\n")
  markdown = markdown.replace(/<ol[^>]*>/gi, "\n")
  markdown = markdown.replace(/<\/ol>/gi, "\n")
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")

  // 段落
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
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

// 获取项目数据
async function getProjectData(projectId: string, options: ExportOptions) {
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

  return project
}

// 导出项目为 TXT
export async function exportToTxt(
  projectId: string,
  options: ExportOptions = { format: "txt" }
): Promise<string> {
  const project = await getProjectData(projectId, options)

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
  const project = await getProjectData(projectId, options)

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
  const project = await getProjectData(projectId, options)

  const printStyles = options.printMode ? `
    @media print {
      body { padding: 0; max-width: none; }
      h2 { page-break-before: always; margin-top: 0; }
      article { page-break-inside: avoid; }
      hr { display: none; }
      .no-print { display: none; }
    }
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "SimSun", sans-serif;
      font-size: 12pt;
      line-height: 1.8;
    }
    ` : ""

  let content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 { text-align: center; margin-bottom: 20px; }
    h2 { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-top: 40px; }
    p { text-indent: 2em; margin: 1em 0; }
    blockquote { border-left: 3px solid #ccc; padding-left: 15px; color: #666; margin: 1em 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 30px 0; }
    article { margin: 20px 0; }
    ${printStyles}
  </style>
</head>
<body>
`

  // 添加元数据
  if (options.includeMetadata !== false) {
    content += `<h1>${project.title}</h1>\n`
    if (project.description) {
      content += `<p style="text-align: center; color: #666; text-indent: 0;">${project.description}</p>\n`
    }
    content += `<hr>\n`
  }

  // 添加章节
  for (const chapter of project.chapters) {
    content += `<h2>第${chapter.order}章 ${chapter.title}</h2>\n`

    // 处理章节内容
    let chapterContent = chapter.content || ""

    // 检查是否是 markdown 格式（以 # 开头或有 ** * 等标记）
    const hasMarkdownSyntax = /^#{1,6}\s/m.test(chapterContent) ||
                               chapterContent.includes("**") ||
                               chapterContent.includes("*") ||
                               chapterContent.includes("`")

    if (hasMarkdownSyntax) {
      // Markdown 内容，使用 marked 转换
      chapterContent = await marked.parse(chapterContent) as string
    } else if (!chapterContent.includes("<p") && !chapterContent.includes("<div")) {
      // 纯文本内容，转换为段落
      chapterContent = chapterContent
        .split(/\n\n+/)
        .filter(p => p.trim())
        .map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
        .join("\n")
    }

    content += `<article>${chapterContent}</article>\n`
    content += `<hr>\n`
  }

  content += `</body>\n</html>`

  return content
}

// 导出项目为 Word (DOCX)
export async function exportToDocx(
  projectId: string,
  options: ExportOptions = { format: "docx" }
): Promise<Buffer> {
  const project = await getProjectData(projectId, options)

  const children: Paragraph[] = []

  // 添加元数据
  if (options.includeMetadata !== false) {
    // 标题
    children.push(
      new Paragraph({
        text: project.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    )

    // 简介
    if (project.description) {
      children.push(
        new Paragraph({
          text: project.description,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )
    }

    // 分隔线
    children.push(
      new Paragraph({
        text: "─".repeat(50),
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
        border: {
          bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
      })
    )
  }

  // 添加章节
  for (const chapter of project.chapters) {
    // 章节标题
    children.push(
      new Paragraph({
        text: `第${chapter.order}章 ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    )

    // 章节内容 - 按段落分割
    const chapterText = htmlToText(chapter.content || "")
    const paragraphs = chapterText.split(/\n\n+/)

    for (const para of paragraphs) {
      if (para.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 24, // 12pt = 24 half-points
              }),
            ],
            spacing: { after: 200 },
            indent: { firstLine: 480 }, // 首行缩进 2 字符
          })
        )
      }
    }

    // 章节结束分隔
    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 400 },
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

// 导出项目为 PDF（使用 pdf-lib 库 + 中文字体）
export async function exportToPdf(
  projectId: string,
  options: ExportOptions = { format: "pdf" }
): Promise<Buffer> {
  const { PDFDocument, rgb } = await import("pdf-lib")

  const project = await getProjectData(projectId, options)

  // 创建 PDF 文档
  const pdfDoc = await PDFDocument.create()

  // 尝试加载中文字体
  let font: any = null
  const fontPaths = [
    join(process.cwd(), "src/lib/fonts/NotoSansSC-Regular.ttf"),
    join(process.cwd(), "src/lib/fonts/NotoSansSC-Regular.otf"),
    join(process.cwd(), "public/fonts/NotoSansSC-Regular.ttf"),
  ]

  for (const fontPath of fontPaths) {
    if (existsSync(fontPath)) {
      try {
        const fontBytes = readFileSync(fontPath)
        font = pdfDoc.embedFont(fontBytes, { subset: true })
        console.log("[PDF Export] Font loaded successfully from:", fontPath)
        break
      } catch (e) {
        console.log("[PDF Export] Failed to load font from:", fontPath, e)
      }
    }
  }

  if (!font) {
    // 如果没有中文字体，返回一个提示 HTML 让用户在浏览器中打印
    console.log("[PDF Export] No Chinese font found, generating HTML for browser print")
    throw new Error("PDF 导出需要中文字体支持。请使用 HTML 格式导出，然后在浏览器中按 Ctrl+P 打印为 PDF。")
  }

  // 添加元数据
  if (options.includeMetadata !== false) {
    const titlePage = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = titlePage.getSize()

    // 标题
    titlePage.drawText(project.title, {
      x: 50,
      y: height - 100,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    })

    // 简介
    if (project.description) {
      // 简介可能很长，需要分行
      const descLines = wrapText(project.description, font, 12, width - 100)
      let descY = height - 140
      for (const line of descLines) {
        titlePage.drawText(line, {
          x: 50,
          y: descY,
          size: 12,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
        descY -= 18
      }
    }
  }

  // 添加章节
  for (const chapter of project.chapters) {
    const page = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()

    // 章节标题
    const chapterTitle = `第${chapter.order}章 ${chapter.title}`
    page.drawText(chapterTitle, {
      x: 50,
      y: height - 50,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    })

    // 章节内容
    const chapterText = htmlToText(chapter.content || "")

    // 文字换行处理
    const paragraphs = chapterText.split("\n\n")
    let currentY = height - 100
    let currentPage = page

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue

      const lines = wrapText(paragraph.trim(), font, 12, width - 100)

      for (const line of lines) {
        if (currentY < 50) {
          // 需要新页面
          currentPage = pdfDoc.addPage([595.28, 841.89])
          currentY = currentPage.getSize().height - 50
        }

        currentPage.drawText(line, {
          x: 50,
          y: currentY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        currentY -= 20
      }

      // 段落间距
      currentY -= 10
    }
  }

  // 保存 PDF
  const pdfBytes = await pdfDoc.save()
  console.log("[PDF Export] PDF created, size:", pdfBytes.length)

  return Buffer.from(pdfBytes)
}

// 文字换行辅助函数
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = []
  const chars = text.split("")
  let currentLine = ""

  for (const char of chars) {
    const testLine = currentLine + char
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    } catch {
      // 如果字符无法测量，直接添加
      currentLine = testLine
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [text]
}

// 获取导出内容
export async function exportProject(
  projectId: string,
  format: ExportFormat,
  options: ExportOptions = { format: "txt" }
): Promise<{ content: string | Buffer; filename: string; mimeType: string }> {
  let content: string | Buffer
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
    case "docx":
      content = await exportToDocx(projectId, options)
      filename = `${safeTitle}.docx`
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      break
    case "pdf":
      content = await exportToPdf(projectId, options)
      filename = `${safeTitle}.pdf`
      mimeType = "application/pdf"
      break
    default:
      throw new Error(`不支持的导出格式: ${format}`)
  }

  return { content, filename, mimeType }
}
