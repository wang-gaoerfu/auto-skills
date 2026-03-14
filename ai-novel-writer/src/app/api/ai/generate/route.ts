import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  generateOutline,
  generateChapterOutlineTitles,
  generateChapterContent,
  generateTitle,
  polishText,
  expandText,
  removeAITaste,
  continueWriting,
  scoreContent,
  generateGenreOutline,
  generateGenreChapterOutline,
  generateGenreChapterContent,
  executeMenuOptimize,
  getAllGenres,
  getOutlineMenu,
  getChapterMenu,
  getContentMenu,
  replaceVariables,
  PROMPT_TEMPLATES,
  generateProjectSuggestions,
} from "@/lib/ai/deepseek"
import {
  getAIContext,
  retrieveRelevantKnowledge,
  isVectorDBAvailable,
} from "@/lib/vector/chroma"

const requestSchema = z.object({
  action: z.enum([
    "generateTitle",
    "generateOutline",
    "generateChapterOutline",
    "generateChapterContent",
    "polish",
    "expand",
    "removeAI",
    "continue",
    "score",
    // 新增题材相关操作
    "generateGenreOutline",
    "generateGenreChapterOutline",
    "generateGenreChapterContent",
    "menuOptimize",
    "getGenres",
    "getMenus",
    "generateProjectSuggestions",
  ]),
  projectId: z.string(),
  params: z.any(),
})

