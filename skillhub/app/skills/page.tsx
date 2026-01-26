import { MainLayout } from "@/components/layout/main-layout"
import { SkillsList } from "@/components/skills/skills-list"

export default function SkillsPage() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Skills 管理</h1>
          <p className="mt-2 text-muted-foreground">
            管理和查看所有可用的 Claude Code 技能
          </p>
        </div>
        <SkillsList />
      </div>
    </MainLayout>
  )
}
