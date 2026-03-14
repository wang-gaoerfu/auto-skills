import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 获取单个章节
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id, chapterId } = await params

    // 检查项目权限
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!chapter) {
      return NextResponse.json({ message: "章节不存在" }, { status: 404 })
    }

    return NextResponse.json({ chapter })
  } catch (error) {
    console.error("Get chapter error:", error)
    return NextResponse.json({ message: "获取章节失败" }, { status: 500 })
  }
}

// 更新章节
const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id, chapterId } = await params
    const body = await request.json()
    const data = updateChapterSchema.parse(body)

    // 检查项目权限
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 检查章节是否存在
    const existingChapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!existingChapter) {
      return NextResponse.json({ message: "章节不存在" }, { status: 404 })
    }

    // 计算字数
    const wordCount = data.content
      ? data.content.replace(/\s/g, "").length
      : existingChapter.wordCount

    // 使用事务同时更新章节和项目的更新时间
    const [chapter] = await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapterId },
        data: {
          ...data,
          wordCount,
        },
      }),
      // 同时更新项目的 updatedAt 时间
      prisma.project.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ])

    return NextResponse.json({ chapter })
  } catch (error) {
    console.error("Update chapter error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "更新章节失败" }, { status: 500 })
  }
}

// 删除章节
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id, chapterId } = await params

    // 检查项目权限
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 检查章节是否存在
    const existingChapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId: id },
    })

    if (!existingChapter) {
      return NextResponse.json({ message: "章节不存在" }, { status: 404 })
    }

    // 删除章节
    await prisma.chapter.delete({
      where: { id: chapterId },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("Delete chapter error:", error)
    return NextResponse.json({ message: "删除章节失败" }, { status: 500 })
  }
}
