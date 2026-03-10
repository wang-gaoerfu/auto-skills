import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const activateSchema = z.object({
  code: z.string().min(1, "请输入兑换码"),
})

// 激活会员
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = activateSchema.parse(body)

    // 查找兑换码
    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code },
    })

    if (!redemptionCode) {
      return NextResponse.json({ message: "兑换码不存在" }, { status: 400 })
    }

    // 检查状态
    if (redemptionCode.status !== "ACTIVE") {
      return NextResponse.json({ message: "兑换码已失效" }, { status: 400 })
    }

    // 检查过期时间
    if (redemptionCode.expiresAt && new Date() > redemptionCode.expiresAt) {
      // 更新状态为过期
      await prisma.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json({ message: "兑换码已过期" }, { status: 400 })
    }

    // 检查使用次数
    if (redemptionCode.usedCount >= redemptionCode.maxUses) {
      return NextResponse.json({ message: "兑换码已用完" }, { status: 400 })
    }

    // 获取当前会员信息
    const currentMembership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    })

    // 计算新的到期时间
    let expiresAt: Date | null = null
    const now = new Date()

    if (redemptionCode.plan !== "FREE") {
      // 如果已有会员且未过期，在原有基础上延长
      if (currentMembership?.expiresAt && new Date(currentMembership.expiresAt) > now) {
        expiresAt = new Date(currentMembership.expiresAt)
        expiresAt.setDate(expiresAt.getDate() + redemptionCode.duration)
      } else {
        expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + redemptionCode.duration)
      }
    }

    // 更新会员信息
    await prisma.membership.upsert({
      where: { userId: session.user.id },
      update: {
        plan: redemptionCode.plan,
        status: "APPROVED",
        expiresAt,
        redemptionCodeId: redemptionCode.id,
        approvedAt: now,
      },
      create: {
        userId: session.user.id,
        plan: redemptionCode.plan,
        status: "APPROVED",
        expiresAt,
        redemptionCodeId: redemptionCode.id,
        approvedAt: now,
      },
    })

    // 更新兑换码使用次数
    await prisma.redemptionCode.update({
      where: { id: redemptionCode.id },
      data: {
        usedCount: { increment: 1 },
      },
    })

    // 如果达到最大使用次数，更新状态
    if (redemptionCode.usedCount + 1 >= redemptionCode.maxUses) {
      await prisma.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: { status: "DISABLED" },
      })
    }

    return NextResponse.json({
      message: "激活成功",
      membership: {
        plan: redemptionCode.plan,
        expiresAt,
      },
    })
  } catch (error) {
    console.error("Activation error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "激活失败" }, { status: 500 })
  }
}
