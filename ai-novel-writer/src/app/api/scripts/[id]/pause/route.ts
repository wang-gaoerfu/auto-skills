/**
 * 暂停/恢复生成 API
 *
 * POST /api/scripts/[id]/pause
 * - 暂停当前生成任务
 * - 恢复已暂停的任务
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ScriptErrorCode } from "@/lib/script/types"
import { releaseGenerationLock } from "@/lib/script/utils"

// ============================================
// POST - 暂停/恢复
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
  const body = await request.json().catch(() => ({}))
  const action = body.action // "pause" or "resume"

  if (action === "pause") {
    // 暂停生成：释放锁
    if (project.generationLock) {
      await releaseGenerationLock(projectId, project.generationLock)
    }

    // 更新项目状态
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: "paused",
        subStatus: null,
        generationLock: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "生成已暂停",
    })
  }

  if (action === "resume") {
    // 恢复生成：检查当前状态
    if (project.status !== "paused") {
      return NextResponse.json(
        { error: "只能恢复已暂停的任务", code: ScriptErrorCode.INVALID_PARAMS },
        { status: 400 }
      )
    }

    // 更新项目状态为生成中
    await prisma.scriptProject.update({
      where: { id: projectId },
      data: {
        status: "generating",
        subStatus: "storyboard_generating",
      },
    })

    // 重新启动生成任务（这里简化处理，实际应该从断点继续）
    // TODO: 实现断点续传逻辑

    return NextResponse.json({
      success: true,
      message: "生成已恢复",
    })
  }

  return NextResponse.json(
    { error: "Invalid action", code: ScriptErrorCode.INVALID_PARAMS },
    { status: 400 }
  )
}

// ============================================
// GET - 获取暂停状态
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

  const project = await prisma.scriptProject.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
      status: true,
      generationLock: true,
      progress: true,
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: "Project not found", code: ScriptErrorCode.PROJECT_NOT_FOUND },
      { status: 404 }
    )
  }

  return NextResponse.json({
    canPause: project.status === "generating" && !!project.generationLock,
    canResume: project.status === "paused",
    progress: project.progress,
  })
}
