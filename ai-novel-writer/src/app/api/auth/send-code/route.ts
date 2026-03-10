import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateCode, sendVerificationCode } from "@/lib/email"
import { saveVerificationCode, canResendCode, setResendLimit } from "@/lib/verification"

const emailSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = emailSchema.parse(body)

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

    // 检查是否可以重发
    if (!canResendCode(email)) {
      return NextResponse.json(
        { message: "请稍后再试" },
        { status: 429 }
      )
    }

    // 生成验证码
    const code = generateCode()

    // 保存验证码
    saveVerificationCode(email, code)
    setResendLimit(email)

    // 发送邮件
    await sendVerificationCode(email, code)

    return NextResponse.json({
      message: "验证码已发送",
    })
  } catch (error) {
    console.error("Send code error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "发送验证码失败" },
      { status: 500 }
    )
  }
}
