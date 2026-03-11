import { prisma } from "@/lib/prisma"
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
} from "docx"
import pdfMake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"

// 注册 pdfmake 字体
pdfMake.vfs = pdfFonts.pdfMake.vfs

// 导出格式类型
export type ExportFormat = "txt" | "html" | "markdown" | "docx" | "pdf"

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

// 导出项目为 PDF
export async function exportToPdf(
  projectId: string,
  options: ExportOptions = { format: "pdf" }
): Promise<Buffer> {
  const project = await getProjectData(projectId, options)

  const content: any[] = []

  // 添加元数据
  if (options.includeMetadata !== false) {
    // 标题
    content.push({
      text: project.title,
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 20],
    })

    // 简介
    if (project.description) {
      content.push({
        text: project.description,
        style: "subheader",
        alignment: "center",
        margin: [0, 0, 0, 30],
      })
    }

    // 分隔线
    content.push({
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: "#cccccc",
        },
      ],
      margin: [0, 0, 0, 30],
    })
  }

  // 添加章节
  for (const chapter of project.chapters) {
    // 章节标题
    content.push({
      text: `第${chapter.order}章 ${chapter.title}`,
      style: "chapterTitle",
      margin: [0, 20, 0, 15],
    })

    // 章节内容
    const chapterText = htmlToText(chapter.content || "")
    const paragraphs = chapterText.split(/\n\n+/)

    for (const para of paragraphs) {
      if (para.trim()) {
        content.push({
          text: para.trim(),
          style: "body",
          margin: [0, 0, 0, 10],
        })
      }
    }

    // 章节分隔
    content.push({
      text: "",
      margin: [0, 0, 0, 20],
    })
  }

  // PDF 文档定义
  const docDefinition: any = {
    content,
    styles: {
      header: {
        fontSize: 24,
        bold: true,
      },
      subheader: {
        fontSize: 12,
        color: "#666666",
      },
      chapterTitle: {
        fontSize: 16,
        bold: true,
      },
      body: {
        fontSize: 12,
        lineHeight: 1.8,
      },
    },
    defaultStyle: {
      font: "Roboto", // pdfmake 默认字体，中文可能需要额外配置
    },
    pageSize: "A4",
    pageMargins: [72, 72, 72, 72], // 1 inch margins
  }

  return new Promise((resolve, reject) => {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition)
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      resolve(buffer)
    })
  })
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
