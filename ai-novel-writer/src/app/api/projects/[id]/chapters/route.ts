import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 获取章节列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id } = await params

    // 检查项目权限
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    const chapters = await prisma.chapter.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ chapters })
  } catch (error) {
    console.error("Get chapters error:", error)
    return NextResponse.json({ message: "获取章节失败" }, { status: 500 })
  }
}

// 创建章节
const createChapterSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200),
  content: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content } = createChapterSchema.parse(body)

    // 检查项目权限
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 获取最大顺序
    const maxOrder = await prisma.chapter.aggregate({
      where: { projectId: id },
      _max: { order: true },
    })

    const nextOrder = (maxOrder._max.order || 0) + 1

    // 计算字数
    const wordCount = content ? content.replace(/\s/g, "").length : 0

    // 创建章节
    const chapter = await prisma.chapter.create({
      data: {
        projectId: id,
        title,
        content: content || "",
        order: nextOrder,
        wordCount,
      },
    })

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (error) {
    console.error("Create chapter error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "创建章节失败" }, { status: 500 })
  }
}
