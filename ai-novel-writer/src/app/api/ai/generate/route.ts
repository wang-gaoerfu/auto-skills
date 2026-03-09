import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  generateOutline,
  generateChapterOutline,
  generateChapterContent,
  generateTitle,
  polishText,
  expandText,
  removeAITaste,
  continueWriting,
  scoreContent,
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

    // 获取项目信息（如果有 projectId）
    let project = null
    let knowledge = null

    if (projectId) {
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
        result = await generateChapterOutline({
          ...params,
          outline: project?.outline || "",
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
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "AI生成失败，请稍后重试" },
      { status: 500 }
    )
  }
}
