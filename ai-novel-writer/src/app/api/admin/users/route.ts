/**
 * 超级管理员 - 用户管理 API
 *
 * GET: 获取所有用户列表
 * PATCH: 更新用户会员等级
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 验证超级管理员权限
async function checkSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === "SUPER_ADMIN"
}

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // 检查超级管理员权限
    const isSuperAdmin = await checkSuperAdmin(session.user.id)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    // 获取所有用户及其会员信息
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        // 小说会员
        membership: {
          select: {
            plan: true,
            status: true,
            expiresAt: true,
          },
        },
        // 剧本会员
        scriptMembership: {
          select: {
            plan: true,
            status: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

// 更新用户会员等级的验证
const updateMembershipSchema = z.object({
  userId: z.string(),
  // 小说系统会员
  novelPlan: z.enum(["FREE", "VIP", "PRO"]).optional(),
  novelExpiresAt: z.string().optional().nullable(),
  // 剧本系统会员
  scriptPlan: z.enum(["FREE", "ENTRY", "VIP", "PRO"]).optional(),
  scriptExpiresAt: z.string().optional().nullable(),
})

// 更新用户会员等级
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // 检查超级管理员权限
    const isSuperAdmin = await checkSuperAdmin(session.user.id)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, novelPlan, novelExpiresAt, scriptPlan, scriptExpiresAt } = updateMembershipSchema.parse(body)

    // 更新小说系统会员
    if (novelPlan !== undefined) {
      const existingMembership = await prisma.membership.findUnique({
        where: { userId },
      })

      if (existingMembership) {
        await prisma.membership.update({
          where: { userId },
          data: {
            plan: novelPlan,
            status: "APPROVED",
            expiresAt: novelExpiresAt ? new Date(novelExpiresAt) : null,
            approvedAt: new Date(),
            approvedBy: session.user.id,
          },
        })
      } else {
        await prisma.membership.create({
          data: {
            userId,
            plan: novelPlan,
            status: "APPROVED",
            expiresAt: novelExpiresAt ? new Date(novelExpiresAt) : null,
            approvedAt: new Date(),
            approvedBy: session.user.id,
          },
        })
      }
    }

    // 更新剧本系统会员
    if (scriptPlan !== undefined) {
      const existingScriptMembership = await prisma.scriptMembership.findUnique({
        where: { userId },
      })

      if (existingScriptMembership) {
        await prisma.scriptMembership.update({
          where: { userId },
          data: {
            plan: scriptPlan,
            status: "ACTIVE",
            expiresAt: scriptExpiresAt ? new Date(scriptExpiresAt) : null,
          },
        })
      } else {
        await prisma.scriptMembership.create({
          data: {
            userId,
            plan: scriptPlan,
            status: "ACTIVE",
            expiresAt: scriptExpiresAt ? new Date(scriptExpiresAt) : null,
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: "会员等级更新成功" })
  } catch (error) {
    console.error("Update membership error:", error)
    return NextResponse.json({ error: "更新会员等级失败" }, { status: 500 })
  }
}
