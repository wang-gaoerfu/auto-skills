'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Download, Upload, Trash2 } from "lucide-react"

export function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) setTheme(savedTheme)

    const savedSidebar = localStorage.getItem('sidebarCollapsed')
    if (savedSidebar) setSidebarCollapsed(savedSidebar === 'true')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark')
  }

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/data')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `skillhub-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const content = await file.text()
        const data = JSON.parse(content)

        const response = await fetch('/api/export/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          alert('导入成功！页面将重新加载。')
          window.location.reload()
        }
      } catch (error) {
        alert('导入失败：文件格式错误')
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    if (!confirm('确定要清除所有本地数据吗？此操作不可撤销。')) {
      return
    }

    if (!confirm('再次确认：这将删除所有本地存储的数据！')) {
      return
    }

    try {
      await fetch('/api/export/clear', { method: 'POST' })
      localStorage.clear()
      alert('数据已清除，页面将重新加载。')
      window.location.reload()
    } catch (error) {
      alert('清除数据失败')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle>外观</CardTitle>
          <CardDescription>自定义应用的外观和行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">主题模式</div>
              <div className="text-sm text-muted-foreground">
                当前: {theme === 'light' ? '浅色' : '深色'}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  切换到深色
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  切换到浅色
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">侧边栏</div>
              <div className="text-sm text-muted-foreground">
                当前: {sidebarCollapsed ? '收起' : '展开'}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleSidebar}>
              {sidebarCollapsed ? '展开' : '收起'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>导入、导出和清除应用数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">导出数据</div>
              <div className="text-sm text-muted-foreground">
                下载所有本地数据的备份文件
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">导入数据</div>
              <div className="text-sm text-muted-foreground">
                从备份文件恢复数据
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-destructive">清除数据</div>
              <div className="text-sm text-muted-foreground">
                删除所有本地数据（不可撤销）
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearData}>
              <Trash2 className="mr-2 h-4 w-4" />
              清除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 关于 */}
      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">应用名称</dt>
              <dd>SkillHub</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">版本</dt>
              <dd>0.1.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">技术栈</dt>
              <dd>Next.js 14 + React + Prisma</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">数据库</dt>
              <dd>SQLite</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
