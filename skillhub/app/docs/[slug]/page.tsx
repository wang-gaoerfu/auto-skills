import { MainLayout } from "@/components/layout/main-layout"
import { DocViewer } from "@/components/docs/doc-viewer"

interface DocPageProps {
  params: {
    slug: string
  }
}

export default function DocPage({ params }: DocPageProps) {
  return (
    <MainLayout>
      <DocViewer docSlug={params.slug} />
    </MainLayout>
  )
}
