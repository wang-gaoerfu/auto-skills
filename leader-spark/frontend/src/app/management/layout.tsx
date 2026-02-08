'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Files,
  FolderTree,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/chat/ThemeSwitcher';
import { UserMenu } from '@/components/chat/UserMenu';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: '仪表盘',
    href: '/management',
    icon: LayoutDashboard,
  },
  {
    title: '知识库管理',
    href: '/management/knowledge',
    icon: Files,
  },
  {
    title: '分类管理',
    href: '/management/categories',
    icon: FolderTree,
  },
  {
    title: '对话记录',
    href: '/management/conversations',
    icon: MessageSquare,
  },
  {
    title: '数据统计',
    href: '/management/analytics',
    icon: BarChart3,
  },
  {
    title: '系统设置',
    href: '/management/settings',
    icon: Settings,
  },
];

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg">
            🔄
          </div>
          {!collapsed && (
            <span className="ml-3 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Spark 管理
            </span>
          )}
        </div>

        {/* 上传按钮 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Button
            className={cn(
              'w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90',
              collapsed && 'px-2'
            )}
          >
            <Upload className="w-4 h-4" />
            {!collapsed && <span className="ml-2">上传文档</span>}
          </Button>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/management' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-slate-100 dark:bg-slate-800',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 折叠按钮 */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
          <h1 className="text-lg font-semibold">{menuItems.find((item) => pathname === item.href || (item.href !== '/management' && pathname.startsWith(item.href)))?.title || '管理后台'}</h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <UserMenu />
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
