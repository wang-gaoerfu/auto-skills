'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'

interface Tool {
  id: string
  name: string
  slug: string
  description: string
  icon?: string | null
  categoryId: string
  isFree: boolean
  isActive: boolean
  sortOrder: number
  useCount: number
  category: {
    id: string
    name: string
  }
}

interface ToolsResponse {
  tools: Tool[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface Category {
  id: string
  name: string
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchData = async (page = 1, limit = 20) => {
    setLoading(true)
    try {
      const [toolsRes, catsRes] = await Promise.all([
        fetch(`/api/tools?limit=${limit}&page=${page}`),
        fetch('/api/tools/categories'),
      ])

      if (toolsRes.ok && catsRes.ok) {
        const data: ToolsResponse = await toolsRes.json()
        const catsData = await catsRes.json()
        setTools(data.tools)
        setCategories(catsData.categories)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePageChange = (page: number) => {
    fetchData(page, pagination.limit)
  }

  const handlePageSizeChange = (size: number) => {
    fetchData(1, size)
  }

  const toggleToolActive = async (toolId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        alert('操作失败')
        return
      }

      fetchData(pagination.page, pagination.limit)
    } catch (error) {
      alert('操作失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">工具管理</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">管理系统中的所有工具</p>
        </div>
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
                    工具
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    使用次数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tool.icon && <span className="text-2xl mr-3">{tool.icon}</span>}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{tool.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        tool.isFree
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {tool.isFree ? '免费' : '会员'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        tool.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {tool.isActive ? '已上架' : '已下架'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.useCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">编辑</button>
                      <button
                        onClick={() => toggleToolActive(tool.id, tool.isActive)}
                        className={tool.isActive ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {tool.isActive ? '下架' : '上架'}
                      </button>
                    </td>
                  </tr>
                ))}
                {tools.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      暂无工具
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
