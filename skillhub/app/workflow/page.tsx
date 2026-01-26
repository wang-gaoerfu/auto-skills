import { MainLayout } from "@/components/layout/main-layout"
import { WorkflowHistory } from "@/components/workflow/workflow-history"

export default function WorkflowPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">工作流历史</h1>
          <p className="mt-2 text-muted-foreground">
            查看所有工具的执行历史记录
          </p>
        </div>
        <WorkflowHistory />
      </div>
    </MainLayout>
  )
}
