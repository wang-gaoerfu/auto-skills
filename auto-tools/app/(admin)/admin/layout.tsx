'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()

  const navigation = [
    { name: '会员审核', href: '/admin/membership', icon: '✅' },
    { name: '用户管理', href: '/admin/users', icon: '👥' },
    { name: '工具管理', href: '/admin/tools', icon: '🔧' },
    { name: '统计分析', href: '/admin/stats', icon: '📈' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Admin header with back button */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/tools"
                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回工具箱
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">系统管理控制面板</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <nav className="flex space-x-8 px-6" role="navigation">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-4 pb-4 text-sm font-medium border-b-2 ${
                    pathname === item.href
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
