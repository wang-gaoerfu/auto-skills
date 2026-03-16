/**
 * 镜头 API
 *
 * PATCH /api/scripts/[id]/shots/[shotId]
 * - 更新镜头信息
 *
 * DELETE /api/scripts/[id]/shots/[shotId]
 * - 删除镜头
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// 类型定义
// ============================================

interface UpdateShotRequest {
  description?: string
  action?: string
  dialogue?: string
  mood?: string
  visualReference?: string
  shotType?: string
  angle?: string
  duration?: number
}

// ============================================
// PATCH - 更新镜头
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId, shotId } = await params

  // 验证项目权限
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
  const body: UpdateShotRequest = await request.json().catch(() => ({}))

  try {
    // 获取现有镜头
    const existingShot = await prisma.scriptShot.findFirst({
      where: { id: shotId },
      include: { scene: true },
    })

    if (!existingShot || existingShot.scene.scriptProjectId !== projectId) {
      return NextResponse.json(
        { error: "Shot not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 构建更新数据
    const updateData: any = {
      isEdited: true, // 标记为已编辑
    }

    // 获取现有的 visual 和 audio
    const visual = (existingShot.visual as any) || {}
    const audio = (existingShot.audio as any) || {}

    if (body.description !== undefined) {
      visual.description = body.description
    }
    if (body.mood !== undefined) {
      visual.mood = body.mood
    }
    if (body.visualReference !== undefined) {
      visual.reference = body.visualReference
    }
    if (body.action !== undefined) {
      audio.action = body.action
    }
    if (body.dialogue !== undefined) {
      audio.dialogue = body.dialogue
      updateData.dialogueCount = body.dialogue.length > 0 ? 1 : 0
    }

    updateData.visual = visual
    updateData.audio = audio

    if (body.shotType !== undefined) {
      updateData.shotType = body.shotType
    }
    if (body.angle !== undefined) {
      updateData.angle = body.angle
    }
    if (body.duration !== undefined) {
      updateData.duration = body.duration
    }

    // 更新镜头
    const updatedShot = await prisma.scriptShot.update({
      where: { id: shotId },
      data: updateData,
    })

    // 更新场景总时长
    const allShots = await prisma.scriptShot.findMany({
      where: { sceneId: existingShot.sceneId },
    })
    const totalDuration = allShots.reduce((sum, s) => sum + s.duration, 0)

    await prisma.scriptScene.update({
      where: { id: existingShot.sceneId },
      data: { totalDuration },
    })

    return NextResponse.json({
      success: true,
      shot: updatedShot,
    })
  } catch (error) {
    console.error("Failed to update shot:", error)
    return NextResponse.json(
      { error: "Failed to update shot", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - 删除镜头
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId, shotId } = await params

  // 验证项目权限
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

  try {
    // 获取镜头
    const shot = await prisma.scriptShot.findFirst({
      where: { id: shotId },
      select: { sceneId: true, order: true },
    })

    if (!shot) {
      return NextResponse.json(
        { error: "Shot not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
        { status: 404 }
      )
    }

    // 删除镜头
    await prisma.scriptShot.delete({
      where: { id: shotId },
    })

    // 重新排序后面的镜头
    await prisma.scriptShot.updateMany({
      where: {
        sceneId: shot.sceneId,
        order: { gt: shot.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    // 更新场景统计
    const remainingShots = await prisma.scriptShot.findMany({
      where: { sceneId: shot.sceneId },
    })

    await prisma.scriptScene.update({
      where: { id: shot.sceneId },
      data: {
        shotCount: remainingShots.length,
        totalDuration: remainingShots.reduce((sum, s) => sum + s.duration, 0),
      },
    })

    return NextResponse.json({
      success: true,
      message: "镜头已删除",
    })
  } catch (error) {
    console.error("Failed to delete shot:", error)
    return NextResponse.json(
      { error: "Failed to delete shot" },
      { status: 500 }
    )
  }
}
