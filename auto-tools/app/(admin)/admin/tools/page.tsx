'use client'

import { useEffect, useState } from 'react'

interface Tool {
  id: string
  name: string
  slug: string
  description: string
  icon?: string | null
  isFree: boolean
  isActive: boolean
  sortOrder: number
  useCount: number
  category: {
    id: string
    name: string
  }
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [toolsRes, catsRes] = await Promise.all([
        fetch('/api/tools?limit=100'),
        fetch('/api/tools/categories'),
      ])

      if (toolsRes.ok && catsRes.ok) {
        const toolsData = await toolsRes.json()
        const catsData = await catsRes.json()
        setTools(toolsData.tools)
        setCategories(catsData.categories)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
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

      fetchData()
    } catch (error) {
      alert('操作失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">工具管理</h2>
          <p className="text-gray-600 text-sm mt-1">管理系统中的所有工具</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          新增工具
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">加载中...</div>
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600">暂无工具</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工具
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.map((tool) => (
                <tr key={tool.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {tool.icon && <span className="text-2xl mr-3">{tool.icon}</span>}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                        <div className="text-sm text-gray-500">{tool.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tool.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      tool.isFree
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tool.isFree ? '免费' : '会员'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      tool.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tool.isActive ? '已上架' : '已下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
