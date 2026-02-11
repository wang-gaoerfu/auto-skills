import { prisma } from './db'

// Get membership prices from settings
export async function getMembershipPrices() {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: 'membership_prices' }
  })

  if (!setting) {
    // Default prices
    return {
      FREE: { price: 0, duration: 0, name: '免费版(FREE)' },
      BASIC: { price: 29, duration: 30, name: '基础版(BASIC)' },
      PRO: { price: 99, duration: 30, name: '专业版(PRO)' },
      ENTERPRISE: { price: 299, duration: 30, name: '企业版(ENTERPRISE)' },
    }
  }

  return JSON.parse(setting.value)
}

// Get membership display name (Chinese + English)
export function getMembershipDisplayName(plan: string | null | undefined): string {
  const names: Record<string, string> = {
    'FREE': '免费版(FREE)',
    'BASIC': '基础版(BASIC)',
    'PRO': '专业版(PRO)',
    'ENTERPRISE': '企业版(ENTERPRISE)',
  }
  return names[plan || 'FREE'] || '免费版(FREE)'
}

// Get membership permissions
export function getMembershipPermissions(plan: string | null | undefined) {
  const permissions = {
    FREE: {
      maxDailyUses: 10,
      canUsePaidTools: false,
      canUseApi: false,
      prioritySupport: false,
      features: ['免费工具', '每日10次使用'],
    },
    BASIC: {
      maxDailyUses: 100,
      canUsePaidTools: true,
      canUseApi: false,
      prioritySupport: false,
      features: ['全部工具', '每日100次使用', '基础技术支持'],
    },
    PRO: {
      maxDailyUses: 1000,
      canUsePaidTools: true,
      canUseApi: true,
      prioritySupport: true,
      features: ['全部工具', '每日1000次使用', 'API访问', '优先技术支持'],
    },
    ENTERPRISE: {
      maxDailyUses: -1, // unlimited
      canUsePaidTools: true,
      canUseApi: true,
      prioritySupport: true,
      features: ['全部工具', '无使用次数限制', 'API访问', '优先技术支持', '定制服务'],
    },
  }

  return permissions[plan || 'FREE'] || permissions.FREE
}

// Check if user can use a tool based on membership
export async function canUserUseTool(userId: string, tool: { isFree: boolean }) {
  if (tool.isFree) {
    return true
  }

  const membership = await prisma.membership.findUnique({
    where: { userId }
  })

  if (!membership) {
    return false
  }

  // Check if membership is active
  if (membership.status !== 'APPROVED') {
    return false
  }

  // Check if membership is expired
  if (membership.expiresAt && membership.expiresAt < new Date()) {
    // Update status to expired
    await prisma.membership.update({
      where: { userId },
      data: { status: 'EXPIRED' }
    })
    return false
  }

  return true
}

// Check user's daily usage count
export async function getUserDailyUsage(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const count = await prisma.toolUsage.count({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
      success: true,
    }
  })

  return count
}

// Check if user can use more tools today
export async function canUserUseToolNow(userId: string, plan: string | null): Promise<{ canUse: boolean; reason?: string }> {
  const permissions = getMembershipPermissions(plan)

  // Check daily limit
  if (permissions.maxDailyUses > 0) {
    const dailyUsage = await getUserDailyUsage(userId)
    if (dailyUsage >= permissions.maxDailyUses) {
      return {
        canUse: false,
        reason: `今日使用次数已达上限 (${permissions.maxDailyUses}次)`,
      }
    }
  }

  return { canUse: true }
}

// Get user membership status
export async function getUserMembership(userId: string) {
  return prisma.membership.findUnique({
    where: { userId }
  })
}
