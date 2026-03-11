import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exportProject, ExportFormat } from "@/lib/export"

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
    const startChapter = searchParams.get("startChapter")
    const endChapter = searchParams.get("endChapter")

    // 构建导出选项
    const options = {
      format,
      includeMetadata,
      chapterRange: startChapter && endChapter
        ? {
            start: parseInt(startChapter, 10),
            end: parseInt(endChapter, 10),
          }
        : undefined,
    }

    const result = await exportProject(id, format, options)

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
    console.error("Export error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "导出失败" },
      { status: 500 }
    )
  }
}
