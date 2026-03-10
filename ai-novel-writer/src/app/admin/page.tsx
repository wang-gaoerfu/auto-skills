import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PenTool,
  Users,
  FileText,
  Settings,
  Shield,
} from "lucide-react"

export default async function AdminPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // 获取统计数据
  const [usersCount, projectsCount, chaptersCount, usageStats] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.chapter.count(),
    prisma.usageLog.aggregate({
      _sum: { tokensUsed: true, cost: true },
    }),
  ])

  const stats = {
    users: usersCount,
    projects: projectsCount,
    chapters: chaptersCount,
    totalTokens: usageStats._sum.tokensUsed || 0,
    totalCost: ((usageStats._sum.cost || 0) / 100).toFixed(2),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">管理后台</span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">用户总数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">项目总数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">章节总数</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chapters}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI 成本</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalCost}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>查看和管理所有用户</CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// 用户表格组件
async function UserTable() {
  const users = await prisma.user.findMany({
    include: { membership: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div>
            <div className="font-medium">{user.name || user.email}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={
                user.membership?.plan === "PRO"
                  ? "default"
                  : user.membership?.plan === "VIP"
                  ? "secondary"
                  : "outline"
              }
            >
              {user.membership?.plan || "FREE"}
            </Badge>
            <Badge variant={user.isActive ? "default" : "destructive"}>
              {user.isActive ? "活跃" : "禁用"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
