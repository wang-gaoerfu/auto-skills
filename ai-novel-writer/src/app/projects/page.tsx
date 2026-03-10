import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenTool, Plus, BookOpen } from "lucide-react"
import Link from "next/link"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"

export default async function ProjectsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { chapters: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">AI小说创作能手</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">返回仪表盘</Button>
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">我的项目</h1>
            <p className="text-muted-foreground mt-1">
              管理你的小说创作项目
            </p>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建项目
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">暂无项目</h3>
              <p className="text-muted-foreground mb-4">
                点击上方"新建项目"开始你的创作之旅
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个项目
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex-1 min-w-0"
                    >
                      <CardTitle className="text-lg truncate hover:text-primary">
                        {project.title}
                      </CardTitle>
                    </Link>
                    <ProjectCardMenu
                      projectId={project.id}
                      projectTitle={project.title}
                    />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || "暂无描述"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project._count.chapters} 个章节</span>
                    <span>
                      更新于 {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
