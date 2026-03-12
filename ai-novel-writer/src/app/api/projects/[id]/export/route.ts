import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exportProject, ExportFormat, ExportOptions } from "@/lib/export"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)

    const format = (searchParams.get("format") || "txt") as ExportFormat
    const includeMetadata = searchParams.get("includeMetadata") !== "false"
    const printMode = searchParams.get("print") === "1"
    const startChapter = searchParams.get("startChapter")
    const endChapter = searchParams.get("endChapter")

    console.log(`[Export API] Starting export for project ${id}, format: ${format}, printMode: ${printMode}`)

    // 构建导出选项
    const options: ExportOptions = {
      format,
      includeMetadata,
      printMode,
      chapterRange: startChapter && endChapter
        ? {
            start: parseInt(startChapter, 10),
            end: parseInt(endChapter, 10),
          }
        : undefined,
    }

    const result = await exportProject(id, format, options)

    console.log(`[Export API] Export complete, content size: ${typeof result.content === 'string' ? result.content.length : result.content.length}`)

    // 打印模式直接返回 HTML（不作为附件下载）
    if (printMode) {
      return new NextResponse(result.content as BodyInit, {
        headers: {
          "Content-Type": "text/html;charset=utf-8",
          "Cache-Control": "no-cache",
        },
      })
    }

    // 返回文件
    return new NextResponse(result.content as BodyInit, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
        // 对于二进制文件，确保正确的缓存控制
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[Export API] Error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "导出失败" },
      { status: 500 }
    )
  }
}
