/**
 * 剧本系统工具函数
 */

import { prisma } from "@/lib/prisma"
import {
  SCRIPT_MEMBERSHIP_QUOTAS,
  ScriptMembershipPlan,
  ScriptMembershipQuota,
  ScriptErrorCode,
} from "./types"

/**
 * 获取用户的剧本会员信息
 */
export async function getScriptMembership(userId: string) {
  let membership = await prisma.scriptMembership.findUnique({
    where: { userId },
  })

  // 如果不存在则创建默认会员
  if (!membership) {
    membership = await prisma.scriptMembership.create({
      data: { userId },
    })
  }

  // 检查是否过期
  if (membership.expiresAt && new Date() > membership.expiresAt) {
    membership = await prisma.scriptMembership.update({
      where: { id: membership.id },
      data: {
        status: "EXPIRED",
        plan: "FREE",
      },
    })
  }

  return membership
}

/**
 * 获取用户配额
 */
export function getQuota(plan: ScriptMembershipPlan): ScriptMembershipQuota {
  return SCRIPT_MEMBERSHIP_QUOTAS[plan] || SCRIPT_MEMBERSHIP_QUOTAS.FREE
}

/**
 * 检查项目数量限制
 */
export async function checkProjectQuota(userId: string): Promise<{
  allowed: boolean
  current: number
  max: number
  message?: string
}> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)

  const currentCount = await prisma.scriptProject.count({
    where: { userId },
  })

  const allowed = currentCount < quota.maxProjects

  return {
    allowed,
    current: currentCount,
    max: quota.maxProjects,
    message: allowed
      ? undefined
      : `已达项目数量上限（${quota.maxProjects}个），请升级会员`,
  }
}

/**
 * 检查章节限制
 */
export async function checkChapterQuota(
  userId: string,
  projectId: string
): Promise<{
  allowed: boolean
  current: number
  max: number
  message?: string
}> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)

  const currentCount = await prisma.scriptSource.count({
    where: { scriptProjectId: projectId },
  })

  const allowed = currentCount < quota.maxChaptersPerProject

  return {
    allowed,
    current: currentCount,
    max: quota.maxChaptersPerProject,
    message: allowed
      ? undefined
      : `已达章节上限（${quota.maxChaptersPerProject}章），请升级会员`,
  }
}

/**
 * 检查每日生成次数
 */
export async function checkDailyGenerationQuota(userId: string): Promise<{
  allowed: boolean
  current: number
  max: number
  message?: string
}> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)

  // 如果是无限次数，直接返回允许
  if (quota.dailyGenerations === Infinity) {
    return { allowed: true, current: 0, max: Infinity }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 检查是否是新的一天，重置计数
  if (!membership.lastGenerationDate || membership.lastGenerationDate < today) {
    await prisma.scriptMembership.update({
      where: { id: membership.id },
      data: {
        dailyGenerations: 0,
        lastGenerationDate: today,
      },
    })
    return { allowed: true, current: 0, max: quota.dailyGenerations }
  }

  const allowed = membership.dailyGenerations < quota.dailyGenerations

  return {
    allowed,
    current: membership.dailyGenerations,
    max: quota.dailyGenerations,
    message: allowed
      ? undefined
      : `今日生成次数已达上限（${quota.dailyGenerations}次），请明天再试`,
  }
}

/**
 * 增加每日生成次数
 */
export async function incrementDailyGeneration(userId: string): Promise<void> {
  const membership = await getScriptMembership(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.scriptMembership.update({
    where: { id: membership.id },
    data: {
      dailyGenerations: { increment: 1 },
      monthlyGenerations: { increment: 1 },
      lastGenerationDate: today,
    },
  })
}

/**
 * 检查导出格式权限
 */
export async function checkExportFormat(
  userId: string,
  format: string
): Promise<{ allowed: boolean; message?: string }> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)

  const allowed = quota.exportFormats.includes(format)

  return {
    allowed,
    message: allowed
      ? undefined
      : `当前会员不支持${format.toUpperCase()}格式导出，请升级会员`,
  }
}

/**
 * 检查是否需要水印
 */
export async function needsWatermark(userId: string): Promise<boolean> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)
  return quota.hasWatermark
}

/**
 * 检查是否支持 AI 生成镜头图片
 */
export async function canGenerateShotImage(userId: string): Promise<boolean> {
  const membership = await getScriptMembership(userId)
  const quota = getQuota(membership.plan as ScriptMembershipPlan)
  return quota.hasAIShotImage
}

/**
 * 获取或创建生成锁
 * @returns 是否成功获取锁
 */
export async function acquireGenerationLock(
  projectId: string,
  lockId: string
): Promise<{ acquired: boolean; existingLock?: string }> {
  const project = await prisma.scriptProject.findUnique({
    where: { id: projectId },
    select: { generationLock: true, lockAcquiredAt: true, status: true },
  })

  if (!project) {
    throw new Error("Project not found")
  }

  // 如果已经有锁，检查是否过期（超过 1 小时）
  if (project.generationLock) {
    const lockAge = Date.now() - (project.lockAcquiredAt?.getTime() || 0)
    const ONE_HOUR = 60 * 60 * 1000

    if (lockAge < ONE_HOUR && project.status === "generating") {
      return { acquired: false, existingLock: project.generationLock }
    }
  }

  // 尝试获取锁
  const updated = await prisma.scriptProject.updateMany({
    where: {
      id: projectId,
      OR: [
        { generationLock: null },
        {
          lockAcquiredAt: {
            lt: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      ],
    },
    data: {
      generationLock: lockId,
      lockAcquiredAt: new Date(),
      status: "generating",
    },
  })

  return { acquired: updated.count > 0 }
}

/**
 * 释放生成锁
 */
export async function releaseGenerationLock(
  projectId: string,
  lockId: string
): Promise<void> {
  await prisma.scriptProject.updateMany({
    where: {
      id: projectId,
      generationLock: lockId,
    },
    data: {
      generationLock: null,
      lockAcquiredAt: null,
    },
  })
}

/**
 * 记录 AI 成本
 */
export async function logAICost(params: {
  userId: string
  projectId: string
  operation: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  cached?: boolean
}): Promise<void> {
  await prisma.scriptCostLog.create({
    data: params,
  })

  // 更新项目总 token 数
  await prisma.scriptProject.update({
    where: { id: params.projectId },
    data: {
      totalTokens: {
        increment: params.inputTokens + params.outputTokens,
      },
    },
  })
}
