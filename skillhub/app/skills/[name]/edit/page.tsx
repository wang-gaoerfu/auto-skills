import { MainLayout } from "@/components/layout/main-layout"
import { SkillEditor } from "@/components/skills/skill-editor"

interface SkillEditPageProps {
  params: {
    name: string
  }
}

export default function SkillEditPage({ params }: SkillEditPageProps) {
  return (
    <MainLayout>
      <div className="p-8">
        <SkillEditor skillName={params.name} />
      </div>
    </MainLayout>
  )
}
