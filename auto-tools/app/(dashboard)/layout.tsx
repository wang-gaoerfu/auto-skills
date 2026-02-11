'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useTheme } from '@/lib/theme'
import { getMembershipDisplayName } from '@/lib/membership'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              {/* Logo Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {/* Brand Name */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Auto-Tools</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">自动化工具平台</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              {session?.user?.role === 'ADMIN' && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-2"></div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        pathname === item.href
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <span className="mr-1.5">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all"
                aria-label="切换主题"
              >
                <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
              </button>

              {/* User info */}
              <div className="hidden sm:flex items-center space-x-3 pl-2 border-l border-gray-200 dark:border-slate-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session?.user?.name || '用户'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.membershipStatus === 'APPROVED'
                      ? getMembershipDisplayName(session?.user?.membershipPlan)
                      : '免费用户'}
                  </p>
                </div>
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                  {(session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                pathname === item.href ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center py-2 px-4 text-gray-600 dark:text-gray-400"
          >
            <span className="text-2xl">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="text-xs mt-1">主题</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
