'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getMembershipPermissions } from '@/lib/membership'

interface MembershipPrices {
  FREE: { price: number; duration: number; name: string }
  BASIC: { price: number; duration: number; name: string }
  PRO: { price: number; duration: number; name: string }
  ENTERPRISE: { price: number; duration: number; name: string }
}

interface Membership {
  id: string
  plan: string
  status: string
  expiresAt?: string | null
  appliedAt: string
  approvedAt?: string | null
  rejectedAt?: string | null
  rejectReason?: string | null
}

export default function MembershipPage() {
  const { data: session } = useSession()
  const [prices, setPrices] = useState<MembershipPrices | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/membership/purchase')
      if (response.ok) {
        const data = await response.json()
        setPrices(data.prices)
        setMembership(data.membership)
      }
    } catch (error) {
      console.error('Failed to fetch membership data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (plan: string) => {
    setPurchasing(plan)
    try {
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '购买失败')
        return
      }

      alert('购买申请已提交，请等待管理员审核')
      fetchData()
    } catch (error) {
      alert('购买失败，请稍后重试')
    } finally {
      setPurchasing(null)
    }
  }

  const plans = [
    { key: 'BASIC', color: 'border-blue-500 bg-blue-50', highlight: false },
    { key: 'PRO', color: 'border-purple-500 bg-purple-50', highlight: true },
    { key: 'ENTERPRISE', color: 'border-orange-500 bg-orange-50', highlight: false },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✓ 已通过</span>
      case 'PENDING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">⏱ 待审核</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">✗ 已拒绝</span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">免费版(FREE)</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">会员中心</h1>
        <p className="mt-2 text-gray-600">
          选择适合您的会员套餐
        </p>
      </div>

      {/* Current membership status */}
      {membership && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">当前会员状态</h2>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div>{getStatusBadge(membership.status)}</div>
              {membership.rejectReason && (
                <p className="text-sm text-gray-600">拒绝原因: {membership.rejectReason}</p>
              )}
              {membership.expiresAt && membership.status === 'APPROVED' && (
                <p className="text-sm text-gray-600">
                  到期时间: {new Date(membership.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((planInfo) => {
          const plan = prices?.[planInfo.key as keyof MembershipPrices]
          if (!plan) return null

          const isCurrentPlan = membership?.plan === planInfo.key
          const isPending = membership?.status === 'PENDING'
          const hasActiveMembership = membership?.status === 'APPROVED' &&
            (!membership.expiresAt || new Date(membership.expiresAt) > new Date())

          return (
            <div
              key={planInfo.key}
              className={`relative rounded-lg border-2 p-6 ${
                planInfo.highlight ? 'border-purple-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {planInfo.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
                    推荐
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">¥{plan.price}</span>
                  <span className="text-gray-600">/{plan.duration > 0 ? `${plan.duration}天` : '永久'}</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  {getMembershipPermissions(planInfo.key).features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(planInfo.key)}
                  disabled={purchasing === planInfo.key || isPending || hasActiveMembership}
                  className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition ${
                    purchasing === planInfo.key || isPending || hasActiveMembership
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {purchasing === planInfo.key
                    ? '购买中...'
                    : isPending
                    ? '等待审核'
                    : hasActiveMembership
                    ? '已是会员'
                    : '立即购买'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Free plan info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">免费版(FREE)</h3>
        <p className="text-gray-600">
          注册即可使用免费工具，升级会员后可使用全部工具。
        </p>
      </div>
    </div>
  )
}
