import { MainLayout } from "@/components/layout/main-layout"
import { MCPEditor } from "@/components/mcp/mcp-editor"

interface MCPEditPageProps {
  params: {
    name: string
  }
}

export default function MCPEditPage({ params }: MCPEditPageProps) {
  return (
    <MainLayout>
      <div className="p-8">
        <MCPEditor serverName={params.name} />
      </div>
    </MainLayout>
  )
}
