'use client'

import { useEffect, useState } from 'react'

interface Stats {
  userCount: number
  memberCount: number
  pendingCount: number
  toolCount: number
  totalUsage: number
  popularTools: { name: string; count: number }[]
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { name: '总用户数', value: stats?.userCount || 0, icon: '👥', color: 'bg-blue-500' },
    { name: '会员数', value: stats?.memberCount || 0, icon: '💎', color: 'bg-green-500' },
    { name: '待审核', value: stats?.pendingCount || 0, icon: '⏱', color: 'bg-yellow-500' },
    { name: '工具数', value: stats?.toolCount || 0, icon: '🔧', color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">统计分析</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">系统数据统计概览</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-gray-400">加载中...</div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <div key={card.name} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className={`${card.color} rounded-lg p-3`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.name}</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Popular tools */}
          {stats?.popularTools && stats.popularTools.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">热门工具</h3>
              <div className="space-y-3">
                {stats.popularTools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{tool.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{tool.count} 次使用</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total usage */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">总使用次数</h3>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stats?.totalUsage || 0}</p>
          </div>
        </>
      )}
    </div>
  )
}
