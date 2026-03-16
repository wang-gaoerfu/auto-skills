/**
 * 镜头排序 API
 *
 * POST /api/scripts/[id]/shots/reorder
 * - 批量重新排序镜头
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"

// ============================================
// 类型定义
// ============================================

interface ReorderShotsRequest {
  shotOrders: Array<{
    shotId: string
    newOrder: number
  }>
}

// ============================================
// POST - 重新排序
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
  const body: ReorderShotsRequest = await request.json().catch(() => ({}))

  if (!body.shotOrders || !Array.isArray(body.shotOrders)) {
    return NextResponse.json(
      { error: "Invalid request body", code: ScriptErrorCode.INVALID_PARAMS },
      { status: 400 }
    )
  }

  try {
    // 批量更新镜头顺序
    for (const { shotId, newOrder } of body.shotOrders) {
      const shotNumber = await generateShotNumber(shotId, newOrder)

      await prisma.scriptShot.updateMany({
        where: {
          id: shotId,
          scene: {
            scriptProjectId: projectId,
          },
        },
        data: {
          order: newOrder,
          shotNumber,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "排序已更新",
    })
  } catch (error) {
    console.error("Failed to reorder shots:", error)
    return NextResponse.json(
      { error: "Failed to reorder shots" },
      { status: 500 }
    )
  }
}

// ============================================
// 辅助函数
// ============================================

/** 根据顺序生成镜头编号 */
async function generateShotNumber(shotId: string, newOrder: number): Promise<string> {
  const shot = await prisma.scriptShot.findFirst({
    where: { id: shotId },
    select: {
      scene: {
        select: { sceneNumber: true },
      },
    },
  })

  if (!shot) return `${newOrder}`

  return `${shot.scene.sceneNumber}-${newOrder}`
}
