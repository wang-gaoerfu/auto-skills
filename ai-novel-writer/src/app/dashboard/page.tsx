import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenTool, BookOpen, FileText, Settings, LogOut, User } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">AI小说创作能手</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{user.name || user.email}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-primary font-medium">
                {user.membershipPlan === "FREE" ? "免费版" :
                 user.membershipPlan === "VIP" ? "VIP" : "专业版"}
              </span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">欢迎回来，{user.name || "创作者"}</h1>

        {/* 快捷操作 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Link href="/projects/new">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">新建项目</CardTitle>
                <CardDescription>创建新的小说项目</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/projects">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">我的项目</CardTitle>
                <CardDescription>查看所有项目</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/knowledge">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <PenTool className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">知识库</CardTitle>
                <CardDescription>管理人物和设定</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">设置</CardTitle>
                <CardDescription>账户和系统设置</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* 最近项目 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">最近项目</h2>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无项目</p>
              <p className="text-sm">点击"新建项目"开始创作</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
