'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'

interface DocContent {
  title: string
  content: string
  toc?: Array<{
    id: string
    text: string
    level: number
  }>
}

export function DocViewer({ docSlug }: { docSlug: string }) {
  const [content, setContent] = useState<DocContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch(`/api/docs/${docSlug}`)
        if (!response.ok) {
          router.push('/docs')
          return
        }
        const data = await response.json()
        setContent(data.content)
      } catch (error) {
        console.error('Error fetching doc:', error)
        router.push('/docs')
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
  }, [docSlug, router])

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2, h3, h4')
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect()
        if (rect.top >= 0 && rect.top < 200) {
          setActiveSection(heading.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [content])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!content) {
    return <div className="text-center py-12">文档不存在</div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 返回按钮 */}
      <Link href="/docs">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回文档列表
        </Button>
      </Link>

      <div className="flex gap-8">
        {/* 主内容 */}
        <div className="flex-1">
          <h1 className="mb-8 text-3xl font-bold">{content.title}</h1>

          <article className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
                h2: ({ node, ...props }) => {
                  const id = (props.children as string)?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  return <h2 id={id} className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20" {...props} />
                },
                h3: ({ node, ...props }) => {
                  const id = (props.children as string)?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  return <h3 id={id} className="text-xl font-semibold mt-6 mb-3 scroll-mt-20" {...props} />
                },
                p: ({ node, ...props }) => <p className="my-4 leading-7" {...props} />,
                a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props} />
                  ) : (
                    <code className="block rounded-lg bg-muted p-4 text-sm font-mono" {...props} />
                  ),
                pre: ({ node, ...props }) => <pre className="overflow-x-auto rounded-lg bg-muted p-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc" {...props} />,
                ol: ({ node, ...props }) => <ol className="my-4 ml-6 list-decimal" {...props} />,
                li: ({ node, ...props }) => <li className="my-1" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="bg-muted px-4 py-2 text-left font-medium" {...props} />
                ),
                td: ({ node, ...props }) => <td className="border-t px-4 py-2" {...props} />,
              }}
            >
              {content.content}
            </ReactMarkdown>
          </article>
        </div>

        {/* 目录 */}
        {content.toc && content.toc.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <h3 className="mb-4 font-semibold">目录</h3>
              <nav className="space-y-2 text-sm">
                {content.toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`block truncate text-left hover:text-primary ${
                      activeSection === item.id ? 'font-medium text-primary' : 'text-muted-foreground'
                    } ${item.level === 3 ? 'pl-4' : ''}`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
