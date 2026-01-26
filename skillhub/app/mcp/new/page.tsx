import { MainLayout } from "@/components/layout/main-layout"
import { AddMCPWizard } from "@/components/mcp/add-mcp-wizard"

export default function NewMCPPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">添加 MCP 服务器</h1>
          <p className="mt-2 text-muted-foreground">
            添加新的 Model Context Protocol 服务器
          </p>
        </div>
        <AddMCPWizard />
      </div>
    </MainLayout>
  )
}
