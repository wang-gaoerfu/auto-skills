import { auth } from "@/lib/auth"
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, BookOpen, Users, Layers, FolderOpen, Settings, Crown } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // 如果已登录，显示功能入口
  if (session) {
    return (
      <div className="min-h-screen bg-background">
        {/* 顶部导航 */}
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              <span className="text-xl font-bold">墨飞小说创造</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm">设置</Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* 主内容 - 已登录用户的功能入口 */}
        <main className="container px-4 py-12">
          {/* 欢迎区域 */}
          <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              欢迎回来，            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              选择一个功能开始创作
            </p>
          </div>

          {/* 功能入口卡片 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <Link href="/dashboard">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                <FolderOpen className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>项目管理</CardTitle>
                <CardDescription>
                  查看和管理你的小说项目
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                创建新项目、编辑章节、管理大纲
              </CardContent>
            </Card>
            </Link>

            <Link href="/knowledge">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Users className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>知识库</CardTitle>
                  <CardDescription>
                    管理人物和设定
                  </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                人物、世界观、剧情设定一目了然
              </CardContent>
            </Card>
            </Link>

            <Link href="/books">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Layers className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>智能拆书</CardTitle>
                  <CardDescription>
                    AI 分析书籍结构
                  </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                上传书籍，AI 自动分析章节和风格
              </CardContent>
            </Card>
            </Link>

            <Link href="/membership">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Crown className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>会员中心</CardTitle>
                  <CardDescription>
                    查看会员权益
                  </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                升级会员获取更多功能
              </CardContent>
            </Card>
            </Link>
          </div>

          {/* 快捷操作 */}
          <div className="flex justify-center gap-4">
            <Link href="/projects/new">
              <Button size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                开始创作
              </Button>
            </Link>
          </div>
        </main>

        {/* 底部 */}
        <footer className="border-t py-6">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            <p>© 2026 墨飞小说创造. 保留所有权利.</p>
          </div>
        </footer>
      </div>
    );
  }

  // 未登录状态 - 显示首页介绍
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">墨飞小说创造</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container px-4 py-12">
        {/* Hero 区域 */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            用AI释放你的创作潜能
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            智能化的小说创作平台，从大纲到正文，AI全程辅助。
            支持多种文学风格，让创作变得简单高效。
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button size="lg">开始创作</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">了解更多</Button>
            </Link>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>AI智能生成</CardTitle>
              <CardDescription>
                一键生成大纲、章节、正文内容
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>知识库管理</CardTitle>
              <CardDescription>
                人物、世界观、剧情设定一目了然
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <PenTool className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>专业编辑器</CardTitle>
              <CardDescription>
                富文本编辑，支持AI润色、扩写
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Layers className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>智能拆书</CardTitle>
              <CardDescription>
                AI分析书籍结构、风格、人物
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 会员方案 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">会员方案</h2>
          <p className="text-muted-foreground">选择适合你的创作方案</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>免费版</CardTitle>
              <CardDescription>适合新手体验</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">¥0<span className="text-base font-normal">/月</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 每日5万字</li>
                <li>✓ 1个项目</li>
                <li>✓ GLM-4-Flash模型</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle>VIP</CardTitle>
              <CardDescription>适合进阶创作者</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">¥29<span className="text-base font-normal">/月</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 无限字数</li>
                <li>✓ 10个项目</li>
                <li>✓ DeepSeek V3模型</li>
                <li>✓ 高级提示词</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>专业版</CardTitle>
              <CardDescription>适合专业作家</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">¥99<span className="text-base font-normal">/月</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 无限字数</li>
                <li>✓ 无限项目</li>
                <li>✓ DeepSeek + Kimi</li>
                <li>✓ API访问</li>
                <li>✓ 优先支持</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 底部 */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 墨飞小说创造. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
}
