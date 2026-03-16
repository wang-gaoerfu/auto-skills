/**
 * 成本限制配置 API
 *
 * GET /api/scripts/cost/limits
 * - 获取成本限制配置
 *
 * POST /api/scripts/cost/limits
 * - 更新成本限制（管理员）
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// 权限检查
// ============================================

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === "ADMIN"
}

// ============================================
// GET - 获取成本限制
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
    // 获取系统配置
    let config = await prisma.scriptSystemConfig.findFirst()

    if (!config) {
      config = await prisma.scriptSystemConfig.create({
        data: {},
      })
    }

    const limits = {
      dailyMaxCost: config.userDailyCostCap,
      monthlyMaxCost: config.projectCostCap,
      alertThreshold: config.alertThresholdPercent / 100,
      enableCircuitBreaker: !config.generationPaused,
    }

    // 获取当前用户的使用情况
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const [todayCost, monthlyCost] = await Promise.all([
      prisma.scriptCostLog.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
        _sum: { cost: true },
      }),
      prisma.scriptCostLog.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: thisMonth },
        },
        _sum: { cost: true },
      }),
    ])

    const todayUsage = todayCost._sum.cost || 0
    const monthlyUsage = monthlyCost._sum.cost || 0

    return NextResponse.json({
      limits,
      usage: {
        today: todayUsage,
        monthly: monthlyUsage,
        todayPercentage: limits.dailyMaxCost > 0 ? todayUsage / limits.dailyMaxCost : 0,
        monthlyPercentage: limits.monthlyMaxCost > 0 ? monthlyUsage / limits.monthlyMaxCost : 0,
      },
      alerts: {
        todayNearLimit: limits.dailyMaxCost > 0 && todayUsage >= limits.dailyMaxCost * limits.alertThreshold,
        monthlyNearLimit: limits.monthlyMaxCost > 0 && monthlyUsage >= limits.monthlyMaxCost * limits.alertThreshold,
        todayExceeded: limits.dailyMaxCost > 0 && todayUsage >= limits.dailyMaxCost,
        monthlyExceeded: limits.monthlyMaxCost > 0 && monthlyUsage >= limits.monthlyMaxCost,
      },
      system: {
        generationPaused: config.generationPaused,
        pausedReason: config.pausedReason,
      },
    })
  } catch (error) {
    console.error("Failed to get cost limits:", error)
    return NextResponse.json(
      { error: "Failed to get cost limits" },
      { status: 500 }
    )
  }
}

// ============================================
// POST - 更新成本限制（管理员）
// ============================================

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  // 检查管理员权限
  const admin = await isAdmin(session.user.id)
  if (!admin) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { userDailyCostCap, projectCostCap, alertThresholdPercent, generationPaused, pausedReason } = body

    // 更新配置
    const config = await prisma.scriptSystemConfig.upsert({
      where: { id: "system" },
      update: {
        ...(userDailyCostCap !== undefined && { userDailyCostCap }),
        ...(projectCostCap !== undefined && { projectCostCap }),
        ...(alertThresholdPercent !== undefined && { alertThresholdPercent }),
        ...(generationPaused !== undefined && { generationPaused }),
        ...(pausedReason !== undefined && { pausedReason }),
      },
      create: {
        id: "system",
        ...(userDailyCostCap !== undefined && { userDailyCostCap }),
        ...(projectCostCap !== undefined && { projectCostCap }),
        ...(alertThresholdPercent !== undefined && { alertThresholdPercent }),
        ...(generationPaused !== undefined && { generationPaused }),
        ...(pausedReason !== undefined && { pausedReason }),
      },
    })

    return NextResponse.json({
      success: true,
      limits: {
        dailyMaxCost: config.userDailyCostCap,
        monthlyMaxCost: config.projectCostCap,
        alertThreshold: config.alertThresholdPercent / 100,
        enableCircuitBreaker: !config.generationPaused,
      },
      message: "成本限制已更新",
    })
  } catch (error) {
    console.error("Failed to update cost limits:", error)
    return NextResponse.json(
      { error: "Failed to update cost limits" },
      { status: 500 }
    )
  }
}
