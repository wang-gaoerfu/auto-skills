/**
 * 兑换码管理 API（管理员）
 *
 * GET /api/scripts/redemption-codes
 * - 获取兑换码列表
 *
 * POST /api/scripts/redemption-codes
 * - 创建兑换码
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"
import { ScriptMembershipPlan } from "@/lib/script/types"

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
// GET - 获取兑换码列表
// ============================================

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (plan) {
      where.plan = plan
    }

    const codes = await prisma.scriptRedemptionCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ codes })
  } catch (error) {
    console.error("Failed to get redemption codes:", error)
    return NextResponse.json(
      { error: "Failed to get redemption codes" },
      { status: 500 }
    )
  }
}

// ============================================
// POST - 创建兑换码
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
    const { plan, count, duration, maxUses, expiresAt } = body

    if (!plan || !count) {
      return NextResponse.json(
        { error: "Plan and count are required", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    // 验证 plan
    const validPlans: ScriptMembershipPlan[] = ["FREE", "ENTRY", "VIP", "PRO"]
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    // 生成兑换码
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
      const code = generateCode()

      await prisma.scriptRedemptionCode.create({
        data: {
          code,
          plan,
          duration: duration || 30,
          maxUses: maxUses || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          status: "ACTIVE",
        },
      })

      codes.push(code)
    }

    return NextResponse.json({
      success: true,
      codes,
      message: `Created ${count} redemption codes`,
    })
  } catch (error) {
    console.error("Failed to create redemption codes:", error)
    return NextResponse.json(
      { error: "Failed to create redemption codes" },
      { status: 500 }
    )
  }
}

// ============================================
// 辅助函数
// ============================================

/** 生成随机兑换码 */
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  // 格式: XXXX-XXXX-XXXX
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += "-"
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return code
}
