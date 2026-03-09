import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exportProject } from "@/lib/export"

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

    const format = (searchParams.get("format") || "txt") as "txt" | "markdown" | "html"
    const includeMetadata = searchParams.get("includeMetadata") !== "false"

    const result = await exportProject(id, format as "txt" | "markdown" | "html", {
      format: format as "txt" | "markdown" | "html",
      includeMetadata,
    })

    // 返回文件
    return new NextResponse(result.content, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
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
