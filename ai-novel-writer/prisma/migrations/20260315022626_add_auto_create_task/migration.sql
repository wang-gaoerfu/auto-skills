-- CreateTable
CREATE TABLE "auto_create_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStage" TEXT NOT NULL DEFAULT '',
    "progress" JSONB NOT NULL DEFAULT '{}',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT NOT NULL,
    "novelLength" TEXT NOT NULL,
    "targetChapters" INTEGER NOT NULL DEFAULT 3,
    "generatedChapters" INTEGER NOT NULL DEFAULT 0,
    "totalWordCount" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_create_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_create_tasks_userId_idx" ON "auto_create_tasks"("userId");

-- CreateIndex
CREATE INDEX "auto_create_tasks_projectId_idx" ON "auto_create_tasks"("projectId");

-- CreateIndex
CREATE INDEX "auto_create_tasks_status_idx" ON "auto_create_tasks"("status");

-- AddForeignKey
ALTER TABLE "auto_create_tasks" ADD CONSTRAINT "auto_create_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_create_tasks" ADD CONSTRAINT "auto_create_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
