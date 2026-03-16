/**
 * 成本监控 API
 *
 * GET /api/scripts/cost/stats
 * - 获取成本统计
 *
 * GET /api/scripts/cost/logs
 * - 获取成本日志
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// GET - 获取成本统计
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
    // 总体统计
    const totalStats = await prisma.scriptCostLog.aggregate({
      where: { userId: session.user.id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    // 按项目统计
    const projectStats = await prisma.scriptCostLog.groupBy({
      by: ["projectId"],
      where: { userId: session.user.id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    // 按操作类型统计
    const operationStats = await prisma.scriptCostLog.groupBy({
      by: ["operation"],
      where: { userId: session.user.id },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    // 最近7天统计
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentStats = await prisma.scriptCostLog.aggregate({
      where: {
        userId: session.user.id,
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    // 今日统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStats = await prisma.scriptCostLog.aggregate({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
      _count: true,
    })

    return NextResponse.json({
      total: {
        totalTokens: (totalStats._sum.inputTokens || 0) + (totalStats._sum.outputTokens || 0),
        inputTokens: totalStats._sum.inputTokens || 0,
        outputTokens: totalStats._sum.outputTokens || 0,
        totalCost: totalStats._sum.cost || 0,
        requestCount: totalStats._count,
      },
      byProject: projectStats.map((stat) => ({
        projectId: stat.projectId,
        inputTokens: stat._sum.inputTokens || 0,
        outputTokens: stat._sum.outputTokens || 0,
        totalTokens: (stat._sum.inputTokens || 0) + (stat._sum.outputTokens || 0),
        totalCost: stat._sum.cost || 0,
        requestCount: stat._count,
      })),
      byOperation: operationStats.map((stat) => ({
        operation: stat.operation,
        inputTokens: stat._sum.inputTokens || 0,
        outputTokens: stat._sum.outputTokens || 0,
        totalTokens: (stat._sum.inputTokens || 0) + (stat._sum.outputTokens || 0),
        totalCost: stat._sum.cost || 0,
        requestCount: stat._count,
      })),
      recent: {
        totalTokens: (recentStats._sum.inputTokens || 0) + (recentStats._sum.outputTokens || 0),
        totalCost: recentStats._sum.cost || 0,
        requestCount: recentStats._count,
      },
      today: {
        totalTokens: (todayStats._sum.inputTokens || 0) + (todayStats._sum.outputTokens || 0),
        totalCost: todayStats._sum.cost || 0,
        requestCount: todayStats._count,
      },
    })
  } catch (error) {
    console.error("Failed to get cost stats:", error)
    return NextResponse.json(
      { error: "Failed to get cost stats" },
      { status: 500 }
    )
  }
}
