import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  generateGenreChapterOutline,
  generateGenreChapterContent,
  generateText,
} from "@/lib/ai/deepseek"

// 设置 API 路由最大执行时间为 5 分钟
export const maxDuration = 300

const requestSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字"),
  description: z.string().max(500, "描述最多500字").optional(),
  genre: z.string().default("urbanReborn"),
  novelLength: z.enum(["micro", "short", "medium", "long"]).default("short"),
  aiGeneratedTitle: z.boolean().optional(),
  // 断点续传参数
  resumeTaskId: z.string().optional(),
})

// 获取目标章节数（一键创作使用较少章节数，适合快速体验）
function getTargetChapterCount(novelLength: string): number {
  const lengthConfig: Record<string, number> = {
    micro: 1,
    short: 3,    // 一键创作：3章（批量生成是5章）
    medium: 10,  // 一键创作：10章（批量生成是20章）
    long: 20,    // 一键创作：20章（批量生成是50章）
  }
  return lengthConfig[novelLength] || 3
}

// 预估 Token 消耗
function estimateTokens(chapterCount: number, hasKnowledge: boolean): number {
  // 每章约 2000-4000 token（大纲 + 内容）
  const chapterTokens = chapterCount * 3000
  // 知识库约 1500 token/类型 x 3
  const knowledgeTokens = hasKnowledge ? 0 : 4500
  // 基础开销
  const overhead = 500
  return chapterTokens + knowledgeTokens + overhead
}

// 全局任务状态存储（用于取消检测）
const taskControllers = new Map<string, { cancelled: boolean }>()

