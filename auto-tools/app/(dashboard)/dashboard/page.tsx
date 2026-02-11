'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMembershipDisplayName } from '@/lib/membership'

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          欢迎回来, {session?.user?.name || session?.user?.email}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          这是您的个人仪表板
        </p>
      </div>

      {/* Membership status */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">会员状态</h2>
        {session?.user?.membershipStatus === 'APPROVED' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                ✓ 已激活
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {getMembershipDisplayName(session?.user?.membershipPlan)}
              </span>
            </div>
            <Link
              href="/membership"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              查看详情 →
            </Link>
          </div>
        ) : session?.user?.membershipStatus === 'PENDING' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                ⏱ 等待审核
              </span>
            </div>
            <Link
              href="/membership"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              查看详情 →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300">
                免费用户
              </span>
            </div>
            <Link
              href="/membership"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow transition"
            >
              升级会员
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/tools"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6 hover:shadow-xl transition group"
        >
          <div className="text-3xl mb-3">🧰</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">工具箱</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            使用上百种实用工具
          </p>
        </Link>

        <Link
          href="/membership"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6 hover:shadow-xl transition group"
        >
          <div className="text-3xl mb-3">💎</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">会员中心</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            查看和管理您的会员
          </p>
        </Link>

        <Link
          href="/profile"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6 hover:shadow-xl transition group"
        >
          <div className="text-3xl mb-3">👤</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">个人中心</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            管理您的个人信息
          </p>
        </Link>
      </div>
    </div>
  )
}
