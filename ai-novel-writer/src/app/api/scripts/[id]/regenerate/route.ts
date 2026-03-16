/**
 * 重新生成 API
 *
 * POST /api/scripts/[id]/regenerate
 * - 重新生成指定镜头
 * - 支持单个镜头或场景全部镜头
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptAIService } from "@/lib/script/ai-service"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// 类型定义
// ============================================

interface RegenerateRequest {
  shotId?: string // 镜头 ID
  sceneId?: string // 场景 ID（重新生成整个场景）
  reason?: string // 重新生成原因（可选）
}

// ============================================
// POST - 重新生成
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
  })

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  // 解析请求
  const body: RegenerateRequest = await request.json().catch(() => ({}))

  if (!body.shotId && !body.sceneId) {
    return NextResponse.json(
      { error: "Must specify shotId or sceneId", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 400 }
    )
  }

  // 重新生成单个镜头
  if (body.shotId) {
    return await regenerateShot(projectId, body.shotId, body.reason)
  }

  // 重新生成整个场景
  if (body.sceneId) {
    return await regenerateScene(projectId, body.sceneId, body.reason)
  }

  return NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  )
}

// ============================================
// 重新生成单个镜头
// ============================================

async function regenerateShot(
  projectId: string,
  shotId: string,
  reason?: string
): Promise<NextResponse> {
  // 获取镜头和场景信息
  const shot = await prisma.scriptShot.findFirst({
    where: { id: shotId },
    include: {
      scene: {
        include: {
          scriptProject: {
            include: {
              characters: true,
            },
          },
        },
      },
    },
  })

  if (!shot || shot.scene.scriptProjectId !== projectId) {
    return NextResponse.json(
      { error: "Shot not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  // 标记为重新生成中
  await prisma.scriptShot.update({
    where: { id: shotId },
    data: { status: "regenerating" },
  })

  try {
    const aiService = new ScriptAIService()

    // 构建角色信息
    const characterInfo: Record<string, { appearance: any; personality: string }> = {}
    for (const char of shot.scene.scriptProject.characters) {
      characterInfo[char.name] = {
        appearance: char.appearance || "",
        personality: char.personality || "",
      }
    }

    // 获取原始内容
    const source = await prisma.scriptSource.findFirst({
      where: { scriptProjectId: projectId },
    })

    // 生成分镜
    const result = await aiService.generateShots(
      {
        title: shot.scene.title,
        location: shot.scene.location || "未知",
        mood: shot.scene.mood || "普通",
        characters: [],
        content: shot.scene.description || source?.content || "",
      },
      characterInfo
    )

    // 找到对应的镜头位置
    const shotIndex = shot.order - 1
    if (shotIndex >= 0 && shotIndex < result.shots.length) {
      const newShot = result.shots[shotIndex]
      const duration = parseDuration(newShot.durationSeconds)
      const dialogueCount = (newShot.dialogue || "").length > 0 ? 1 : 0

      await prisma.scriptShot.update({
        where: { id: shotId },
        data: {
          shotType: newShot.shotType,
          angle: newShot.cameraMovement,
          duration,
          visual: {
            description: newShot.description,
            mood: newShot.moodNote,
            reference: newShot.visualReference,
          },
          audio: {
            action: newShot.action,
            dialogue: newShot.dialogue,
          },
          imagePrompt: newShot.visualReference,
          dialogueCount,
          status: "generated",
          isEdited: false, // 重置编辑标记
          regenerateCount: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      success: true,
      shotId,
      message: "镜头已重新生成",
    })
  } catch (error) {
    console.error(`Failed to regenerate shot ${shotId}:`, error)

    // 标记为失败
    await prisma.scriptShot.update({
      where: { id: shotId },
      data: { status: "failed" },
    })

    return NextResponse.json(
      {
        error: "Failed to regenerate shot",
        code: ScriptErrorCode.GENERATION_FAILED,
      },
      { status: 500 }
    )
  }
}

// ============================================
// 重新生成整个场景
// ============================================

async function regenerateScene(
  projectId: string,
  sceneId: string,
  reason?: string
): Promise<NextResponse> {
  // 获取场景信息
  const scene = await prisma.scriptScene.findFirst({
    where: { id: sceneId },
    include: {
      scriptProject: {
        include: {
          characters: true,
        },
      },
      shots: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!scene || scene.scriptProjectId !== projectId) {
    return NextResponse.json(
      { error: "Scene not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  try {
    const aiService = new ScriptAIService()

    // 构建角色信息
    const characterInfo: Record<string, { appearance: any; personality: string }> = {}
    for (const char of scene.scriptProject.characters) {
      characterInfo[char.name] = {
        appearance: char.appearance || "",
        personality: char.personality || "",
      }
    }

    // 获取原始内容
    const source = await prisma.scriptSource.findFirst({
      where: { scriptProjectId: projectId },
    })

    // 生成分镜
    const result = await aiService.generateShots(
      {
        title: scene.title,
        location: scene.location || "未知",
        mood: scene.mood || "普通",
        characters: [],
        content: scene.description || source?.content || "",
      },
      characterInfo
    )

    // 删除旧镜头
    await prisma.scriptShot.deleteMany({
      where: { sceneId },
    })

    // 创建新镜头
    let shotOrder = 1
    for (const shotData of result.shots) {
      const duration = parseDuration(shotData.durationSeconds)
      const dialogueCount = (shotData.dialogue || "").length > 0 ? 1 : 0

      await prisma.scriptShot.create({
        data: {
          sceneId,
          shotNumber: `${scene.sceneNumber}-${shotOrder}`,
          shotType: shotData.shotType,
          angle: shotData.cameraMovement,
          duration,
          visual: {
            description: shotData.description,
            mood: shotData.moodNote,
            reference: shotData.visualReference,
          },
          audio: {
            action: shotData.action,
            dialogue: shotData.dialogue,
          },
          imagePrompt: shotData.visualReference,
          dialogueCount,
          order: shotOrder,
          status: "generated",
        },
      })
      shotOrder++
    }

    // 更新场景统计
    await prisma.scriptScene.update({
      where: { id: sceneId },
      data: {
        shotCount: shotOrder - 1,
        totalDuration: result.shots.reduce((sum, s) => sum + parseDuration(s.durationSeconds), 0),
      },
    })

    return NextResponse.json({
      success: true,
      sceneId,
      shotsGenerated: shotOrder - 1,
      message: "场景镜头已重新生成",
    })
  } catch (error) {
    console.error(`Failed to regenerate scene ${sceneId}:`, error)

    return NextResponse.json(
      {
        error: "Failed to regenerate scene",
        code: ScriptErrorCode.GENERATION_FAILED,
      },
      { status: 500 }
    )
  }
}

// ============================================
// 辅助函数
// ============================================

/** 解析时长（秒） */
function parseDuration(value: number): number {
  return Math.max(1, Math.round(value)) || 5
}
