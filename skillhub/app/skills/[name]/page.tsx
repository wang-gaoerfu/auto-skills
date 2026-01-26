import { MainLayout } from "@/components/layout/main-layout"
import { SkillDetail } from "@/components/skills/skill-detail"

interface SkillPageProps {
  params: {
    name: string
  }
}

export default function SkillPage({ params }: SkillPageProps) {
  return (
    <MainLayout>
      <SkillDetail skillName={params.name} />
    </MainLayout>
  )
}
