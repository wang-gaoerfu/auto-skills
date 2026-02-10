'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { theme, toggleTheme, mounted } = useTheme()

  const navigation = [
    { name: '仪表板', href: '/dashboard', icon: '📊' },
    { name: '工具箱', href: '/tools', icon: '🧰' },
    { name: '会员中心', href: '/membership', icon: '💎' },
    { name: '个人中心', href: '/profile', icon: '👤' },
  ]

  const adminNavigation = [
    { name: '用户管理', href: '/admin/users', icon: '👥' },
    { name: '会员审核', href: '/admin/membership', icon: '✅' },
    { name: '工具管理', href: '/admin/tools', icon: '🔧' },
    { name: '统计分析', href: '/admin/stats', icon: '📈' },
  ]

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Auto-Tools</span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              {session?.user?.role === 'ADMIN' && (
                <>
                  <div className="border-l border-gray-300 dark:border-gray-600 mx-2"></div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="切换主题"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                pathname === item.href ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center py-2 px-3 text-gray-600 dark:text-gray-400"
          >
            <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="text-xs">主题</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
