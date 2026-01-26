import { MainLayout } from "@/components/layout/main-layout"
import { WorkflowDetail } from "@/components/workflow/workflow-detail"

interface WorkflowDetailPageProps {
  params: {
    id: string
  }
}

export default function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  return (
    <MainLayout>
      <div className="p-8">
        <WorkflowDetail workflowId={params.id} />
      </div>
    </MainLayout>
  )
}
