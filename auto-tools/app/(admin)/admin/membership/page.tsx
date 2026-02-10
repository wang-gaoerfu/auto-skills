'use client'

import { useEffect, useState } from 'react'

interface MembershipWithUser {
  id: string
  userId: string
  plan: string
  status: string
  appliedAt: string
  user: {
    id: string
    email: string
    name?: string | null
    phone?: string | null
  }
}

export default function AdminMembershipPage() {
  const [memberships, setMemberships] = useState<MembershipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')

  useEffect(() => {
    fetchMemberships()
  }, [status])

  const fetchMemberships = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/membership/list?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setMemberships(data.memberships)
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (membershipId: string) => {
    setProcessing(membershipId)
    try {
      const response = await fetch('/api/membership/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '操作失败')
        return
      }

      alert('已通过审核')
      fetchMemberships()
    } catch (error) {
      alert('操作失败')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (membershipId: string) => {
    const reason = prompt('请输入拒绝原因:')
    if (reason === null) return

    setProcessing(membershipId)
    try {
      const response = await fetch('/api/membership/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '操作失败')
        return
      }

      alert('已拒绝申请')
      fetchMemberships()
    } catch (error) {
      alert('操作失败')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">已通过</span>
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">待审核</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">已拒绝</span>
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">已过期</span>
      default:
        return null
    }
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      BASIC: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-orange-100 text-orange-800',
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {plan}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">状态筛选:</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="EXPIRED">已过期</option>
          <option value="ALL">全部</option>
        </select>
      </div>

      {/* Memberships table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">加载中...</div>
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600">暂无数据</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  套餐
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberships.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {m.user.name || '未设置'}
                      </div>
                      <div className="text-sm text-gray-500">{m.user.email}</div>
                      {m.user.phone && (
                        <div className="text-sm text-gray-500">{m.user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlanBadge(m.plan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(m.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(m.appliedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {m.status === 'PENDING' && processing !== m.id && (
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
                    )}
                    {processing === m.id && (
                      <span className="text-gray-500">处理中...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
