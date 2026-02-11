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
    { key: 'BASIC', color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20', highlight: false },
    { key: 'PRO', color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20', highlight: true },
    { key: 'ENTERPRISE', color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20', highlight: false },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">✓ 已通过</span>
      case 'PENDING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">⏱ 待审核</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">✗ 已拒绝</span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300">免费版(FREE)</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">会员中心</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          选择适合您的会员套餐
        </p>
      </div>

      {/* Current membership status */}
      {membership && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">当前会员状态</h2>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div>{getStatusBadge(membership.status)}</div>
              {membership.rejectReason && (
                <p className="text-sm text-gray-600 dark:text-gray-400">拒绝原因: {membership.rejectReason}</p>
              )}
              {membership.expiresAt && membership.status === 'APPROVED' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                planInfo.highlight ? 'border-purple-500 shadow-xl' : 'border-gray-200 dark:border-slate-600'
              } ${!isPending && !hasActiveMembership ? 'hover:shadow-xl' : ''}`}
            >
              {planInfo.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white shadow-lg">
                    推荐
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">¥{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/{plan.duration > 0 ? `${plan.duration}天` : '永久'}</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
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
                  className={`mt-6 w-full py-3 px-4 rounded-xl font-medium transition-all ${
                    purchasing === planInfo.key || isPending || hasActiveMembership
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
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
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">免费版(FREE)</h3>
        <p className="text-gray-600 dark:text-gray-400">
          注册即可使用免费工具，升级会员后可使用全部工具。
        </p>
      </div>
    </div>
  )
}
