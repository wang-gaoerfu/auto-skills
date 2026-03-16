/**
 * 场景 API
 *
 * PATCH /api/scripts/[id]/scenes/[sceneId]
 * - 更新场景信息
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// 类型定义
// ============================================

interface UpdateSceneRequest {
  title?: string
  location?: string
  timeOfDay?: string
  mood?: string
  description?: string
}

// ============================================
// PATCH - 更新场景
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId, sceneId } = await params

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
  const body: UpdateSceneRequest = await request.json().catch(() => ({}))

  try {
    // 构建更新数据
    const updateData: any = {}

    if (body.title !== undefined) {
      updateData.title = body.title
    }
    if (body.location !== undefined) {
      updateData.location = body.location
    }
    if (body.timeOfDay !== undefined) {
      updateData.timeOfDay = body.timeOfDay
    }
    if (body.mood !== undefined) {
      updateData.mood = body.mood
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // 更新场景
    const updatedScene = await prisma.scriptScene.update({
      where: { id: sceneId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      scene: updatedScene,
    })
  } catch (error) {
    console.error("Failed to update scene:", error)
    return NextResponse.json(
      { error: "Failed to update scene", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - 删除场景
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: ScriptErrorCode.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { id: projectId, sceneId } = await params

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
    // 删除场景（镜头会级联删除）
    await prisma.scriptScene.delete({
      where: { id: sceneId },
    })

    // 重新排序剩余场景
    const remainingScenes = await prisma.scriptScene.findMany({
      where: { scriptProjectId: projectId },
      orderBy: { sceneNumber: "asc" },
    })

    for (let i = 0; i < remainingScenes.length; i++) {
      await prisma.scriptScene.update({
        where: { id: remainingScenes[i].id },
        data: {
          sceneNumber: i + 1,
          order: i + 1,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "场景已删除",
    })
  } catch (error) {
    console.error("Failed to delete scene:", error)
    return NextResponse.json(
      { error: "Failed to delete scene" },
      { status: 500 }
    )
  }
}
