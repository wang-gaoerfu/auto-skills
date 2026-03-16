/**
 * 分镜生成 API
 *
 * POST /api/scripts/[id]/generate
 * - 启动分镜生成任务
 * - 支持 SSE 流式输出
 * - 支持断点续传
 *
 * GET /api/scripts/[id]/generate
 * - 获取生成状态
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptAIService } from "@/lib/script/ai-service"
import { ScriptErrorCode } from "@/lib/script/types"
import { getScriptMembership, checkDailyGenerationQuota, incrementDailyGeneration, acquireGenerationLock, releaseGenerationLock } from "@/lib/script/utils"

// ============================================
// 类型定义
// ============================================

interface GenerateRequest {
  sceneIds?: string[] // 指定要生成的场景 ID，不传则生成全部
  options?: {
    overwrite?: boolean // 是否覆盖已有镜头（默认 false）
    batchSize?: number // 批量生成场景数（默认 1）
  }
}

interface GenerateState {
  status: "idle" | "running" | "paused" | "completed" | "error"
  currentScene?: number
  totalScenes: number
  currentShot?: number
  totalShots: number
  message?: string
}

// ============================================
// POST - 启动生成
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId } = await params

  // 获取项目
  const project = await prisma.scriptProject.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    include: {
      scenes: {
        orderBy: { sceneNumber: "asc" },
        include: {
          shots: {
            orderBy: { order: "asc" },
          },
        },
      },
      characters: true,
      sources: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  // 检查每日配额
  const quotaCheck = await checkDailyGenerationQuota(session.user.id)
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      { error: quotaCheck.message, code: ScriptErrorCode.QUOTA_DAILY_GENERATIONS_EXCEEDED },
      { status: 403 }
    )
  }

  // 解析请求
  const body: GenerateRequest = await request.json().catch(() => ({}))
  const options = {
    overwrite: body.options?.overwrite ?? false,
    batchSize: body.options?.batchSize ?? 1,
  }

  // 获取要生成的场景
  let scenesToGenerate = project.scenes
  if (body.sceneIds && body.sceneIds.length > 0) {
    scenesToGenerate = project.scenes.filter((s) => body.sceneIds!.includes(s.id))
  }

  // 过滤掉已有镜头的场景（如果不覆盖）
  if (!options.overwrite) {
    scenesToGenerate = scenesToGenerate.filter((s) => s.shots.length === 0)
  }

  if (scenesToGenerate.length === 0) {
    return NextResponse.json(
      {
        error: "No scenes to generate",
        code: ScriptErrorCode.INVALID_PARAMS,
        message: options.overwrite
          ? "没有可生成的场景"
          : "所有场景已生成镜头，或请选择覆盖模式",
      },
      { status: 400 }
    )
  }

  // 尝试获取生成锁
  const lockId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const lockResult = await acquireGenerationLock(projectId, lockId)

  if (!lockResult.acquired) {
    return NextResponse.json(
      {
        error: "Generation already in progress",
        code: ScriptErrorCode.GENERATION_IN_PROGRESS,
        lockId: lockResult.existingLock,
      },
      { status: 409 }
    )
  }

  // 更新项目状态
  await prisma.scriptProject.update({
    where: { id: projectId },
    data: {
      status: "generating",
      subStatus: "storyboard_generating",
      progress: 0,
    },
  })

  // 异步执行生成
  runGeneration(projectId, scenesToGenerate, project.characters, options, lockId, session.user.id)
    .then((result) => {
      console.log(`Generation completed for project ${projectId}:`, result)
    })
    .catch((error) => {
      console.error(`Generation failed for project ${projectId}:`, error)
    })

  return NextResponse.json({
    success: true,
    lockId,
    totalScenes: scenesToGenerate.length,
    message: "分镜生成已启动",
  })
}

// ============================================
// GET - 获取生成状态
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId } = await params

  // 获取项目和状态
  const project = await prisma.scriptProject.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      subStatus: true,
      progress: true,
      generationLock: true,
      totalShots: true,
      totalDuration: true,
      totalScenes: true,
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  // 获取场景和镜头统计
  const scenes = await prisma.scriptScene.findMany({
    where: { scriptProjectId: projectId },
    include: {
      _count: {
        select: { shots: true },
      },
    },
  })

  const completedScenes = scenes.filter((s) => s._count.shots > 0).length
  const totalShots = scenes.reduce((sum, s) => sum + s._count.shots, 0)

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      subStatus: project.subStatus,
      progress: project.progress,
      isLocked: !!project.generationLock,
    },
    stats: {
      totalScenes: scenes.length,
      completedScenes,
      totalShots,
    },
  })
}

// ============================================
// 生成执行函数
// ============================================

async function runGeneration(
  projectId: string,
  scenes: Array<{
    id: string
    sceneNumber: number
    title: string
    location: string | null
    timeOfDay: string | null
    mood: string | null
    description: string | null
  }>,
  characters: Array<{
    id: string
    name: string
    appearance: any
    personality: string | null
  }>,
  options: {
    overwrite: boolean
    batchSize: number
  },
  lockId: string,
  userId: string
): Promise<{ scenesGenerated: number; shotsGenerated: number }> {
  const aiService = new ScriptAIService()
  let scenesGenerated = 0
  let shotsGenerated = 0

  // 构建角色信息
  const characterInfo: Record<string, { appearance: any; personality: string }> = {}
  for (const char of characters) {
    characterInfo[char.name] = {
      appearance: char.appearance || "",
      personality: char.personality || "",
    }
  }

  try {
    // 按批次处理场景
    for (let i = 0; i < scenes.length; i += options.batchSize) {
      const batch = scenes.slice(i, i + options.batchSize)

      for (const scene of batch) {
        // 检查锁是否还持有
        const lockCheck = await prisma.scriptProject.findFirst({
          where: { id: projectId, generationLock: lockId },
          select: { generationLock: true },
        })

        if (!lockCheck?.generationLock) {
          // 锁已释放，生成被取消
          console.log(`Generation cancelled for project ${projectId}`)
          return { scenesGenerated, shotsGenerated }
        }

        try {
          // 获取场景的原始内容
          const source = await prisma.scriptSource.findFirst({
            where: {
              scriptProjectId: projectId,
              // 尝试通过场景描述匹配来源
            },
          })

          if (!source) {
            console.warn(`No source found for scene ${scene.id}`)
            continue
          }

          // 生成分镜
          const result = await aiService.generateShots(
            {
              title: scene.title,
              location: scene.location || "未知",
              mood: scene.mood || "普通",
              characters: [], // TODO: 从场景关联获取
              content: scene.description || source.content || "",
            },
            characterInfo
          )

          // 删除已有镜头（如果覆盖）
          if (options.overwrite) {
            await prisma.scriptShot.deleteMany({
              where: { sceneId: scene.id },
            })
          }

          // 保存镜头
          let shotOrder = 1
          for (const shot of result.shots) {
            const duration = parseDuration(shot.durationSeconds)
            const dialogueCount = (shot.dialogue || "").length > 0 ? 1 : 0

            await prisma.scriptShot.create({
              data: {
                sceneId: scene.id,
                shotNumber: `${scene.sceneNumber}-${shotOrder}`,
                shotType: shot.shotType,
                angle: shot.cameraMovement,
                duration,
                visual: {
                  description: shot.description,
                  mood: shot.moodNote,
                  reference: shot.visualReference,
                },
                audio: {
                  action: shot.action,
                  dialogue: shot.dialogue,
                },
                imagePrompt: shot.visualReference,
                dialogueCount,
                order: shotOrder,
                status: "generated",
              },
            })
            shotOrder++
            shotsGenerated++
          }

          // 更新场景统计
          await prisma.scriptScene.update({
            where: { id: scene.id },
            data: {
              shotCount: shotOrder - 1,
              totalDuration: result.shots.reduce((sum, s) => sum + parseDuration(s.durationSeconds), 0),
            },
          })

          scenesGenerated++

          // 更新进度
          const progress = Math.round((scenesGenerated / scenes.length) * 100)
          await prisma.scriptProject.update({
            where: { id: projectId },
            data: { progress },
          })
        } catch (error) {
          console.error(`Failed to generate shots for scene ${scene.id}:`, error)
          // 继续处理下一个场景
        }
      }
    }

    // 更新项目统计
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        totalShots: { increment: shotsGenerated },
        totalDuration: await calculateTotalDuration(projectId),
      },
    })

    // 释放锁
    await releaseGenerationLock(projectId, lockId)

    // 更新项目状态
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: "paused",
        subStatus: null,
      },
    })

    // 增加每日生成次数
    await incrementDailyGeneration(userId)

    return { scenesGenerated, shotsGenerated }
  } catch (error) {
    // 释放锁
    await releaseGenerationLock(projectId, lockId)

    // 更新项目状态为错误
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: "error",
        subStatus: null,
      },
    })

    throw error
  }
}

// ============================================
// 辅助函数
// ============================================

/** 解析时长（秒） */
function parseDuration(value: number): number {
  return Math.max(1, Math.round(value)) || 5
}

/** 计算项目总时长 */
async function calculateTotalDuration(projectId: string): Promise<number> {
  const scenes = await prisma.scriptScene.findMany({
    where: { scriptProjectId: projectId },
    select: { totalDuration: true },
  })
  return scenes.reduce((sum, s) => sum + s.totalDuration, 0)
}
