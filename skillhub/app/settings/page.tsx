import { MainLayout } from "@/components/layout/main-layout"
import { SettingsPage } from "@/components/settings/settings-page"

export default function SettingsRouter() {
  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="mt-2 text-muted-foreground">
            管理应用偏好和数据
          </p>
        </div>
        <SettingsPage />
      </div>
    </MainLayout>
  )
}
