/**
 * 弧本分析 API
 *
 * POST /api/scripts/[id]/analyze
 * - 分析章节内容，提取场景、角色信息
 * - 支持流式输出（SSE)
 *
 * GET / api/scripts/[id]/analyze
 * - 获取分析状态和结果
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptAIService } from "@/lib/script/ai-service"
import { ScriptErrorCode, SCRIPT_MEMBERSHIP_QUOTAS, ScriptMembershipPlan } from "@/lib/script/types"
import { getScriptMembership, getQuota, checkDailyGenerationQuota, incrementDailyGeneration } from "@/lib/script/utils"

interface AnalyzeRequest {
  sourceIds?: string[] // 指定要分析的素材 ID，不传则分析全部
  options?: {
    extractCharacters?: boolean // 是否提取角色（默认 true)
    extractScenes?: boolean // 是否提取场景（默认 true)
    overwrite?: boolean // 是否覆盖已有数据(默认 false)
  }
}

interface SceneAnalysis {
  sceneNumber: number
  title: string
  location: string
  time: string
  mood: string
  characters: string[]
  summary: string
  keyEvents: string[]
}

interface CharacterAnalysis {
  name: string
  role: "protagonist" | "antagonist" | "supporting" | "minor"
  gender: "male" | "female" | "other" | "unknown"
  ageRange: string
  appearance: string
  personality: string
  firstAppearance: string
  keyTraits: string[]
}

// ============================================
// POST - 执行分析
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const paramsData = await params
    const projectId = paramsData.id
    const userId = session.user.id

    // 获取项目
    const project = await prisma.scriptProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        sources: {
          orderBy: { order: "asc" },
        },
        characters: true,
        scenes: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 检查每日生成配额
    const quotaCheck = await checkDailyGenerationQuota(session.user.id)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.message,
          code: ScriptErrorCode.QUOTA_DAILY_GENERATIONS_EXCEEDED,
        },
        { status: 403 }
      )
    }

    // 解析请求体
    const body: AnalyzeRequest = await request.json().catch(() => ({}))
    const options = {
      extractCharacters: body.options?.extractCharacters ?? true,
      extractScenes: body.options?.extractScenes ?? true,
      overwrite: body.options?.overwrite ?? false,
    }

    console.log(`[Analyze] Starting analysis for project ${projectId}`, {
      options,
      sourceCount: project.sources.length,
    })

    // 获取要分析的素材
    let sourcesToAnalyze = project.sources
    if (body.sourceIds && body.sourceIds.length > 0) {
      sourcesToAnalyze = project.sources.filter((s) =>
        body.sourceIds!.includes(s.id)
      )
    }

    console.log(`[Analyze] Sources to analyze: ${sourcesToAnalyze.length}`)

    if (sourcesToAnalyze.length === 0) {
      return NextResponse.json(
        { error: "No sources to analyze", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    // 更新项目状态
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: "generating",
        subStatus: "character_extracting",
      },
    })

    // 创建生成任务
    const task = await prisma.scriptGenerationTask.create({
      data: {
        scriptProjectId: projectId,
        chapterOrder: 0, // 分析任务使用 0
        status: "processing",
        progress: 0,
        startedAt: new Date(),
      },
    })

    // 后台执行分析（不阻塞响应）
    performAnalysisInBackground(projectId, sourcesToAnalyze, options, task.id, userId).catch((error) => {
      console.error(`[Analyze] Background analysis failed:`, error)
      updateTaskStatus(projectId, task.id, "failed", error)
    })

    // 立即返回任务 ID
    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: "分析任务已启动，正在后台处理中",
    })
  } catch (error) {
    console.error("Analyze error:", error)
    return NextResponse.json(
      {
        error: "Analysis failed",
        code: ScriptErrorCode.GENERATION_FAILED,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// ============================================
// 后台分析函数
// ============================================

async function performAnalysisInBackground(
  projectId: string,
  sources: Array<{
    id: string
    chapterTitle: string
    content: string
    order: number
  }>,
  options: {
    extractCharacters: boolean
    extractScenes: boolean
    overwrite: boolean
  },
  taskId: string,
  userId: string
): Promise<void> {
  console.log(`[Analyze] Starting background analysis for project ${projectId}`)

  const aiService = new ScriptAIService()
  const allCharacters: Map<string, CharacterAnalysis> = new Map()
  const allScenes: SceneAnalysis[] = []

  let currentStep = 0
  const totalSteps = sources.length * 2

  for (const source of sources) {
    console.log(`[Analyze] Processing source: ${source.chapterTitle}`)

    // 提取角色
    if (options.extractCharacters) {
      try {
        console.log(`[Analyze] Extracting characters from: ${source.chapterTitle}`)
        const charactersResult = await aiService.extractCharacters(source.content)
        console.log(`[Analyze] Found ${charactersResult.characters.length} characters`)

        for (const character of charactersResult.characters) {
          // 检查是否已存在同名角色
          if (!allCharacters.has(character.name)) {
            allCharacters.set(character.name, character)
          }
        }

        // 更新任务进度
        currentStep++
        await prisma.scriptGenerationTask.update({
          where: { id: taskId },
          data: {
            progress: Math.round((currentStep / totalSteps) * 100),
          },
        })
      } catch (error) {
        console.error(`[Analyze] Failed to extract characters from source ${source.id}:`, error)
      }
    }

    // 提取场景
    if (options.extractScenes) {
      try {
        console.log(`[Analyze] Analyzing scenes from: ${source.chapterTitle}`)
        const scenesResult = await aiService.analyzeChapter(source.chapterTitle, source.content)
        console.log(`[Analyze] Found ${scenesResult.scenes.length} scenes`)

        for (const scene of scenesResult.scenes) {
          allScenes.push({
            ...scene,
            sceneNumber: allScenes.length + 1,
          })
        }

        // 更新任务进度
        currentStep++
        await prisma.scriptGenerationTask.update({
          where: { id: taskId },
          data: {
            progress: Math.round((currentStep / totalSteps) * 100),
          },
        })
      } catch (error) {
        console.error(`[Analyze] Failed to extract scenes from source ${source.id}:`, error)
      }
    }
  }

  console.log(`[Analyze] Total: ${allCharacters.size} characters, ${allScenes.length} scenes`)

  // 保存角色到数据库
  const savedCharacters: any[] = []
  if (options.overwrite) {
    // 删除已有角色
    await prisma.scriptCharacter.deleteMany({
      where: { scriptProjectId: projectId },
    })
  }

  for (const [name, character] of allCharacters) {
    // 检查是否已存在
    const existing = await prisma.scriptCharacter.findFirst({
      where: { scriptProjectId: projectId, name },
    })

    if (existing && !options.overwrite) {
      savedCharacters.push(existing)
      continue
    }

    const saved = await prisma.scriptCharacter.upsert({
      where: { id: existing?.id || "nonexistent" },
      update: {
        role: character.role,
        gender: character.gender,
        ageRange: character.ageRange,
        appearance: character.appearance,
        personality: character.personality,
        // keyTraits: character.keyTraits, // Json field
      },
      create: {
        scriptProjectId: projectId,
        name: character.name,
        role: character.role,
        gender: character.gender,
        ageRange: character.ageRange,
        appearance: character.appearance,
        personality: character.personality,
        shotCount: 0,
      },
    })
    savedCharacters.push(saved)
  }

  // 保存场景到数据库
  const savedScenes: any[] = []
  if (options.overwrite) {
    // 删除已有场景和镜头
    await prisma.scriptShot.deleteMany({
      where: { scene: { scriptProjectId: projectId } },
    })
    await prisma.scriptScene.deleteMany({
      where: { scriptProjectId: projectId },
    })
  }

  for (const scene of allScenes) {
    // 获取场景中的角色 ID
    const characterIds = scene.characters
      .map((name) => {
        const char = savedCharacters.find((c) => c.name === name)
        return char ? { id: char.id } : null
      })
      .filter(Boolean) as { id: string }[]

    const saved = await prisma.scriptScene.create({
      data: {
        scriptProjectId: projectId,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        location: scene.location,
        timeOfDay: scene.time,
        mood: scene.mood,
        description: scene.summary,
        order: scene.sceneNumber,
        // 关联角色
        ...(characterIds.length > 0 && {
          characters: {
            connect: characterIds,
          },
        }),
      },
    })
    savedScenes.push(saved)
  }

  // 更新项目统计
  await prisma.scriptProject.update({
    where: { id: projectId },
    data: {
      totalScenes: savedScenes.length,
    },
  })

  // 更新任务状态为完成
  await updateTaskStatus(projectId, taskId, "completed")
  console.log(`[Analyze] Analysis completed for project ${projectId}`)
}

// ============================================
// 辅助函数
// ============================================

async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: "completed" | "failed",
  error?: any
) {
  try {
    const updateData: any = {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    }

    if (error) {
      updateData.errorMessage = error instanceof Error ? error.message : String(error)
    }

    await prisma.scriptGenerationTask.update({
      where: { id: taskId },
      data: updateData,
    })

    if (status === "completed") {
      // 更新项目状态
      await prisma.scriptProject.update({
        where: { id: projectId },
        data: {
          status: "paused",
          subStatus: null,
          progress: 50,
        },
      })

      // 增加每日生成次数 - 从项目获取用户 ID
      const project = await prisma.scriptProject.findUnique({
        where: { id: projectId },
        select: { userId: true },
      })
      if (project?.userId) {
        await incrementDailyGeneration(project.userId)
      }
    }
  } catch (err) {
    console.error(`[Analyze] Failed to update task status:`, err)
  }
}

// ============================================
// GET - 获取分析状态
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const paramsData = await params
    const projectId = paramsData.id

    // 获取项目和分析结果
    const project = await prisma.scriptProject.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        characters: {
          orderBy: { createdAt: "asc" },
        },
        scenes: {
          orderBy: { sceneNumber: "asc" },
          include: {
            shots: {
              orderBy: { shotNumber: "asc" },
            },
          },
        },
        generationTasks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 获取最新的分析任务
    const latestTask = project.generationTasks[0]

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        subStatus: project.subStatus,
        progress: project.progress,
      },
      analysis: {
        characters: project.characters.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          gender: c.gender,
          ageRange: c.ageRange,
          appearance: c.appearance,
          personality: c.personality,
          shotCount: c.shotCount,
        })),
        scenes: project.scenes.map((s) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          title: s.title,
          location: s.location,
          time: s.timeOfDay,
          mood: s.mood,
          summary: s.description || "",
          shotCount: s.shots.length,
        })),
        task: latestTask
          ? {
            id: latestTask.id,
            status: latestTask.status,
            progress: latestTask.progress,
            error: latestTask.errorMessage,
          }
          : null
      },
    })
  } catch (error) {
    console.error("Get analysis error:", error)
    return NextResponse.json(
      { error: "Failed to get analysis" },
      { status: 500 }
    )
  }
}
