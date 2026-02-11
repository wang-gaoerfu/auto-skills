'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export default function HomePage() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Header with Logo and Theme toggle - Full width */}
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Auto-Tools</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">墨飞科技工作室 · 巨飞AI</p>
            </div>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
            aria-label="切换主题"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Hero section - Centered content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            自动化工具平台
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            自动化工具平台 - 上百种实用工具，一站式解决您的需求
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              免费注册
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl"
            >
              立即登录
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">🧰</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">上百种工具</h3>
            <p className="text-gray-600 dark:text-gray-400">
              涵盖文本处理、数据转换、开发工具等多个类别
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">会员制度</h3>
            <p className="text-gray-600 dark:text-gray-400">
              多种套餐选择，满足不同需求
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">即开即用</h3>
            <p className="text-gray-600 dark:text-gray-400">
              无需安装，浏览器直接使用，快速高效
            </p>
          </div>
        </div>

        {/* Tool categories preview */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            工具分类
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: '文本处理', icon: '📝', desc: '字数统计、格式转换' },
              { name: '数据转换', icon: '🔄', desc: 'JSON、XML、Base64' },
              { name: '开发工具', icon: '👨‍💻', desc: 'UUID、Hash、正则' },
              { name: '加密解密', icon: '🔒', desc: '各种加密算法' },
              { name: '时间日期', icon: '📅', desc: '时间戳、格式转换' },
            ].map((cat) => (
              <div
                key={cat.name}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-4">
              开始使用 Auto-Tools
            </h3>
            <p className="text-blue-100 mb-6">
              免费注册即可使用基础工具，升级会员解锁全部功能
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-lg"
            >
              免费注册
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            &copy; 2024 Auto-Tools. All rights reserved.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            由 <span className="text-blue-600 dark:text-blue-400 font-medium">巨飞AI</span> 精心打造 · <span className="text-blue-600 dark:text-blue-400 font-medium">墨飞科技工作室</span> 出品
          </p>
        </div>
      </footer>
    </div>
  )
}
