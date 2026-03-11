import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ message: "获取项目列表失败" }, { status: 500 })
  }
}

// 创建项目
const createProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字"),
  description: z.string().max(500, "描述最多500字").optional(),
  genre: z.string().optional(),
  novelLength: z.enum(["micro", "short", "medium", "long"]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, genre, novelLength } = createProjectSchema.parse(body)

    // 检查项目数量限制
    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    })

    const projectCount = await prisma.project.count({
      where: { userId: session.user.id },
    })

    const maxProjects =
      membership?.plan === "FREE"
        ? 1
        : membership?.plan === "VIP"
        ? 10
        : Infinity

    if (projectCount >= maxProjects) {
      return NextResponse.json(
        { message: "已达项目数量上限，请升级会员" },
        { status: 400 }
      )
    }

    // 创建项目
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title,
        description: description || null,
        genre: genre || null,
        novelLength: novelLength || null,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("Create project error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "创建项目失败" }, { status: 500 })
  }
}
