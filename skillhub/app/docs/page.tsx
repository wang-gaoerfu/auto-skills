import { MainLayout } from "@/components/layout/main-layout"
import { DocsHome } from "@/components/docs/docs-home"

export default function DocsPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">文档中心</h1>
          <p className="mt-2 text-muted-foreground">
            项目文档、API 参考和使用指南
          </p>
        </div>
        <DocsHome />
      </div>
    </MainLayout>
  )
}
