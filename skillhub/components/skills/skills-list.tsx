'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Eye, Search, Filter, Plus } from "lucide-react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  category: string
  path: string
  useCount: number
}

export function SkillsList() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchSkills = async (sync = false) => {
    try {
      const url = sync ? '/api/skills?sync=true' : '/api/skills'
      const response = await fetch(url)
      const data = await response.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    await fetch('/api/skills', { method: 'POST' })
    await fetchSkills(true)
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(skills.map(s => s.category))]
    return cats
  }, [skills])

  // 过滤技能
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch =
        searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || skill.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [skills, searchQuery, selectedCategory])

  // 按分类分组
  const groupedSkills = useMemo(() => {
    return filteredSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    }, {} as Record<string, Skill[]>)
  }, [filteredSkills])

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          共 {skills.length} 个技能，显示 {filteredSkills.length} 个
        </div>
        <div className="flex gap-2">
          <Link href="/skills/new">
            <Button variant="default" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新建技能
            </Button>
          </Link>
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步技能'}
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索技能名称、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* 分类过滤 */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '全部分类' : cat === 'builtin' ? '内置技能' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 技能列表 */}
      {Object.entries(groupedSkills).length > 0 ? (
        Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category}>
            <h2 className="mb-4 text-xl font-semibold capitalize">
              {category === 'builtin' ? '内置技能' : category}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorySkills.map((skill) => (
                <Card key={skill.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{skill.displayName}</CardTitle>
                        <CardDescription className="mt-1 font-mono text-xs">
                          {skill.name}
                        </CardDescription>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        v{skill.version}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {skill.description}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/skills/${skill.name}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          查看
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all'
              ? '没有找到匹配的技能'
              : '暂无技能，点击"同步技能"按钮从文件系统加载'}
          </p>
        </div>
      )}
    </div>
  )
}
