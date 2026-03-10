import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { verifyCode } from "@/lib/verification"
import { sendWelcomeEmail } from "@/lib/email"

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
  code: z.string().length(6, "验证码必须是6位"),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, code, name } = registerSchema.parse(body)

    // 验证验证码
    if (!verifyCode(email, code)) {
      return NextResponse.json(
        { message: "验证码错误或已过期" },
        { status: 400 }
      )
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "该邮箱已被注册" },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    })

    // 创建默认会员（FREE）
    await prisma.membership.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "APPROVED",
      },
    })

    // 发送欢迎邮件（异步，不等待）
    sendWelcomeEmail(email, name || undefined).catch(console.error)

    return NextResponse.json({
      message: "注册成功",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Register error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "注册失败" },
      { status: 500 }
    )
  }
}
