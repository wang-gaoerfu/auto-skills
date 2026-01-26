import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">SkillHub</h1>
        <p className="mt-4 text-muted-foreground">
          Skills 管理中心 - 正在开发中
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/skills"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            查看 Skills
          </Link>
          <Link
            href="/mcp"
            className="px-4 py-2 border border-border rounded-md hover:bg-muted"
          >
            MCP 管理
          </Link>
        </div>
      </div>
    </div>
  )
}
