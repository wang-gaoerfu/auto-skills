import { MainLayout } from "@/components/layout/main-layout"
import { MCPList } from "@/components/mcp/mcp-list"

export default function MCPPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">MCP 管理</h1>
          <p className="mt-2 text-muted-foreground">
            管理 Model Context Protocol 服务器配置
          </p>
        </div>
        <MCPList />
      </div>
    </MainLayout>
  )
}
