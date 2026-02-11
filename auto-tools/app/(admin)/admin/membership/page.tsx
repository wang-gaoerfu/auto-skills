'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { getMembershipDisplayName } from '@/lib/membership'

interface Membership {
  id: string
  userId: string
  plan: string
  status: string
  appliedAt: string
  rejectedAt?: string | null
  rejectReason?: string | null
  user: {
    id: string
    email: string
    name?: string | null
    phone?: string | null
  }
}

interface MembershipsResponse {
  memberships: Membership[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminMembershipPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchMemberships = async (page = 1, limit = 20, currentStatus = status) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/membership/list?status=${currentStatus}&page=${page}&limit=${limit}`)
      if (response.ok) {
        const data: MembershipsResponse = await response.json()
        setMemberships(data.memberships)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberships()
  }, [status])

  const handlePageChange = (page: number) => {
    fetchMemberships(page, pagination.limit, status)
  }

  const handlePageSizeChange = (size: number) => {
    fetchMemberships(1, size, status)
  }

  const handleApprove = async (membershipId: string) => {
    setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: true } : m))

    try {
      const response = await fetch('/api/membership/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '操作失败')
        setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: false } : m))
        return
      }

      alert('已通过审核')
      fetchMemberships(pagination.page, pagination.limit, status)
    } catch (error) {
      alert('操作失败')
      setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: false } : m))
    }
  }

  const handleReject = async (membershipId: string) => {
    const reason = prompt('请输入拒绝原因:')
    if (reason === null) return

    setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: true } : m))

    try {
      const response = await fetch('/api/membership/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '操作失败')
        setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: false } : m))
        return
      }

      alert('已拒绝申请')
      fetchMemberships(pagination.page, pagination.limit, status)
    } catch (error) {
      alert('操作失败')
      setMemberships(prev => prev.map(m => m.id === membershipId ? { ...m, processing: false } : m))
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">已通过</span>
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">待审核</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">已拒绝</span>
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">已过期</span>
      default:
        return null
    }
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      ENTERPRISE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {getMembershipDisplayName(plan)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 状态筛选 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">状态筛选:</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPagination({ page:1, limit: pagination.limit, total:0, totalPages:0 })
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="EXPIRED">已过期</option>
          <option value="ALL">全部</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-gray-400">加载中...</div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    套餐
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    申请时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {memberships.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {m.user.name || '未设置'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{m.user.email}</div>
                        {m.user.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{m.user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPlanBadge(m.plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(m.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(m.appliedAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {m.status === 'PENDING' && !(m as any).processing ? (
                        <>
                          <button
                            onClick={() => handleApprove(m.id)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(m.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            拒绝
                          </button>
                        </>
                      ) : (m as any).processing ? (
                        <span className="text-gray-500">处理中...</span>
                      ) : (
                        <span className="text-gray-400">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
                {memberships.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 翻页组件 */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  )
}
