import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenTool, BookOpen, FileText, Settings, Crown, Users, FolderOpen, Layers } from "lucide-react"
import Link from "next/link"
import { HeaderNav } from "@/components/layout/user-nav"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = session.user

  // 从数据库获取最新的会员信息
  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
    select: { plan: true, status: true, expiresAt: true }
  })

  const currentPlan = membership?.plan || "FREE"

  return (
    <div className="min-h-screen bg-background">
      <HeaderNav membershipPlan={currentPlan} />

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
                <FolderOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">我的项目</CardTitle>
                <CardDescription>查看所有项目</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/knowledge">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">知识库</CardTitle>
                <CardDescription>管理人物和设定</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/books">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <Layers className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">智能拆书</CardTitle>
                <CardDescription>AI 分析书籍结构</CardDescription>
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

        {/* 会员信息 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                <CardTitle>会员信息</CardTitle>
              </div>
              <Link href="/membership">
                <Button variant="outline" size="sm">升级会员</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">当前等级</p>
                <p className="text-2xl font-bold text-primary">
                  {currentPlan === "FREE" ? "免费版" :
                   currentPlan === "VIP" ? "VIP" : "专业版"}
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">权益说明</p>
                <p className="text-sm">
                  {currentPlan === "FREE" ? "每日5万字 · 1个项目 · 基础AI模型" :
                   currentPlan === "VIP" ? "无限字数 · 10个项目 · DeepSeek V3" :
                   "无限字数 · 无限项目 · DeepSeek + Kimi"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
