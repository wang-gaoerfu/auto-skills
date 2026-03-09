import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取会员状态
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json({
        membership: {
          plan: "FREE",
          status: "APPROVED",
          expiresAt: null,
        },
      })
    }

    // 检查是否过期
    let status = membership.status
    if (membership.expiresAt && new Date() > membership.expiresAt) {
      status = "EXPIRED"
      // 更新数据库
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "EXPIRED" },
      })
    }

    return NextResponse.json({
      membership: {
        plan: membership.plan,
        status,
        expiresAt: membership.expiresAt,
        appliedAt: membership.appliedAt,
        approvedAt: membership.approvedAt,
      },
    })
  } catch (error) {
    console.error("Get membership error:", error)
    return NextResponse.json({ message: "获取会员信息失败" }, { status: 500 })
  }
}
