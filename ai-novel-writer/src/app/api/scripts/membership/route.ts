/**
 * 剧本会员 API
 *
 * GET /api/scripts/membership
 * - 获取当前用户的会员信息
 *
 * POST /api/scripts/membership/activate
 * - 激活会员（兑换码）
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"
import { getScriptMembership } from "@/lib/script/utils"
import { SCRIPT_MEMBERSHIP_QUOTAS, ScriptMembershipPlan } from "@/lib/script/types"

// ============================================
// GET - 获取会员信息
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
    const membership = await getScriptMembership(session.user.id)
    const quota = SCRIPT_MEMBERSHIP_QUOTAS[membership.plan as ScriptMembershipPlan]

    return NextResponse.json({
      membership: {
        plan: membership.plan,
        status: membership.status,
        expiresAt: membership.expiresAt,
        dailyGenerations: membership.dailyGenerations,
        monthlyGenerations: membership.monthlyGenerations,
        lastGenerationDate: membership.lastGenerationDate,
      },
      quota: {
        maxProjects: quota.maxProjects,
        maxChaptersPerProject: quota.maxChaptersPerProject,
        dailyGenerations: quota.dailyGenerations,
        monthlyGenerations: quota.monthlyGenerations,
        exportFormats: quota.exportFormats,
        hasWatermark: quota.hasWatermark,
        hasAIShotImage: quota.hasAIShotImage,
      },
    })
  } catch (error) {
    console.error("Failed to get membership:", error)
    return NextResponse.json(
      { error: "Failed to get membership" },
      { status: 500 }
    )
  }
}

// ============================================
// POST - 激活会员（使用兑换码）
// ============================================

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { code, plan } = body

    if (!code) {
      return NextResponse.json(
        { error: "Redemption code is required", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    // 查找兑换码
    const redemptionCode = await prisma.scriptRedemptionCode.findUnique({
      where: { code },
    })

    if (!redemptionCode) {
      return NextResponse.json(
        { error: "Invalid redemption code", code: "INVALID_CODE" },
        { status: 404 }
      )
    }

    // 检查兑换码状态
    if (redemptionCode.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Redemption code is not active", code: "CODE_INACTIVE" },
        { status: 400 }
      )
    }

    // 检查兑换码是否过期
    if (redemptionCode.expiresAt && new Date() > redemptionCode.expiresAt) {
      return NextResponse.json(
        { error: "Redemption code has expired", code: "CODE_EXPIRED" },
        { status: 400 }
      )
    }

    // 检查使用次数
    if (redemptionCode.maxUses !== null && redemptionCode.usedCount >= redemptionCode.maxUses) {
      return NextResponse.json(
        { error: "Redemption code has reached maximum uses", code: "CODE_EXHAUSTED" },
        { status: 400 }
      )
    }

    // 获取或创建用户会员
    let membership = await prisma.scriptMembership.findUnique({
      where: { userId: session.user.id },
    })

    const newPlan = plan || redemptionCode.plan
    const duration = redemptionCode.duration || 30 // 默认 30 天

    // 计算过期时间
    const now = new Date()
    let expiresAt: Date

    if (membership && membership.expiresAt && membership.expiresAt > now) {
      // 从当前过期时间延长
      expiresAt = new Date(membership.expiresAt.getTime() + duration * 24 * 60 * 60 * 1000)
    } else {
      // 从现在开始计算
      expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
    }

    // 更新或创建会员
    if (membership) {
      membership = await prisma.scriptMembership.update({
        where: { id: membership.id },
        data: {
          plan: newPlan,
          status: "ACTIVE",
          expiresAt,
        },
      })
    } else {
      membership = await prisma.scriptMembership.create({
        data: {
          userId: session.user.id,
          plan: newPlan,
          status: "ACTIVE",
          expiresAt,
        },
      })
    }

    // 更新兑换码使用次数
    await prisma.scriptRedemptionCode.update({
      where: { id: redemptionCode.id },
      data: {
        usedCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      membership: {
        plan: membership.plan,
        status: membership.status,
        expiresAt: membership.expiresAt,
      },
      message: "会员激活成功",
    })
  } catch (error) {
    console.error("Failed to activate membership:", error)
    return NextResponse.json(
      { error: "Failed to activate membership" },
      { status: 500 }
    )
  }
}
