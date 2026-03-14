import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeCompletion } from "@/lib/ai/deepseek"

// 获取项目完结分析
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id: projectId } = await params

    // 获取项目信息
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        genre: true,
        novelLength: true,
        status: true,
        targetWords: true,
        targetChapters: true,
        chapters: {
          orderBy: { order: "desc" },
          take: 1,
          select: {
            title: true,
            content: true,
            wordCount: true,
          },
        },
          _count: {
            select: { chapters: true },
          },
      },
    })

    if (!project) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 计算总字数
    const chapters = await prisma.chapter.findMany({
      where: { projectId },
      select: { wordCount: true },
    })
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    const totalChapterCount = chapters.length

    // 获取最后一章
    const lastChapter = project.chapters[0]

    // AI 分析完结状态
    const analysis = await analyzeCompletion({
      title: project.title,
      description: project.description,
      genre: project.genre,
      novelLength: project.novelLength,
      currentWordCount: totalWordCount,
      currentChapterCount: totalChapterCount,
      lastChapterTitle: lastChapter?.title,
      lastChapterContent: lastChapter?.content || undefined,
      targetWords: project.targetWords,
      targetChapters: project.targetChapters,
    })

    return NextResponse.json({
      status: project.status,
      totalWordCount,
      totalChapterCount,
      analysis,
    })
  } catch (error) {
    console.error("[Completion Analysis] Error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "分析失败" },
      { status: 500 }
    )
  }
}

// 更新项目状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await request.json()
    const { status, targetWords, targetChapters } = body

    // 验证状态值
    const validStatuses = ["draft", "writing", "completed"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ message: "无效的状态值" }, { status: 400 })
    }

    // 检查项目是否存在
    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    })

    if (!existingProject) {
      return NextResponse.json({ message: "项目不存在" }, { status: 404 })
    }

    // 更新项目
    const updateData: {
      status?: string
      targetWords?: number | null
      targetChapters?: number | null
      completedAt?: Date | null
    } = {}

    if (status) {
      updateData.status = status
      // 如果标记为完结，设置完结时间
      if (status === "completed") {
        updateData.completedAt = new Date()
      } else {
        // 如果改为非完结状态，清除完结时间
        updateData.completedAt = null
      }
    }

    if (targetWords !== undefined) {
      updateData.targetWords = targetWords ? parseInt(String(targetWords)) : null
    }

    if (targetChapters !== undefined) {
      updateData.targetChapters = targetChapters ? parseInt(String(targetChapters)) : null
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("[Project Status Update] Error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "更新失败" },
      { status: 500 }
    )
  }
}
