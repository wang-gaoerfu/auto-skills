import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getMembershipPrices } from '@/lib/membership'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { plan } = body

    if (!plan || !['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: '无效的套餐' },
        { status: 400 }
      )
    }

    // Get current membership
    const currentMembership = await prisma.membership.findUnique({
      where: { userId: session.user.id }
    })

    // Check if user already has an active membership
    if (currentMembership && currentMembership.status === 'APPROVED') {
      const isActive = !currentMembership.expiresAt ||
                       currentMembership.expiresAt > new Date()

      if (isActive) {
        return NextResponse.json(
          { error: '您已有有效的会员，无需重复购买' },
          { status: 400 }
        )
      }
    }

    // Calculate expiration date
    const prices = await getMembershipPrices()
    const planInfo = prices[plan as keyof typeof prices]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + planInfo.duration)

    // Create or update membership
    const membership = await prisma.membership.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan,
        status: 'PENDING',
        expiresAt,
      },
      update: {
        plan,
        status: 'PENDING',
        expiresAt,
        appliedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        rejectReason: null,
      },
    })

    return NextResponse.json({
      success: true,
      membership,
    })

  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: '购买失败，请稍后重试' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id }
    })

    const prices = await getMembershipPrices()

    return NextResponse.json({
      membership,
      prices,
    })

  } catch (error) {
    console.error('Get membership error:', error)
    return NextResponse.json(
      { error: '获取会员信息失败' },
      { status: 500 }
    )
  }
}
