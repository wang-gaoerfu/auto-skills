import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ScriptErrorCode, SCRIPT_MEMBERSHIP_QUOTAS } from "@/lib/script/types"

// ============================================
// 导入内容请求 Schema
// ============================================

const importFromProjectSchema = z.object({
  method: z.literal("OWN_PROJECT"),
  sourceProjectId: z.string().min(1),
  chapterIds: z.array(z.string()).optional(), // 不传则导入全部
})

const importFromUploadSchema = z.object({
  method: z.literal("EXTERNAL"),
  files: z.array(z.object({
    name: z.string(),
    content: z.string(), // Base64 encoded or plain text
  })),
})

const importFromPasteSchema = z.object({
  method: z.literal("PASTE"),
  chapters: z.array(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  })),
})

const importOriginalSchema = z.object({
  method: z.literal("ORIGINAL"),
})

const importRequestSchema = z.discriminatedUnion("method", [
  importFromProjectSchema,
  importFromUploadSchema,
  importFromPasteSchema,
  importOriginalSchema,
])

// ============================================
// 辅助函数
// ============================================

/** 统计字数 */
function countWords(text: string): number {
  // 中文字符
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文单词
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}

// ============================================
// 导入处理函数
// ============================================

/** 从自有项目导入 */
async function importFromProject(
  userId: string,
  scriptProjectId: string,
  data: z.infer<typeof importFromProjectSchema>
) {
  // 获取源项目
  const sourceProject = await prisma.project.findFirst({
    where: {
      id: data.sourceProjectId,
      userId,
    },
    include: {
      chapters: {
        where: data.chapterIds
          ? { id: { in: data.chapterIds } }
          : undefined,
        orderBy: { order: "asc" },
      },
    },
  })

  if (!sourceProject) {
    return NextResponse.json(
      { message: "源项目不存在", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 404 }
    )
  }

  if (sourceProject.chapters.length === 0) {
    return NextResponse.json(
      { message: "源项目没有章节内容", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 400 }
    )
  }

  // 检查章节数限制
  const membership = await prisma.scriptMembership.findUnique({
    where: { userId },
  })

  const quota = SCRIPT_MEMBERSHIP_QUOTAS[membership?.plan as keyof typeof SCRIPT_MEMBERSHIP_QUOTAS] || SCRIPT_MEMBERSHIP_QUOTAS.FREE

  // 获取现有章节数
  const existingSources = await prisma.scriptSource.count({
    where: { scriptProjectId },
  })

  if (existingSources + sourceProject.chapters.length > quota.maxChaptersPerProject) {
    return NextResponse.json(
      {
        message: `超过章节数量限制（${quota.maxChaptersPerProject}章/项目）`,
        code: ScriptErrorCode.QUOTA_CHAPTERS_EXCEEDED,
      },
      { status: 400 }
    )
  }

  // 导入章节
  const sources = await prisma.$transaction(
    sourceProject.chapters.map((chapter, index) =>
      prisma.scriptSource.create({
        data: {
          scriptProjectId,
          sourceChapterId: chapter.id,
          chapterTitle: chapter.title || `第${index + 1}章`,
          content: chapter.content || "",
          wordCount: countWords(chapter.content || ""),
          order: existingSources + index + 1,
        },
      })
    )
  )

  // 更新剧本项目
  await prisma.scriptProject.update({
    where: { id: scriptProjectId },
    data: {
      sourceNovelTitle: sourceProject.title,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    imported: sources.length,
    sources,
  })
}

/** 从上传文件导入 */
async function importFromUpload(
  userId: string,
  scriptProjectId: string,
  data: z.infer<typeof importFromUploadSchema>
) {
  // 检查章节数限制
  const membership = await prisma.scriptMembership.findUnique({
    where: { userId },
  })

  const quota = SCRIPT_MEMBERSHIP_QUOTAS[membership?.plan as keyof typeof SCRIPT_MEMBERSHIP_QUOTAS] || SCRIPT_MEMBERSHIP_QUOTAS.FREE

  const existingSources = await prisma.scriptSource.count({
    where: { scriptProjectId },
  })

  if (existingSources + data.files.length > quota.maxChaptersPerProject) {
    return NextResponse.json(
      {
        message: `超过章节数量限制（${quota.maxChaptersPerProject}章/项目）`,
        code: ScriptErrorCode.QUOTA_CHAPTERS_EXCEEDED,
      },
      { status: 400 }
    )
  }

  // 处理上传的文件
  const sources = []

  for (let i = 0; i < data.files.length; i++) {
    const file = data.files[i]
    const content = file.content
    const wordCount = countWords(content)

    const source = await prisma.scriptSource.create({
      data: {
        scriptProjectId,
        chapterTitle: file.name || `第${existingSources + i + 1}章`,
        content,
        wordCount,
        order: existingSources + i + 1,
      },
    })

    sources.push(source)
  }

  await prisma.scriptProject.update({
    where: { id: scriptProjectId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    imported: sources.length,
    sources,
  })
}

/** 从粘贴文本导入 */
async function importFromPaste(
  userId: string,
  scriptProjectId: string,
  data: z.infer<typeof importFromPasteSchema>
) {
  // 检查章节数限制
  const membership = await prisma.scriptMembership.findUnique({
    where: { userId },
  })

  const quota = SCRIPT_MEMBERSHIP_QUOTAS[membership?.plan as keyof typeof SCRIPT_MEMBERSHIP_QUOTAS] || SCRIPT_MEMBERSHIP_QUOTAS.FREE

  const existingSources = await prisma.scriptSource.count({
    where: { scriptProjectId },
  })

  if (existingSources + data.chapters.length > quota.maxChaptersPerProject) {
    return NextResponse.json(
      {
        message: `超过章节数量限制（${quota.maxChaptersPerProject}章/项目）`,
        code: ScriptErrorCode.QUOTA_CHAPTERS_EXCEEDED,
      },
      { status: 400 }
    )
  }

  // 创建章节
  const sources = await prisma.$transaction(
    data.chapters.map((chapter, index) =>
      prisma.scriptSource.create({
        data: {
          scriptProjectId,
          chapterTitle: chapter.title,
          content: chapter.content,
          wordCount: countWords(chapter.content),
          order: existingSources + index + 1,
        },
      })
    )
  )

  await prisma.scriptProject.update({
    where: { id: scriptProjectId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    imported: sources.length,
    sources,
  })
}

/** 原创创作（空项目） */
async function importOriginal(
  _userId: string,
  _scriptProjectId: string,
) {
  // 原创创作不需要导入内容，直接返回成功
  return NextResponse.json({
    success: true,
    imported: 0,
    sources: [],
  })
}

// ============================================
// API 路由
// ============================================

export async function POST(
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

    const { id: scriptProjectId } = await params

    // 验证剧本项目存在
    const scriptProject = await prisma.scriptProject.findFirst({
      where: {
        id: scriptProjectId,
        userId: session.user.id,
      },
    })

    if (!scriptProject) {
      return NextResponse.json(
        { message: "剧本项目不存在", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 不允许在生成中导入
    if (scriptProject.status === "generating") {
      return NextResponse.json(
        { message: "项目正在生成中，无法导入", code: ScriptErrorCode.GENERATION_IN_PROGRESS },
        { status: 400 }
      )
    }

    // 解析请求
    const body = await request.json()
    const data = importRequestSchema.parse(body)

    // 根据导入方式处理
    switch (data.method) {
      case "OWN_PROJECT":
        return await importFromProject(session.user.id, scriptProjectId, data)

      case "EXTERNAL":
        return await importFromUpload(session.user.id, scriptProjectId, data)

      case "PASTE":
        return await importFromPaste(session.user.id, scriptProjectId, data)

      case "ORIGINAL":
        return await importOriginal(session.user.id, scriptProjectId)

      default:
        return NextResponse.json(
          { message: "不支持的导入方式", code: ScriptErrorCode.INVALID_PARAMS },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Import script content error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "导入内容失败" },
      { status: 500 }
    )
  }
}

// 获取可导入的自有项目列表
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

    const { id: scriptProjectId } = await params

    // 获取当前剧本项目
    const scriptProject = await prisma.scriptProject.findFirst({
      where: {
        id: scriptProjectId,
        userId: session.user.id,
      },
    })

    if (!scriptProject) {
      return NextResponse.json(
        { message: "剧本项目不存在", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 获取用户的所有小说项目
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // 获取已导入的章节
    const existingSources = await prisma.scriptSource.findMany({
      where: {
        scriptProjectId,
        sourceChapterId: { not: null },
      },
      select: { sourceChapterId: true },
    })

    const importedChapterIds = existingSources
      .map(s => s.sourceChapterId)
      .filter(Boolean)

    return NextResponse.json({
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        chapterCount: p._count.chapters,
        updatedAt: p.updatedAt,
        importedChapterCount: importedChapterIds.length,
      })),
    })
  } catch (error) {
    console.error("Get importable projects error:", error)
    return NextResponse.json(
      { message: "获取可导入项目失败" },
      { status: 500 }
    )
  }
}
