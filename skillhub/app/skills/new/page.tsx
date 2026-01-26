import { MainLayout } from "@/components/layout/main-layout"
import { CreateSkillWizard } from "@/components/skills/create-skill-wizard"

export default function NewSkillPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">创建新技能</h1>
          <p className="mt-2 text-muted-foreground">
            通过向导快速创建一个新的 Claude Code 技能
          </p>
        </div>
        <CreateSkillWizard />
      </div>
    </MainLayout>
  )
}
