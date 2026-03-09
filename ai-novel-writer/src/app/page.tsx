import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, BookOpen, Users } from "lucide-react";

export default function Home() {
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
            <Button variant="ghost">登录</Button>
            <Button>注册</Button>
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
            <Button size="lg">开始创作</Button>
            <Button size="lg" variant="outline">了解更多</Button>
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
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>多会员等级</CardTitle>
              <CardDescription>
                免费版、VIP、专业版满足不同需求
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
          <p>© 2026 AI小说创作能手. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
}
