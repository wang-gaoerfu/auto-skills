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
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "未登录" }, { status: 401 })
    }

    // 检查 API Key 配置
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { message: "AI服务未配置，请联系管理员" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, projectId, params } = requestSchema.parse(body)

    // 对于不需要项目的 action，直接处理
    if (action === "getGenres") {
      return NextResponse.json({ genres: getAllGenres() })
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

    if (projectId && projectId !== "new") {
      project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        include: { chapters: { orderBy: { order: "asc" } } },
      })

      if (!project) {
        return NextResponse.json({ message: "项目不存在" }, { status: 404 })
      }

      // 获取知识库
      const knowledgeEntries = await prisma.knowledgeEntry.findMany({
        where: { projectId },
      })
      knowledge = knowledgeEntries
    }

    // 执行 AI 生成
    let result: string

    switch (action) {
      case "generateTitle":
        result = await generateTitle(params)
        break

      case "generateOutline":
        result = await generateOutline({
          ...params,
          characters: knowledge?.filter((k) => k.entryType === "character").map((k) => k.content).join("\n") || "",
          world: knowledge?.find((k) => k.entryType === "world")?.content || "",
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
          characters: knowledge?.filter((k) => k.entryType === "character").map((k) => k.content).join("\n") || "",
          world: knowledge?.find((k) => k.entryType === "world")?.content || "",
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

        result = await generateGenreChapterContent({
          genre: params.genre || "urbanReborn",
          chapterTitle: params.chapterTitle || "",
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

      case "getGenres":
        return NextResponse.json({ genres: getAllGenres() })

      case "getMenus":
        const menuGenre = params.genre || "urbanReborn"
        const menus = {
          outline: getOutlineMenu(menuGenre),
          chapter: getChapterMenu(menuGenre),
          content: getContentMenu(menuGenre),
        }
        return NextResponse.json({ menus })

      case "generateProjectSuggestions":
        result = await generateProjectSuggestions({
          genre: params.genre || "urbanReborn",
          novelLength: params.novelLength || "medium",
        })
        break

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

    return NextResponse.json({ result })
  } catch (error) {
    console.error("AI generate error:", error)

    if (error instanceof z.ZodError) {
      const zodError = error as unknown as { errors: Array<{ message: string }> }
      return NextResponse.json(
        { message: zodError.errors[0]?.message || "参数错误" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "AI生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}
