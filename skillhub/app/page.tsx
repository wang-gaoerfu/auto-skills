import Link from "next/link"
import { Puzzle, Server, Wrench, FileText, Settings } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold mb-4">SkillHub</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Skills 管理中心 - 管理和应用你的 Claude Code 技能
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/skills"
            className="flex items-center gap-3 p-6 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-3 bg-primary/10 rounded-lg">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Skills 管理</h3>
              <p className="text-sm text-muted-foreground">浏览、创建、编辑技能</p>
            </div>
          </Link>

          <Link
            href="/mcp"
            className="flex items-center gap-3 p-6 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-3 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">MCP 管理</h3>
              <p className="text-sm text-muted-foreground">配置和管理 MCP 服务器</p>
            </div>
          </Link>

          <Link
            href="/tools"
            className="flex items-center gap-3 p-6 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-3 bg-primary/10 rounded-lg">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">工具集</h3>
              <p className="text-sm text-muted-foreground">需求分析、架构设计等工具</p>
            </div>
          </Link>

          <Link
            href="/docs"
            className="flex items-center gap-3 p-6 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">文档中心</h3>
              <p className="text-sm text-muted-foreground">查看项目文档和使用指南</p>
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
          >
            <Settings className="h-4 w-4" />
            系统设置
          </Link>
        </div>
      </div>
    </div>
  )
}
