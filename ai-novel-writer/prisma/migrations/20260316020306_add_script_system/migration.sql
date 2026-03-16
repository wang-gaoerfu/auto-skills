-- CreateTable
CREATE TABLE "script_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "sourceProjectId" TEXT,
    "sourceNovelTitle" TEXT,
    "genre" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subStatus" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "generationLock" TEXT,
    "lockAcquiredAt" TIMESTAMP(3),
    "settings" JSONB,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalShots" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalScenes" INTEGER NOT NULL DEFAULT 0,
    "lastExportAt" TIMESTAMP(3),
    "exportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_sources" (
    "id" TEXT NOT NULL,
    "scriptProjectId" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "sourceChapterId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_characters" (
    "id" TEXT NOT NULL,
    "scriptProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "description" TEXT,
    "appearance" JSONB,
    "personality" TEXT,
    "relationships" JSONB,
    "avatarImage" TEXT,
    "firstAppearChapter" INTEGER,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "vectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_scenes" (
    "id" TEXT NOT NULL,
    "scriptProjectId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sceneNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "timeOfDay" TEXT,
    "location" TEXT,
    "description" TEXT,
    "mood" TEXT,
    "weather" TEXT,
    "lighting" TEXT,
    "visualPrompt" TEXT,
    "referenceImage" TEXT,
    "soundDesign" JSONB,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_shots" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "shotNumber" TEXT NOT NULL,
    "shotType" TEXT NOT NULL,
    "angle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visual" JSONB,
    "imagePrompt" TEXT,
    "generatedImageUrl" TEXT,
    "audio" JSONB,
    "camera" JSONB,
    "characterIds" TEXT[],
    "dialogueCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 3,
    "regenerateCount" INTEGER NOT NULL DEFAULT 0,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "projectCount" INTEGER NOT NULL DEFAULT 0,
    "dailyGenerations" INTEGER NOT NULL DEFAULT 0,
    "monthlyGenerations" INTEGER NOT NULL DEFAULT 0,
    "lastGenerationDate" TIMESTAMP(3),
    "redemptionCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_generation_tasks" (
    "id" TEXT NOT NULL,
    "scriptProjectId" TEXT NOT NULL,
    "chapterOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "checkpoint" JSONB,
    "error" TEXT,
    "errorMessage" TEXT,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_generation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_exports" (
    "id" TEXT NOT NULL,
    "scriptProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "watermark" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_redemption_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_redemption_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_cost_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_cost_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "performance" JSONB,
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_system_configs" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "dailyBudgetLimit" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "monthlyBudgetLimit" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "userDailyCostCap" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "projectCostCap" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "alertThresholdPercent" INTEGER NOT NULL DEFAULT 80,
    "generationPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "script_projects_userId_idx" ON "script_projects"("userId");

-- CreateIndex
CREATE INDEX "script_projects_status_idx" ON "script_projects"("status");

-- CreateIndex
CREATE INDEX "script_projects_createdAt_idx" ON "script_projects"("createdAt");

-- CreateIndex
CREATE INDEX "script_sources_scriptProjectId_idx" ON "script_sources"("scriptProjectId");

-- CreateIndex
CREATE INDEX "script_sources_order_idx" ON "script_sources"("order");

-- CreateIndex
CREATE INDEX "script_characters_scriptProjectId_idx" ON "script_characters"("scriptProjectId");

-- CreateIndex
CREATE INDEX "script_scenes_scriptProjectId_idx" ON "script_scenes"("scriptProjectId");

-- CreateIndex
CREATE INDEX "script_scenes_order_idx" ON "script_scenes"("order");

-- CreateIndex
CREATE INDEX "script_shots_sceneId_idx" ON "script_shots"("sceneId");

-- CreateIndex
CREATE INDEX "script_shots_order_idx" ON "script_shots"("order");

-- CreateIndex
CREATE INDEX "script_shots_status_idx" ON "script_shots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "script_memberships_userId_key" ON "script_memberships"("userId");

-- CreateIndex
CREATE INDEX "script_memberships_userId_idx" ON "script_memberships"("userId");

-- CreateIndex
CREATE INDEX "script_memberships_status_idx" ON "script_memberships"("status");

-- CreateIndex
CREATE INDEX "script_generation_tasks_scriptProjectId_idx" ON "script_generation_tasks"("scriptProjectId");

-- CreateIndex
CREATE INDEX "script_generation_tasks_status_idx" ON "script_generation_tasks"("status");

-- CreateIndex
CREATE INDEX "script_generation_tasks_createdAt_idx" ON "script_generation_tasks"("createdAt");

-- CreateIndex
CREATE INDEX "script_exports_scriptProjectId_idx" ON "script_exports"("scriptProjectId");

-- CreateIndex
CREATE INDEX "script_exports_userId_idx" ON "script_exports"("userId");

-- CreateIndex
CREATE INDEX "script_exports_createdAt_idx" ON "script_exports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "script_redemption_codes_code_key" ON "script_redemption_codes"("code");

-- CreateIndex
CREATE INDEX "script_redemption_codes_code_idx" ON "script_redemption_codes"("code");

-- CreateIndex
CREATE INDEX "script_redemption_codes_status_idx" ON "script_redemption_codes"("status");

-- CreateIndex
CREATE INDEX "script_redemption_codes_plan_idx" ON "script_redemption_codes"("plan");

-- CreateIndex
CREATE INDEX "script_cost_logs_userId_idx" ON "script_cost_logs"("userId");

-- CreateIndex
CREATE INDEX "script_cost_logs_projectId_idx" ON "script_cost_logs"("projectId");

-- CreateIndex
CREATE INDEX "script_cost_logs_createdAt_idx" ON "script_cost_logs"("createdAt");

-- CreateIndex
CREATE INDEX "prompt_versions_promptKey_isActive_idx" ON "prompt_versions"("promptKey", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_promptKey_version_key" ON "prompt_versions"("promptKey", "version");

-- AddForeignKey
ALTER TABLE "script_projects" ADD CONSTRAINT "script_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_projects" ADD CONSTRAINT "script_projects_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_sources" ADD CONSTRAINT "script_sources_scriptProjectId_fkey" FOREIGN KEY ("scriptProjectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_characters" ADD CONSTRAINT "script_characters_scriptProjectId_fkey" FOREIGN KEY ("scriptProjectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_scenes" ADD CONSTRAINT "script_scenes_scriptProjectId_fkey" FOREIGN KEY ("scriptProjectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_scenes" ADD CONSTRAINT "script_scenes_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "script_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_shots" ADD CONSTRAINT "script_shots_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "script_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_memberships" ADD CONSTRAINT "script_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_memberships" ADD CONSTRAINT "script_memberships_redemptionCodeId_fkey" FOREIGN KEY ("redemptionCodeId") REFERENCES "script_redemption_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_generation_tasks" ADD CONSTRAINT "script_generation_tasks_scriptProjectId_fkey" FOREIGN KEY ("scriptProjectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_exports" ADD CONSTRAINT "script_exports_scriptProjectId_fkey" FOREIGN KEY ("scriptProjectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_exports" ADD CONSTRAINT "script_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_cost_logs" ADD CONSTRAINT "script_cost_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_cost_logs" ADD CONSTRAINT "script_cost_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "script_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
