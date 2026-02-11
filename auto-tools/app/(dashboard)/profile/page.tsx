'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getMembershipDisplayName, getMembershipPermissions } from '@/lib/membership'

interface ToolUsage {
  id: string
  tool: {
    name: string
    icon?: string | null
  }
  createdAt: string
  success: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [usageCount, setUsageCount] = useState(0)
  const [recentUsage, setRecentUsage] = useState<ToolUsage[]>([])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/stats/dashboard')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setUsageCount(data.userUsage || 0)
      }

      const usageRes = await fetch('/api/tools/usage?limit=10')
      if (usageRes.ok) {
        const data = await usageRes.json()
        setRecentUsage(data.usage || [])
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">管理您的账户信息和查看使用记录</p>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">账户信息</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">用户名</label>
              <p className="text-gray-900 dark:text-white font-medium">{session?.user?.name || '未设置'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">邮箱</label>
              <p className="text-gray-900 dark:text-white font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">角色</label>
              <p className="text-gray-900 dark:text-white font-medium">
                {session?.user?.role === 'ADMIN' ? '管理员' : '普通用户'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">会员等级</label>
              <p className="text-gray-900 dark:text-white font-medium">
                {session?.user?.membershipStatus === 'APPROVED'
                  ? getMembershipDisplayName(session?.user?.membershipPlan)
                  : '免费用户'}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">注册时间</label>
            <p className="text-gray-900 dark:text-white font-medium">-</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">使用统计</h2>
          <div className="text-center py-6">
            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{usageCount}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">工具使用次数</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">会员状态</h2>
          <div className="text-center py-6">
            {session?.user?.membershipStatus === 'APPROVED' ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getMembershipDisplayName(session?.user?.membershipPlan)}
                </p>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {getMembershipPermissions(session?.user?.membershipPlan).features.join(' · ')}
                </div>
              </>
            ) : session?.user?.membershipStatus === 'PENDING' ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-3">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">待审核</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                  <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">免费用户</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近使用</h2>
        {recentUsage.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">暂无使用记录</p>
            <a href="/tools" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              去使用工具
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">工具名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">使用时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsage.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {record.tool.icon && <span className="mr-2">{record.tool.icon}</span>}
                        <span className="text-gray-900 dark:text-white">{record.tool.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.success ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          成功
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          失败
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/tools" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div className="text-2xl mb-2">🧰</div>
            <h3 className="font-medium text-gray-900 dark:text-white">浏览工具</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">查看所有可用工具</p>
          </a>
          <a href="/membership" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-medium text-gray-900 dark:text-white">会员中心</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">升级会员等级</p>
          </a>
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                window.location.href = '/api/auth/signout'
              }
            }}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
          >
            <div className="text-2xl mb-2">🚪</div>
            <h3 className="font-medium text-gray-900 dark:text-white">退出登录</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">退出当前账户</p>
          </button>
        </div>
      </div>
    </div>
  )
}
