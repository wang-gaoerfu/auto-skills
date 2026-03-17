import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ScriptErrorCode } from "@/lib/script/types"

// 获取单个剧本项目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { message: "未登录", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params

    const project = await prisma.scriptProject.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sources: {
          orderBy: { order: "asc" },
        },
        characters: {
          orderBy: { createdAt: "asc" },
        },
        scenes: {
          include: {
            _count: {
              select: { shots: true },
            },
            shots: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                shotNumber: true,
                shotType: true,
                angle: true,
                duration: true,
                visual: true,
                audio: true,
                status: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        generationTasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            sources: true,
            characters: true,
            scenes: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: "剧本项目不存在", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 计算总镜头数
    const totalShots = await prisma.scriptShot.count({
      where: {
        scene: {
          scriptProjectId: id,
        },
      },
    })

    return NextResponse.json({
      project: {
        ...project,
        totalShots,
      },
    })
  } catch (error) {
    console.error("Get script project error:", error)
    return NextResponse.json(
      { message: "获取剧本项目失败" },
      { status: 500 }
    )
  }
}

// 更新剧本项目
const updateScriptProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  settings: z.any().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { message: "未登录", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const data = updateScriptProjectSchema.parse(body)

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.scriptProject.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { message: "剧本项目不存在", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 不允许更新正在生成中的项目
    if (existingProject.status === "generating") {
      return NextResponse.json(
        { message: "项目正在生成中，无法修改", code: ScriptErrorCode.GENERATION_IN_PROGRESS },
        { status: 400 }
      )
    }

    // 更新项目
    const project = await prisma.scriptProject.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Update script project error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "更新剧本项目失败" },
      { status: 500 }
    )
  }
}

// 删除剧本项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { message: "未登录", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.scriptProject.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { message: "剧本项目不存在", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 不允许删除正在生成中的项目
    if (existingProject.status === "generating") {
      return NextResponse.json(
        { message: "项目正在生成中，请先暂停或等待完成", code: ScriptErrorCode.GENERATION_IN_PROGRESS },
        { status: 400 }
      )
    }

    // 删除项目（会级联删除相关数据）
    await prisma.scriptProject.delete({
      where: { id },
    })

    return NextResponse.json({ message: "删除成功" })
  } catch (error) {
    console.error("Delete script project error:", error)
    return NextResponse.json(
      { message: "删除剧本项目失败" },
      { status: 500 }
    )
  }
}
