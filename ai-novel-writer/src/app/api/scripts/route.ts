import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { SCRIPT_MEMBERSHIP_QUOTAS, ScriptErrorCode } from "@/lib/script/types"

// 获取剧本项目列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { message: "未登录", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    }

    const [projects, total] = await Promise.all([
      prisma.scriptProject.findMany({
        where,
        include: {
          _count: {
            select: {
              sources: true,
              characters: true,
              scenes: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.scriptProject.count({ where }),
    ])

    return NextResponse.json({
      projects,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error("Get script projects error:", error)
    return NextResponse.json(
      { message: "获取剧本列表失败" },
      { status: 500 }
    )
  }
}

// 创建剧本项目
const createScriptProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字"),
  description: z.string().max(500, "描述最多500字").optional(),
  sourceType: z.enum(["OWN_PROJECT", "EXTERNAL", "PASTE", "ORIGINAL"]).default("ORIGINAL"),
  sourceProjectId: z.string().optional(),
  sourceNovelTitle: z.string().max(100).optional(),
  genre: z.string().max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { message: "未登录", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createScriptProjectSchema.parse(body)

    // 获取或创建剧本会员
    let membership = await prisma.scriptMembership.findUnique({
      where: { userId: session.user.id },
    })

    if (!membership) {
      membership = await prisma.scriptMembership.create({
        data: { userId: session.user.id },
      })
    }

    // 检查项目数量限制
    const projectCount = await prisma.scriptProject.count({
      where: { userId: session.user.id },
    })

    const quota = SCRIPT_MEMBERSHIP_QUOTAS[membership.plan as keyof typeof SCRIPT_MEMBERSHIP_QUOTAS] || SCRIPT_MEMBERSHIP_QUOTAS.FREE

    if (projectCount >= quota.maxProjects) {
      return NextResponse.json(
        {
          message: "已达剧本项目数量上限，请升级会员",
          code: ScriptErrorCode.QUOTA_PROJECTS_EXCEEDED,
        },
        { status: 400 }
      )
    }

    // 如果来自自有项目，验证源项目存在
    if (data.sourceType === "OWN_PROJECT" && data.sourceProjectId) {
      const sourceProject = await prisma.project.findFirst({
        where: {
          id: data.sourceProjectId,
          userId: session.user.id,
        },
      })

      if (!sourceProject) {
        return NextResponse.json(
          { message: "源项目不存在" },
          { status: 404 }
        )
      }

      // 自动填充来源小说标题
      if (!data.sourceNovelTitle) {
        data.sourceNovelTitle = sourceProject.title
      }
    }

    // 创建剧本项目
    const project = await prisma.scriptProject.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description || null,
        sourceType: data.sourceType,
        sourceProjectId: data.sourceProjectId || null,
        sourceNovelTitle: data.sourceNovelTitle || null,
        genre: data.genre || null,
        status: "draft",
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("Create script project error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>
      return NextResponse.json(
        { message: zodError.issues[0]?.message || "参数错误", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "创建剧本项目失败" },
      { status: 500 }
    )
  }
}
