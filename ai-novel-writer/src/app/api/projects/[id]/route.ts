import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 获取单个项目
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

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { chapters: true, knowledge: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ message: "获取项目失败" }, { status: 500 })
  }
}

// 更新项目
const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  outline: z.any().optional(),
  settings: z.any().optional(),
})

export async function PUT(
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
    const data = updateProjectSchema.parse(body)

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingProject) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 更新项目
    const project = await prisma.project.update({
      where: { id },
      data,
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Update project error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "更新项目失败" }, { status: 500 })
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id } = await params

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingProject) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 删除项目（会级联删除章节和知识库）
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ message: "删除项目失败" }, { status: 500 })
  }
}
