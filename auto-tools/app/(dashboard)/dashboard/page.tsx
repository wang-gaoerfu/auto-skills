'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  userCount: number
  toolCount: number
  memberCount: number
  totalUsage: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          欢迎回来, {session?.user?.name || session?.user?.email}
        </h1>
        <p className="mt-2 text-gray-600">
          这是您的个人仪表板
        </p>
      </div>

      {/* Membership status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">会员状态</h2>
        {session?.user?.membershipStatus === 'APPROVED' ? (
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ {session?.user?.membershipPlan} 会员
            </span>
          </div>
        ) : session?.user?.membershipStatus === 'PENDING' ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              ⏱ 等待审核
            </span>
            <Link
              href="/membership"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              查看详情 →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              免费用户
            </span>
            <Link
              href="/membership"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              升级会员 →
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/tools"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
        >
          <div className="text-3xl mb-3">🧰</div>
          <h3 className="text-lg font-medium text-gray-900">工具箱</h3>
          <p className="text-gray-600 text-sm mt-1">
            使用上百种实用工具
          </p>
        </Link>

        <Link
          href="/membership"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
        >
          <div className="text-3xl mb-3">💎</div>
          <h3 className="text-lg font-medium text-gray-900">会员中心</h3>
          <p className="text-gray-600 text-sm mt-1">
            查看和管理您的会员
          </p>
        </Link>

        <Link
          href="/profile"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
        >
          <div className="text-3xl mb-3">👤</div>
          <h3 className="text-lg font-medium text-gray-900">个人中心</h3>
          <p className="text-gray-600 text-sm mt-1">
            管理您的个人信息
          </p>
        </Link>
      </div>
    </div>
  )
}