// 自动创作 API - 流式响应
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ message: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const body = await request.json()
  const { title, description, genre, novelLength, resumeTaskId } = requestSchema.parse(body)

  // 检查项目数量限制
  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  })

  const projectCount = await prisma.project.count({
    where: { userId: session.user.id },
  })

  const maxProjects =
    membership?.plan === "FREE"
      ? 1
      : membership?.plan === "VIP"
      ? 10
      : Infinity

  if (projectCount >= maxProjects && !resumeTaskId) {
    return new Response(JSON.stringify({ message: "已达项目数量上限，请升级会员" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 创建流式响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let projectId: string | null = null
      let taskId: string | null = null
      let totalTokensUsed = 0

      try {
        // ========== 断点续传检查 ==========
        if (resumeTaskId) {
          const existingTask = await prisma.autoCreateTask.findFirst({
            where: {
              id: resumeTaskId,
              userId: session.user.id,
              status: { in: ["paused", "failed"] },
            },
            include: { project: true },
          })

          if (existingTask) {
            projectId = existingTask.projectId
            taskId = existingTask.id

            send({
              type: "resume",
              taskId,
              projectId,
              message: "检测到未完成的任务，正在继续...",
              progress: existingTask.progress as { currentChapter?: number; totalChapters?: number; knowledgeGenerated?: string[] },
            })

            // 恢复进度状态
            const progress = existingTask.progress as {
              currentChapter?: number
              totalChapters?: number
              knowledgeGenerated?: string[]
            }

            // 更新任务状态为运行中
            await prisma.autoCreateTask.update({
              where: { id: taskId },
              data: { status: "running", startedAt: new Date() },
            })

            // 继续执行未完成的步骤
            await continueAutoCreate({
              controller,
              encoder,
              send,
              taskId,
              projectId: projectId!,
              title: existingTask.title,
              description: existingTask.description || "",
              genre: existingTask.genre,
              novelLength: existingTask.novelLength,
              targetChapters: existingTask.targetChapters,
              existingProgress: progress,
              totalTokensUsed,
              session,
            })
            return
          }
        }

        // ========== 新任务开始 ==========
        const targetChapters = getTargetChapterCount(novelLength)
        const estimatedTokens = estimateTokens(targetChapters, false)

        send({
          type: "start",
          estimatedTokens,
          targetChapters,
          message: `准备创建小说，预计消耗 ${estimatedTokens.toLocaleString()} tokens`,
        })

        // ========== Step 1: 创建项目 ==========
        send({
          type: "progress",
          stage: "creating_project",
          message: "正在创建项目...",
          progress: { current: 0, total: 4 }
        })

        const project = await prisma.project.create({
          data: {
            userId: session.user.id,
            title,
            description: description || null,
            genre,
            novelLength,
            status: "writing",
          },
        })
        projectId = project.id

        // 创建任务记录
        const task = await prisma.autoCreateTask.create({
          data: {
            userId: session.user.id,
            projectId,
            status: "running",
            currentStage: "creating_project",
            title,
            description: description || null,
            genre,
            novelLength,
            targetChapters,
            progress: {},
            startedAt: new Date(),
          },
        })
        taskId = task.id

        // 注册任务控制器（用于取消）
        taskControllers.set(taskId, { cancelled: false })

        send({
          type: "project_created",
          projectId,
          taskId,
          title,
        })

        // 执行自动创作流程
        await executeAutoCreate({
          controller,
          encoder,
          send,
          taskId,
          projectId,
          title,
          description: description || "",
          genre,
          novelLength,
          targetChapters,
          totalTokensUsed,
          session,
        })

      } catch (error) {
        console.error("[Auto Create] Error:", error)

        // 更新任务状态
        if (taskId) {
          await prisma.autoCreateTask.update({
            where: { id: taskId },
            data: {
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "未知错误",
            },
          })
          taskControllers.delete(taskId)
        }

        send({
          type: "error",
          message: error instanceof Error ? error.message : "自动创作失败",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}

// 取消自动创作任务
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ message: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get("taskId")

  if (!taskId) {
    return new Response(JSON.stringify({ message: "缺少任务ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 验证任务所有权
  const task = await prisma.autoCreateTask.findFirst({
    where: { id: taskId, userId: session.user.id },
  })

  if (!task) {
    return new Response(JSON.stringify({ message: "任务不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 标记任务为取消
  const controller = taskControllers.get(taskId)
  if (controller) {
    controller.cancelled = true
  }

  // 更新数据库状态
  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  })

  return new Response(JSON.stringify({ message: "任务已取消" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

// 获取任务状态（用于断点续传检查）
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ message: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return new Response(JSON.stringify({ message: "缺少项目ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // 查找未完成的任务
  const task = await prisma.autoCreateTask.findFirst({
    where: {
      projectId,
      userId: session.user.id,
      status: { in: ["paused", "failed"] },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!task) {
    return new Response(JSON.stringify({ hasResumableTask: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({
    hasResumableTask: true,
    task: {
      id: task.id,
      status: task.status,
      progress: task.progress,
      generatedChapters: task.generatedChapters,
      errorMessage: task.errorMessage,
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

// ========== 核心执行逻辑 ==========

interface AutoCreateContext {
  controller: ReadableStreamDefaultController
  encoder: TextEncoder
  send: (data: object) => void
  taskId: string
  projectId: string
  title: string
  description: string
  genre: string
  novelLength: string
  targetChapters: number
  totalTokensUsed: number
  session: { user: { id: string } }
}

async function executeAutoCreate(ctx: AutoCreateContext) {
  const { send, taskId, projectId, title, description, genre, session } = ctx
  let { totalTokensUsed } = ctx

  // 检查是否被取消
  const checkCancelled = () => {
    const controller = taskControllers.get(taskId)
    return controller?.cancelled === true
  }

  // ========== Step 2: 生成知识库 ==========
  send({
    type: "progress",
    stage: "generating_knowledge",
    message: "正在生成知识库（人物、世界观、剧情）...",
    progress: { current: 1, total: 4 }
  })

  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: { currentStage: "generating_knowledge" },
  })

  if (checkCancelled()) {
    await handleCancellation(taskId, send)
    return
  }

  // 知识库提示词模板
  const knowledgePrompts = {
    character: {
      title: "主要人物设定",
      tags: ["AI生成", "人物"],
      prompt: `作为小说创作顾问，请根据以下项目信息，生成3-5个主要人物设定。

项目名称：${title}
项目简介：${description || "暂无简介"}
题材类型：${genre}

请为每个人物提供：
1. 姓名
2. 角色定位（主角/配角/反派等）
3. 外貌特征
4. 性格特点
5. 背景故事

格式要求：
## 人物名称
- 角色：xxx
- 外貌：xxx
- 性格：xxx
- 背景：xxx

请直接输出人物设定，不要有多余的开头和结尾。`
    },
    world: {
      title: "世界观设定",
      tags: ["AI生成", "世界观"],
      prompt: `作为小说创作顾问，请根据以下项目信息，生成世界观设定。

项目名称：${title}
项目简介：${description || "暂无简介"}
题材类型：${genre}

请提供以下世界观要素：
1. 时代背景
2. 地理环境
3. 社会结构
4. 特殊设定（如魔法体系、科技水平等）
5. 主要势力

格式要求：
## 世界观设定

### 时代背景
xxx

### 地理环境
xxx

### 社会结构
xxx

### 特殊设定
xxx

### 主要势力
xxx

请直接输出世界观设定，不要有多余的开头和结尾。`
    },
    plot: {
      title: "核心剧情设定",
      tags: ["AI生成", "剧情"],
      prompt: `作为小说创作顾问，请根据以下项目信息，生成核心剧情设定。

项目名称：${title}
项目简介：${description || "暂无简介"}
题材类型：${genre}

请提供以下剧情要素：
1. 故事主线
2. 核心冲突
3. 3-5个关键转折点
4. 故事高潮预设

格式要求：
## 剧情设定

### 故事主线
xxx

### 核心冲突
xxx

### 关键转折点
1. xxx
2. xxx
3. xxx

### 故事高潮
xxx

请直接输出剧情设定，不要有多余的开头和结尾。`
    }
  }

  // 生成知识库
  const knowledgeTypes = ["character", "world", "plot"] as const
  const generatedKnowledge: string[] = []

  for (const type of knowledgeTypes) {
    if (checkCancelled()) {
      await handleCancellation(taskId, send)
      return
    }

    const config = knowledgePrompts[type]
    try {
      send({
        type: "knowledge_progress",
        entryType: type,
        message: `正在生成${config.title}...`
      })

      const result = await generateText({
        prompt: config.prompt,
        temperature: 0.8,
        maxTokens: 2500,
      })

      totalTokensUsed += 2500

      if (result) {
        await prisma.knowledgeEntry.create({
          data: {
            userId: session.user.id,
            projectId,
            entryType: type,
            title: config.title,
            content: { description: result },
            tags: config.tags,
          },
        })
        generatedKnowledge.push(type)
      }

      // 更新任务进度
      await prisma.autoCreateTask.update({
        where: { id: taskId },
        data: {
          progress: { knowledgeGenerated: generatedKnowledge },
          tokensUsed: totalTokensUsed,
        },
      })

      send({
        type: "knowledge_generated",
        entryType: type,
        title: config.title,
        tokensUsed: totalTokensUsed,
      })
    } catch (error) {
      console.error(`[Auto Create] Failed to generate ${type}:`, error)
    }
  }

  // 获取生成的知识库
  const knowledge = await prisma.knowledgeEntry.findMany({
    where: { projectId },
  })

  const characters = knowledge
    .filter((k) => k.entryType === "character")
    .map((k) => JSON.stringify(k.content))
    .join("\n")

  const worldContent = knowledge.find((k) => k.entryType === "world")?.content
  const world = worldContent ? JSON.stringify(worldContent) : ""

  const plotDescriptions = knowledge
    .filter((k) => k.entryType === "plot")
    .map((k) => {
      const content = k.content as { description?: string } | null
      return content?.description || ""
    })
    .join("\n")

  // ========== Step 3: 批量生成章节 ==========
  send({
    type: "progress",
    stage: "generating_chapters",
    message: `正在生成 ${ctx.targetChapters} 个章节...`,
    progress: { current: 2, total: 4 },
    totalChapters: ctx.targetChapters,
  })

  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: { currentStage: "generating_chapters" },
  })

  // 生成结果
  const results: Array<{
    order: number
    title: string
    content: string
    wordCount: number
    success: boolean
  }> = []

  // 逐个生成章节
  for (let i = 0; i < ctx.targetChapters; i++) {
    if (checkCancelled()) {
      await handleCancellation(taskId, send)
      return
    }

    const chapterOrder = i + 1
    const isLastChapter = i === ctx.targetChapters - 1
    const chapterTitle = isLastChapter
      ? `【第${chapterOrder}章 大结局】`
      : `【第${chapterOrder}章】`

    send({
      type: "chapter_progress",
      current: i + 1,
      total: ctx.targetChapters,
      message: `正在生成第 ${chapterOrder} 章...`,
    })

    try {
      // 1. 生成章节大纲
      let chapterOutline = await generateGenreChapterOutline({
        genre,
        outline: description || "",
        chapterTitle,
      })

      totalTokensUsed += 500

      // 如果是最后一章，添加完结提示
      if (isLastChapter) {
        chapterOutline = `【重要：这是小说的大结局章节】

【本章详细大纲】
${chapterOutline}

【大结局写作要求 - 必须严格遵守】
1. 这是小说的最后一章，标题必须包含"大结局"
2. 所有故事线必须在本章彻底完结，不能留下任何悬念
3. 主角的最终命运必须明确交代（成功/失败/成长/蜕变等）
4. 必须有一个完整的结局场景
5. 给读者情感上的满足感和完结感
6. 结尾要有力量感，让读者感受到故事真正结束了`
      }

      // 2. 获取前一章内容
      const prevChapter = i > 0
        ? results[i - 1]
        : { content: "" }

      // 3. 生成章节内容
      let content = await generateGenreChapterContent({
        genre,
        chapterTitle,
        chapterOutline,
        characters,
        world,
        background: description || "",
        relationships: plotDescriptions,
        plot: "",
        previousContent: prevChapter.content?.slice(-500) || "",
        projectTitle: title,
        projectDescription: description || "",
      })

      totalTokensUsed += 3000

      // 如果是最后一章，确保包含结局标识
      if (isLastChapter) {
        const strongEndingKeywords = ["大结局", "全书完", "剧终", "终章", "完结篇", "落幕"]
        const hasStrongEnding = strongEndingKeywords.some(kw => content.includes(kw))

        if (!hasStrongEnding) {
          content = content + `

---

**（全书完）**`
        }
      }

      // 提取真实标题
      let realTitle = chapterTitle
      const titleMatch = content.match(/^#\s*【?第\d+章[^】]*】?(?:\s*[-—:：]\s*(.+?))?(?:\n|$)/)
      if (titleMatch) {
        const subTitle = titleMatch[1]?.trim()
        if (subTitle) {
          realTitle = `【第${chapterOrder}章 ${subTitle}】`
        } else {
          realTitle = titleMatch[0].replace(/^#\s*/, "").trim()
        }
      } else {
        const simpleMatch = content.match(/^#\s*(.+?)(?:\n|$)/)
        if (simpleMatch) {
          const extracted = simpleMatch[1].trim()
          if (!extracted.includes(`第${chapterOrder}章`)) {
            realTitle = `【第${chapterOrder}章 ${extracted}】`
          } else {
            realTitle = extracted
          }
        }
      }

      // 确保最后一章标题包含"大结局"
      if (isLastChapter && !realTitle.includes("大结局")) {
        realTitle = realTitle.replace(/】$/, " 大结局】")
      }

      // 计算字数
      const wordCount = content.replace(/\s/g, "").length

      // 保存章节到数据库
      await prisma.chapter.create({
        data: {
          projectId,
          title: realTitle,
          content,
          order: chapterOrder,
          wordCount,
        },
      })

      results.push({
        order: chapterOrder,
        title: realTitle,
        content,
        wordCount,
        success: true,
      })

      // 更新任务进度
      await prisma.autoCreateTask.update({
        where: { id: taskId },
        data: {
          progress: {
            currentChapter: chapterOrder,
            totalChapters: ctx.targetChapters,
            knowledgeGenerated: generatedKnowledge,
          },
          generatedChapters: results.filter(r => r.success).length,
          totalWordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
          tokensUsed: totalTokensUsed,
        },
      })

      send({
        type: "chapter_generated",
        order: chapterOrder,
        title: realTitle,
        wordCount,
        tokensUsed: totalTokensUsed,
      })

    } catch (error) {
      console.error(`[Auto Create] Failed to generate chapter ${chapterOrder}:`, error)
      results.push({
        order: chapterOrder,
        title: chapterTitle,
        content: "",
        wordCount: 0,
        success: false,
      })

      send({
        type: "chapter_failed",
        order: chapterOrder,
        error: error instanceof Error ? error.message : "生成失败",
      })
    }
  }

  // ========== Step 4: 标记完结 ==========
  if (checkCancelled()) {
    await handleCancellation(taskId, send)
    return
  }

  send({
    type: "progress",
    stage: "completing",
    message: "正在标记完结...",
    progress: { current: 3, total: 4 }
  })

  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: { currentStage: "completing" },
  })

  const successCount = results.filter((r) => r.success).length

  // 如果所有章节都成功生成，标记为完结
  if (successCount === ctx.targetChapters) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    })
  }

  // 记录使用日志
  await prisma.usageLog.create({
    data: {
      userId: session.user.id,
      actionType: "auto_create",
      model: "deepseek",
      tokensUsed: totalTokensUsed,
      wordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
      cost: totalTokensUsed * 0.0001, // 假设每 token 0.0001 分
    },
  })

  // 更新任务状态为完成
  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: {
      status: "completed",
      currentStage: "completed",
      completedAt: new Date(),
      generatedChapters: successCount,
      totalWordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
      tokensUsed: totalTokensUsed,
    },
  })

  // 清理任务控制器
  taskControllers.delete(taskId)

  // 更新项目统计
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  })

  // ========== 完成 ==========
  send({
    type: "complete",
    projectId,
    taskId,
    message: `自动创作完成！成功生成 ${successCount}/${ctx.targetChapters} 个章节`,
    generatedCount: successCount,
    totalChapters: ctx.targetChapters,
    isCompleted: successCount === ctx.targetChapters,
    tokensUsed: totalTokensUsed,
    totalWordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
  })
}

// 处理取消
async function handleCancellation(taskId: string, send: (data: object) => void) {
  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  })

  taskControllers.delete(taskId)

  send({
    type: "cancelled",
    message: "任务已取消",
  })
}

// 断点续传继续执行
async function continueAutoCreate(
  ctx: AutoCreateContext & {
    existingProgress: {
      currentChapter?: number
      totalChapters?: number
      knowledgeGenerated?: string[]
    }
  }
) {
  const { send, taskId, projectId, existingProgress, session } = ctx
  const startChapter = (existingProgress.currentChapter || 0) + 1

  // 重新注册任务控制器
  taskControllers.set(taskId, { cancelled: false })

  // 检查是否被取消
  const checkCancelled = () => {
    const controller = taskControllers.get(taskId)
    return controller?.cancelled === true
  }

  // 获取知识库
  const knowledge = await prisma.knowledgeEntry.findMany({
    where: { projectId },
  })

  const characters = knowledge
    .filter((k) => k.entryType === "character")
    .map((k) => JSON.stringify(k.content))
    .join("\n")

  const worldContent = knowledge.find((k) => k.entryType === "world")?.content
  const world = worldContent ? JSON.stringify(worldContent) : ""

  const plotDescriptions = knowledge
    .filter((k) => k.entryType === "plot")
    .map((k) => {
      const content = k.content as { description?: string } | null
      return content?.description || ""
    })
    .join("\n")

  // 获取已有章节
  const existingChapters = await prisma.chapter.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  })

  // 获取项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    send({ type: "error", message: "项目不存在" })
    return
  }

  send({
    type: "progress",
    stage: "generating_chapters",
    message: `继续生成章节 ${startChapter}/${ctx.targetChapters}...`,
    progress: { current: 2, total: 4 },
    totalChapters: ctx.targetChapters,
  })

  // 生成剩余章节
  const results: Array<{
    order: number
    title: string
    content: string
    wordCount: number
    success: boolean
  }> = existingChapters.map(ch => ({
    order: ch.order,
    title: ch.title,
    content: ch.content || "",
    wordCount: ch.wordCount,
    success: true,
  }))

  let totalTokensUsed = 0

  for (let i = startChapter - 1; i < ctx.targetChapters; i++) {
    if (checkCancelled()) {
      await handleCancellation(taskId, send)
      return
    }

    const chapterOrder = i + 1
    const isLastChapter = i === ctx.targetChapters - 1
    const chapterTitle = isLastChapter
      ? `【第${chapterOrder}章 大结局】`
      : `【第${chapterOrder}章】`

    send({
      type: "chapter_progress",
      current: i + 1,
      total: ctx.targetChapters,
      message: `正在生成第 ${chapterOrder} 章...`,
    })

    try {
      let chapterOutline = await generateGenreChapterOutline({
        genre: project.genre || "urbanReborn",
        outline: project.description || "",
        chapterTitle,
      })

      totalTokensUsed += 500

      if (isLastChapter) {
        chapterOutline = `【重要：这是小说的大结局章节】

【本章详细大纲】
${chapterOutline}

【大结局写作要求 - 必须严格遵守】
1. 这是小说的最后一章，标题必须包含"大结局"
2. 所有故事线必须在本章彻底完结，不能留下任何悬念
3. 主角的最终命运必须明确交代
4. 必须有一个完整的结局场景
5. 给读者情感上的满足感和完结感`
      }

      const prevChapter = results[i - 1] || { content: "" }

      let content = await generateGenreChapterContent({
        genre: project.genre || "urbanReborn",
        chapterTitle,
        chapterOutline,
        characters,
        world,
        background: project.description || "",
        relationships: plotDescriptions,
        plot: "",
        previousContent: prevChapter.content?.slice(-500) || "",
        projectTitle: project.title,
        projectDescription: project.description || "",
      })

      totalTokensUsed += 3000

      if (isLastChapter) {
        const strongEndingKeywords = ["大结局", "全书完", "剧终", "终章", "完结篇", "落幕"]
        const hasStrongEnding = strongEndingKeywords.some(kw => content.includes(kw))
        if (!hasStrongEnding) {
          content = content + "\n\n---\n\n**（全书完）**"
        }
      }

      let realTitle = chapterTitle
      const titleMatch = content.match(/^#\s*【?第\d+章[^】]*】?(?:\s*[-—:：]\s*(.+?))?(?:\n|$)/)
      if (titleMatch) {
        const subTitle = titleMatch[1]?.trim()
        if (subTitle) {
          realTitle = `【第${chapterOrder}章 ${subTitle}】`
        } else {
          realTitle = titleMatch[0].replace(/^#\s*/, "").trim()
        }
      }

      if (isLastChapter && !realTitle.includes("大结局")) {
        realTitle = realTitle.replace(/】$/, " 大结局】")
      }

      const wordCount = content.replace(/\s/g, "").length

      await prisma.chapter.create({
        data: {
          projectId,
          title: realTitle,
          content,
          order: chapterOrder,
          wordCount,
        },
      })

      results.push({
        order: chapterOrder,
        title: realTitle,
        content,
        wordCount,
        success: true,
      })

      await prisma.autoCreateTask.update({
        where: { id: taskId },
        data: {
          progress: {
            currentChapter: chapterOrder,
            totalChapters: ctx.targetChapters,
            knowledgeGenerated: existingProgress.knowledgeGenerated,
          },
          generatedChapters: results.filter(r => r.success).length,
          tokensUsed: totalTokensUsed,
        },
      })

      send({
        type: "chapter_generated",
        order: chapterOrder,
        title: realTitle,
        wordCount,
        tokensUsed: totalTokensUsed,
      })

    } catch (error) {
      console.error(`[Auto Create] Failed to generate chapter ${chapterOrder}:`, error)
      results.push({
        order: chapterOrder,
        title: chapterTitle,
        content: "",
        wordCount: 0,
        success: false,
      })

      send({
        type: "chapter_failed",
        order: chapterOrder,
        error: error instanceof Error ? error.message : "生成失败",
      })
    }
  }

  // 标记完成
  const successCount = results.filter((r) => r.success).length

  if (successCount === ctx.targetChapters) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    })
  }

  await prisma.usageLog.create({
    data: {
      userId: session.user.id,
      actionType: "auto_create_resume",
      model: "deepseek",
      tokensUsed: totalTokensUsed,
      wordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
      cost: totalTokensUsed * 0.0001,
    },
  })

  await prisma.autoCreateTask.update({
    where: { id: taskId },
    data: {
      status: "completed",
      currentStage: "completed",
      completedAt: new Date(),
      generatedChapters: successCount,
      totalWordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
      tokensUsed: totalTokensUsed,
    },
  })

  taskControllers.delete(taskId)

  send({
    type: "complete",
    projectId,
    taskId,
    message: `断点续传完成！成功生成 ${successCount}/${ctx.targetChapters} 个章节`,
    generatedCount: successCount,
    totalChapters: ctx.targetChapters,
    isCompleted: successCount === ctx.targetChapters,
    tokensUsed: totalTokensUsed,
    totalWordCount: results.reduce((sum, r) => sum + r.wordCount, 0),
  })
}
