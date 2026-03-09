import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 生成兑换码
const generateSchema = z.object({
  plan: z.enum(["VIP", "PRO"]),
  duration: z.number().int().min(1).max(3650),
  quantity: z.number().int().min(1).max(1000),
  maxUses: z.number().int().min(1).default(1),
  expiresAt: z.string().optional(),
})

// 生成随机兑换码
function generateCodeString(plan: string): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${plan}-${year}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "无权限" }, { status: 403 })
    }

    const body = await request.json()
    const { plan, duration, quantity, maxUses, expiresAt } = generateSchema.parse(body)

    const codes: string[] = []
    const codeRecords = []

    for (let i = 0; i < quantity; i++) {
      let code = generateCodeString(plan)

      // 确保唯一
      while (codes.includes(code)) {
        code = generateCodeString(plan)
      }

      codes.push(code)
      codeRecords.push({
        code,
        plan,
        duration,
        maxUses,
        status: "ACTIVE",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      })
    }

    // 批量创建
    await prisma.redemptionCode.createMany({
      data: codeRecords,
    })

    return NextResponse.json({
      message: `成功生成 ${quantity} 个兑换码`,
      codes,
    })
  } catch (error) {
    console.error("Generate codes error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "生成兑换码失败" }, { status: 500 })
  }
}

// 获取兑换码列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "无权限" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}
    if (status) where.status = status
    if (plan) where.plan = plan

    const [codes, total] = await Promise.all([
      prisma.redemptionCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.redemptionCode.count({ where }),
    ])

    return NextResponse.json({
      codes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get codes error:", error)
    return NextResponse.json({ message: "获取兑换码失败" }, { status: 500 })
  }
}
