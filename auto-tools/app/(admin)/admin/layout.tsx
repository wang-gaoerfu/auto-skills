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
    <div className="space-y-6">
      {/* Admin header */}
      <div className="bg-blue-600 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-white">管理后台</h1>
        <p className="text-blue-100 mt-1">系统管理控制面板</p>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                pathname === item.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
