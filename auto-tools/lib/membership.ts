import { prisma } from './db'

// Get membership prices from settings
export async function getMembershipPrices() {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: 'membership_prices' }
  })

  if (!setting) {
    // Default prices
    return {
      FREE: { price: 0, duration: 0, name: '免费版' },
      BASIC: { price: 29, duration: 30, name: '基础版' },
      PRO: { price: 99, duration: 30, name: '专业版' },
      ENTERPRISE: { price: 299, duration: 30, name: '企业版' },
    }
  }

  return JSON.parse(setting.value)
}

// Check if user can use a tool
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

// Get user membership status
export async function getUserMembership(userId: string) {
  return prisma.membership.findUnique({
    where: { userId }
  })
}
