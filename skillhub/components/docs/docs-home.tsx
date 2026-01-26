'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Doc {
  slug: string
  title: string
  description?: string
  category: string
}

const docCategories = [
  { id: 'getting-started', name: '快速入门', docs: ['00-getting-started', '01-skill-structure', '02-develop-first-skill'] },
  { id: 'advanced', name: '进阶指南', docs: ['03-advanced-topics', '04-faq'] },
  { id: 'requirements', name: '需求分析', docs: [] },
]

export function DocsHome() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredDocs, setFilteredDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch('/api/docs')
        const data = await response.json()
        setDocs(data.docs || [])
        setFilteredDocs(data.docs || [])
      } catch (error) {
        console.error('Error fetching docs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocs()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = docs.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDocs(filtered)
    } else {
      setFilteredDocs(docs)
    }
  }, [searchQuery, docs])

  const getDocBySlug = (slug: string) => {
    return docs.find(doc => doc.slug === slug)
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-8">
      {/* 搜索框 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* 文档分类 */}
      {!searchQuery && (
        <div className="space-y-8">
          {docCategories.map(category => {
            const categoryDocs = category.docs.map(slug => getDocBySlug(slug)).filter(Boolean)

            if (categoryDocs.length === 0) return null

            return (
              <div key={category.id}>
                <h2 className="mb-4 text-xl font-semibold">{category.name}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryDocs.map((doc: any) => (
                    <Link key={doc.slug} href={`/docs/${doc.slug}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{doc.title}</CardTitle>
                              {doc.description && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  {doc.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 搜索结果 */}
      {searchQuery && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            搜索结果 ({filteredDocs.length})
          </h2>
          {filteredDocs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredDocs.map(doc => (
                <Link key={doc.slug} href={`/docs/${doc.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle>{doc.title}</CardTitle>
                      {doc.description && (
                        <CardDescription>{doc.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>没有找到匹配的文档</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
