/**
 * 成本日志查询 API
 *
 * GET /api/scripts/cost/logs
 * - 获取成本日志（分页）
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// GET - 获取成本日志
// ============================================

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const projectId = searchParams.get("projectId")
    const operation = searchParams.get("operation")

    const where: any = {
      userId: session.user.id,
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (operation) {
      where.operation = operation
    }

    const [logs, total] = await Promise.all([
      prisma.scriptCostLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scriptCostLog.count({ where }),
    ])

    // 获取项目标题
    const projectIds = [...new Set(logs.map((log) => log.projectId))]
    const projects = await prisma.scriptProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, title: true },
    })

    const projectMap = new Map(projects.map((p) => [p.id, p.title]))

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        projectId: log.projectId,
        projectTitle: projectMap.get(log.projectId) || "Unknown",
        operation: log.operation,
        model: log.model,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        totalTokens: log.inputTokens + log.outputTokens,
        cost: log.cost,
        cached: log.cached,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to get cost logs:", error)
    return NextResponse.json(
      { error: "Failed to get cost logs" },
      { status: 500 }
    )
  }
}
