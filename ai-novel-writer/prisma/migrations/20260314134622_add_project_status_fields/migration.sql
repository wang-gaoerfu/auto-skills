-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "targetChapters" INTEGER,
ADD COLUMN     "targetWords" INTEGER;

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");