export async function POST(request: NextRequest) {
  console.log("[AI Generate] Request received")
  try {
    const session = await auth()
    if (!session) {
      console.log("[AI Generate] Unauthorized - no session")
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    // 检查 API Key 配置
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("[AI Generate] DEEPSEEK_API_KEY not configured")
      return NextResponse.json(
        { message: "AI服务未配置，请联系管理员" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, projectId, params } = requestSchema.parse(body)

    console.log("[AI Generate] Processing action:", action, "projectId:", projectId)

    // 对于不需要项目的 action，直接处理
    if (action === "getGenres") {
      return NextResponse.json({ genres: getAllGenres() })
    }

    if (action === "getMenus") {
      const menuGenre = params.genre || "urbanReborn"
      const menus = {
        outline: getOutlineMenu(menuGenre),
        chapter: getChapterMenu(menuGenre),
        content: getContentMenu(menuGenre),
      }
      return NextResponse.json({ menus })
    }

    if (action === "generateProjectSuggestions") {
      const result = await generateProjectSuggestions({
        genre: params.genre || "urbanReborn",
        novelLength: params.novelLength || "medium",
      })
      return NextResponse.json({ result })
    }

    // 获取项目信息（如果有 projectId）
    let project = null
    let knowledge = null
    let vectorContext = { characters: "", world: "", plot: "" }

    if (projectId && projectId !== "new") {
      project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        select: {
          id: true,
          title: true,
          description: true,
          outline: true,
          novelLength: true,
          chapters: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              content: true,
              order: true,
              wordCount: true,
            },
          },
        },
      })

      if (!project) {
        return NextResponse.json({ message: "项目不存在" }, { status: 404 })
      }

      // 获取知识库（从数据库）
      const knowledgeEntries = await prisma.knowledgeEntry.findMany({
        where: { projectId },
      })
      knowledge = knowledgeEntries

      // 尝试从向量数据库获取相关上下文（可选功能，失败时使用数据库数据）
      try {
        const vectorAvailable = await isVectorDBAvailable()
        if (vectorAvailable) {
          // 根据当前操作类型获取相关上下文
          const queryContent = params.content || params.chapterTitle || params.background || ""

          // 获取 AI 生成所需的相关知识
          vectorContext = await getAIContext(projectId, queryContent, {
            includeCharacters: true,
            includeWorld: true,
            includePlot: true,
            topK: 3,
          })

          console.log("[Vector] Retrieved context from vector store:", {
            charactersLength: vectorContext.characters.length,
            worldLength: vectorContext.world.length,
            plotLength: vectorContext.plot.length,
          })
        }
      } catch (error) {
        // 向量检索失败时静默回退到数据库数据，不阻断主流程
        console.log("[Vector] Using database fallback for knowledge retrieval")
      }
    }

    // 执行 AI 生成
    let result: string

    console.log("[AI Generate] Executing action:", action)

    switch (action) {
      case "generateTitle":
        result = await generateTitle(params)
        break

      case "generateOutline":
        result = await generateOutline({
          ...params,
          characters: knowledge?.filter((k) => k.entryType === "character").map((k) => JSON.stringify(k.content)).join("\n") || "",
          world: knowledge?.find((k) => k.entryType === "world")?.content ? JSON.stringify(knowledge.find((k) => k.entryType === "world")?.content) : "",
        })
        break

      case "generateChapterOutline":
        result = await generateChapterOutlineTitles({
          ...params,
          outline: project?.outline || "",
          title: project?.title || "",
          description: project?.description || "",
          novelLength: project?.novelLength || "medium",
        })
        break

      case "generateChapterContent":
        result = await generateChapterContent({
          ...params,
          // 优先使用向量检索结果，回退到数据库数据
          characters: vectorContext.characters || knowledge?.filter((k) => k.entryType === "character").map((k) => JSON.stringify(k.content)).join("\n") || "",
          world: vectorContext.world || (knowledge?.find((k) => k.entryType === "world")?.content ? JSON.stringify(knowledge.find((k) => k.entryType === "world")?.content) : ""),
        })
        break

      case "polish":
        result = await polishText(params.content)
        break

      case "expand":
        result = await expandText(params.content, params.direction || "对话")
        break

      case "removeAI":
        result = await removeAITaste(params.content)
        break

      case "continue":
        result = await continueWriting(
          params.content,
          params.direction || "",
          params.wordCount || 500
        )
        break

      case "score":
        result = await scoreContent(params.content, params.type || "章节")
        break

      // 题材相关操作
      case "generateGenreOutline": {
        const plotDescriptions = knowledge?.filter((k) => k.entryType === "plot").map((k) => {
          const content = k.content as { description?: string } | null
          return content?.description || ""
        }).join("\n") || ""

        result = await generateGenreOutline({
          genre: params.genre || "urbanReborn",
          background: params.background || "",
          characters: knowledge?.filter((k) => k.entryType === "character").map((k) => JSON.stringify(k.content)).join("\n") || "",
          relationships: plotDescriptions,
          plot: params.plot || "",
        })
        break
      }

      case "generateGenreChapterOutline":
        result = await generateGenreChapterOutline({
          genre: params.genre || "urbanReborn",
          outline: typeof project?.outline === "string" ? project.outline : JSON.stringify(project?.outline) || "",
          chapterTitle: params.chapterTitle,
        })
        break

      case "generateGenreChapterContent": {
        const plotDescriptions2 = knowledge?.filter((k) => k.entryType === "plot").map((k) => {
          const content = k.content as { description?: string } | null
          return content?.description || ""
        }).join("\n") || ""
        const worldContent = knowledge?.find((k) => k.entryType === "world")?.content

        // 确保章节标题存在
        const finalChapterTitle = params.chapterTitle || "未知章节"
        console.log("[AI Generate] generateGenreChapterContent:", {
          genre: params.genre || "urbanReborn",
          chapterTitle: finalChapterTitle,
          chapterOutlineLength: params.chapterOutline?.length || 0,
          hasCharacters: !!knowledge?.some((k) => k.entryType === "character"),
          hasWorld: !!worldContent,
          // 检查知识库中是否有其他章节信息
          plotEntriesCount: knowledge?.filter((k) => k.entryType === "plot").length || 0,
        })

        // 检查知识库中是否有其他章节的标题信息
        const plotEntries = knowledge?.filter((k) => k.entryType === "plot") || []
        const potentialChapterTitles = plotEntries.map(k => k.title).filter(Boolean)
        if (potentialChapterTitles.length > 0) {
          console.log("[AI Generate] Plot entry titles in knowledge base:", potentialChapterTitles)
        }

        result = await generateGenreChapterContent({
          genre: params.genre || "urbanReborn",
          chapterTitle: finalChapterTitle,
          chapterOutline: params.chapterOutline,
          characters: knowledge?.filter((k) => k.entryType === "character").map((k) => JSON.stringify(k.content)).join("\n") || "",
          world: worldContent ? JSON.stringify(worldContent) : "",
          background: params.background || "",
          relationships: plotDescriptions2,
          plot: params.plot || "",
          previousContent: params.previousContent || "",
        })
        break
      }

      case "menuOptimize": {
        const plotDescriptions3 = knowledge?.filter((k) => k.entryType === "plot").map((k) => {
          const content = k.content as { description?: string } | null
          return content?.description || ""
        }).join("\n") || ""

        result = await executeMenuOptimize({
          menuType: params.menuType || "content",
          actionName: params.actionName,
          selectedText: params.selectedText || params.content || "",
          genre: params.genre || "urbanReborn",
          context: {
            background: params.background || "",
            characters: knowledge?.filter((k) => k.entryType === "character").map((k) => JSON.stringify(k.content)).join("\n") || "",
            relationships: plotDescriptions3,
            plot: params.plot || "",
            outline: typeof project?.outline === "string" ? project.outline : JSON.stringify(project?.outline) || "",
          },
        })
        break
      }

      default:
        return NextResponse.json({ message: "未知操作" }, { status: 400 })
    }

    // 记录使用日志
    const tokensUsed = Math.ceil(result.length / 2) // 粗略估算
    await prisma.usageLog.create({
      data: {
        userId: session.user.id,
        actionType: action,
        model: "deepseek-chat",
        tokensUsed,
        wordCount: result.length,
        cost: (tokensUsed / 10000) * 0.1, // DeepSeek ¥0.1/万tokens
      },
    })

    console.log("[AI Generate] Successfully generated content, length:", result?.length || 0)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("[AI Generate] Error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "AI生成失败，请稍后重试"
    console.error("[AI Generate] Error message:", errorMessage)
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
