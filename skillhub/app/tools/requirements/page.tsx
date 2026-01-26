import { MainLayout } from "@/components/layout/main-layout"
import { RequirementsTool } from "@/components/tools/requirements-tool"

export default function RequirementsPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">需求分析工具</h1>
          <p className="mt-2 text-muted-foreground">
            从需求澄清到文档生成，完整的需求分析解决方案
          </p>
        </div>
        <RequirementsTool />
      </div>
    </MainLayout>
  )
}
