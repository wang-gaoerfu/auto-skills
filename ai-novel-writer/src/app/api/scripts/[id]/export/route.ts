/**
 * 导出 API
 *
 * GET /api/scripts/[id]/export?format=json|md|pdf|excel
 * - 导出剧本为指定格式
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"
import {
  getExportData,
  exportAsJSON,
  exportAsMarkdown,
  exportAsExcel,
  exportAsPDF,
  checkExportPermission,
  needsWatermark,
  type ExportFormat,
} from "@/lib/script/exporter"

// ============================================
// Content-Type 映射
// ============================================

const CONTENT_TYPES: Record<ExportFormat, string> = {
  json: "application/json",
  md: "text/markdown",
  pdf: "text/html",
  excel: "text/csv",
}

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  json: "json",
  md: "md",
  pdf: "html",
  excel: "csv",
}

// ============================================
// GET - 导出剧本
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId } = await params

  // 获取项目
  const project = await prisma.scriptProject.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  // 获取导出格式
  const { searchParams } = new URL(request.url)
  const format = (searchParams.get("format") || "json") as ExportFormat

  // 检查格式权限
  const permission = await checkExportPermission(session.user.id, format)
  if (!permission.allowed) {
    return NextResponse.json(
      { error: permission.reason || "Format not allowed", code: ScriptErrorCode.EXPORT_FORMAT_NOT_ALLOWED },
      { status: 403 }
    )
  }

  // 检查是否需要水印
  const addWatermark = await needsWatermark(session.user.id)

  try {
    // 获取导出数据
    const data = await getExportData(projectId)
    if (!data) {
      return NextResponse.json(
        { error: "Failed to get export data" },
        { status: 500 }
      )
    }

    // 根据格式生成内容
    let content: string
    let filename: string

    switch (format) {
      case "json":
        content = exportAsJSON(data, addWatermark)
        filename = `${sanitizeFilename(data.project.title)}.json`
        break
      case "md":
        content = exportAsMarkdown(data, addWatermark)
        filename = `${sanitizeFilename(data.project.title)}.md`
        break
      case "pdf":
        content = exportAsPDF(data, addWatermark)
        filename = `${sanitizeFilename(data.project.title)}.html`
        break
      case "excel":
        content = exportAsExcel(data, addWatermark)
        filename = `${sanitizeFilename(data.project.title)}.csv`
        break
      default:
        return NextResponse.json(
          { error: "Unsupported format" },
          { status: 400 }
        )
    }

    // 记录导出
    await prisma.scriptExport.create({
      data: {
        scriptProjectId: projectId,
        userId: session.user.id,
        format,
        fileSize: content.length,
      },
    })

    // 返回文件
    return new NextResponse(content, {
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error("Export failed:", error)
    return NextResponse.json(
      { error: "Export failed", code: ScriptErrorCode.EXPORT_FAILED },
      { status: 500 }
    )
  }
}

// ============================================
// 辅助函数
// ============================================

/** 清理文件名 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "") // 移除非法字符
    .replace(/\s+/g, "_") // 空格替换为下划线
    .substring(0, 100) // 限制长度
}
