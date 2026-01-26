import { MainLayout } from "@/components/layout/main-layout"
import { ToolsGrid } from "@/components/tools/tools-grid"

export default function ToolsPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">工具集</h1>
          <p className="mt-2 text-muted-foreground">
            开发者工具和工作流，提高开发效率
          </p>
        </div>
        <ToolsGrid />
      </div>
    </MainLayout>
  )
}
