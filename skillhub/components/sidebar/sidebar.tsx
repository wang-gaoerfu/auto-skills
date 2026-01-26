'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Puzzle,
  Server,
  Wrench,
  FileText,
  Settings,
} from "lucide-react"

const navItems = [
  {
    title: 'Skills 管理',
    href: '/skills',
    icon: Puzzle,
  },
  {
    title: 'MCP 管理',
    href: '/mcp',
    icon: Server,
  },
  {
    title: '工具集',
    href: '/tools',
    icon: Wrench,
    children: [
      { title: '需求分析', href: '/tools/requirements' },
      { title: '架构设计', href: '/tools/architecture' },
    ],
  },
  {
    title: '文档中心',
    href: '/docs',
    icon: FileText,
  },
  {
    title: '设置',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-xl font-bold">SkillHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>

              {item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                        pathname === child.href
                          ? "bg-primary/20 text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          SkillHub v0.1.0
        </div>
      </div>
    </div>
  )
}
