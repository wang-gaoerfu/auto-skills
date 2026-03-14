import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  generateGenreChapterOutline,
  generateGenreChapterContent,
  getGenreConfig,
  generateText,
} from "@/lib/ai/deepseek"

const requestSchema = z.object({
  mode: z.enum(["auto", "manual"]),
  targetChapterCount: z.number().optional(),
  additionalChapters: z.number().optional(),
  isEndingMode: z.boolean().optional(),
})

// 批量生成章节 - 流式响应
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ message: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { id: projectId } = await params
  const body = await request.json()
  const { mode, targetChapterCount, additionalChapters, isEndingMode } = requestSchema.parse(body)

  // 创建流式响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // 获取项目信息
        const project = await prisma.project.findFirst({
          where: { id: projectId, userId: session.user.id },
          include: {
            chapters: {
              orderBy: { order: "asc" },
            },
          },
        })

        if (!project) {
          send({ type: "error", message: "项目不存在" })
          controller.close()
          return
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

        const currentChapterCount = project.chapters.length
        const genre = project.genre || "urbanReborn"

        // 计算需要生成的章节数
        let chaptersToGenerate: number

        if (mode === "manual") {
          if (targetChapterCount) {
            chaptersToGenerate = Math.max(0, targetChapterCount - currentChapterCount)
          } else if (additionalChapters) {
            chaptersToGenerate = additionalChapters
          } else {
            send({ type: "error", message: "请指定目标章节数或新增章节数" })
            controller.close()
            return
          }
        } else {
          const lengthConfig: Record<string, number> = {
            micro: 1,
            short: 5,
            medium: 20,
            long: 50,
          }
          const target = lengthConfig[project.novelLength || "medium"] || 20
          chaptersToGenerate = Math.max(0, target - currentChapterCount)
        }

        if (chaptersToGenerate <= 0) {
          send({
            type: "complete",
            message: "当前章节数已达到小说长度目标。如需继续创作，请切换到「人工指定」模式。",
            needsManualMode: true,
            generatedCount: 0,
          })
          controller.close()
          return
        }

        // 限制单次生成的章节数
        const maxBatchGenerate = 10
        if (chaptersToGenerate > maxBatchGenerate) {
          send({ type: "error", message: `单次最多生成 ${maxBatchGenerate} 个章节，请分批生成` })
          controller.close()
          return
        }

        // 发送开始信号
        send({
          type: "start",
          total: chaptersToGenerate,
          message: `准备生成 ${chaptersToGenerate} 个章节...`,
        })

        // 获取最后一章内容作为前文
        const lastChapter = project.chapters[project.chapters.length - 1]
        const previousContent = lastChapter?.content?.slice(-1000) || ""

        // 如果是完结模式，先生成结局规划
        let endingOutline = ""
        if (isEndingMode && chaptersToGenerate > 0) {
          send({ type: "progress", current: 0, total: chaptersToGenerate, message: "正在规划结局大纲..." })

          const chapterSummaries = project.chapters.slice(-5).map((ch) => {
            const contentPreview = ch.content?.replace(/<[^>]*>/g, "").slice(0, 500) || ""
            return `第${ch.order}章《${ch.title}》：${contentPreview}...`
          }).join("\n\n")

          const endingPrompt = `你是一位资深小说编辑。现在需要为一部${project.genre || "都市"}题材的小说规划结局。

小说标题：${project.title}
小说简介：${project.description || "暂无"}
当前章节数：${currentChapterCount}章
需要新增：${chaptersToGenerate}章用于完结

最近章节内容摘要：
${chapterSummaries}

主要角色：
${characters || "暂无"}

请为这${chaptersToGenerate}章规划一个合理的结局大纲，包括：
1. 每章的标题和主要内容
2. 如何收束主要故事线
3. 最后一章的结局设计（大结局/尾声）

请用简洁的中文输出，格式如下：
第${currentChapterCount + 1}章：[标题] - [主要内容概要]
第${currentChapterCount + 2}章：[标题] - [主要内容概要]
...
第${currentChapterCount + chaptersToGenerate}章（大结局）：[标题] - [结局内容概要]`

          try {
            endingOutline = await generateText({
              prompt: endingPrompt,
              maxTokens: 1500,
              temperature: 0.7,
            })
            send({ type: "outline", outline: endingOutline })
          } catch (error) {
            console.error("[Batch Generate] Failed to generate ending outline:", error)
          }
        }

        // 生成结果
        const results: Array<{
          order: number
          title: string
          content: string
          wordCount: number
          success: boolean
          error?: string
        }> = []

        // 逐个生成章节
        for (let i = 0; i < chaptersToGenerate; i++) {
          const chapterOrder = currentChapterCount + i + 1
          const isLastChapter = i === chaptersToGenerate - 1
          // 使用统一的章节标题格式
          const chapterTitle = isEndingMode && isLastChapter
            ? `【第${chapterOrder}章 大结局】`
            : `【第${chapterOrder}章】`

          send({
            type: "progress",
            current: i + 1,
            total: chaptersToGenerate,
            message: `正在生成第 ${chapterOrder} 章...`,
          })

          try {
            // 1. 生成章节大纲
            let chapterOutline = await generateGenreChapterOutline({
              genre,
              outline: typeof project.outline === "string" ? project.outline : JSON.stringify(project.outline) || "",
              chapterTitle,
            })

            // 如果是完结模式，结合结局规划
            if (isEndingMode && endingOutline) {
              chapterOutline = `【完结章节规划】
${endingOutline.split("\n").find(line => line.includes(`第${chapterOrder}章`)) || ""}

【本章详细大纲】
${chapterOutline}

${isLastChapter ? "【重要提示】这是小说的最后一章（大结局），请确保：\n1. 所有主要故事线得到收束\n2. 主角的命运有明确交代\n3. 给读者一个满意的结局\n4. 可以包含尾声或后记元素" : "【提示】这是完结前的过渡章节，要为最终结局做铺垫。"}`
            }

            // 2. 获取前一章内容
            const prevChapter = i > 0
              ? results[i - 1]
              : { content: previousContent }

            // 3. 生成章节内容
            const content = await generateGenreChapterContent({
              genre,
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

            // 提取真实标题
            let realTitle = chapterTitle
            // 匹配 Markdown 标题格式，支持【第X章 XXXX】格式
            const titleMatch = content.match(/^#\s*【?第\d+章[^】]*】?(?:\s*[-—:：]\s*(.+?))?(?:\n|$)/)
            if (titleMatch) {
              // 如果有副标题，组合成【第X章 副标题】格式
              const subTitle = titleMatch[1]?.trim()
              if (subTitle) {
                realTitle = `【第${chapterOrder}章 ${subTitle}】`
              } else {
                realTitle = titleMatch[0].replace(/^#\s*/, "").trim()
              }
            } else {
              // 如果没有匹配到标准格式，使用默认格式
              const simpleMatch = content.match(/^#\s*(.+?)(?:\n|$)/)
              if (simpleMatch) {
                const extracted = simpleMatch[1].trim()
                // 如果提取的标题不包含章节号，添加章节号
                if (!extracted.includes(`第${chapterOrder}章`)) {
                  realTitle = `【第${chapterOrder}章 ${extracted}】`
                } else {
                  realTitle = extracted
                }
              }
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

            // 发送章节完成信号
            send({
              type: "chapter",
              order: chapterOrder,
              title: realTitle,
              wordCount,
              success: true,
            })

          } catch (error) {
            console.error(`[Batch Generate] Failed to generate chapter ${chapterOrder}:`, error)
            results.push({
              order: chapterOrder,
              title: chapterTitle,
              content: "",
              wordCount: 0,
              success: false,
              error: error instanceof Error ? error.message : "生成失败",
            })

            send({
              type: "chapter",
              order: chapterOrder,
              title: chapterTitle,
              wordCount: 0,
              success: false,
              error: error instanceof Error ? error.message : "生成失败",
            })
          }
        }

        // 更新项目状态
        if (project.status === "draft") {
          await prisma.project.update({
            where: { id: projectId },
            data: { status: "writing" },
          })
        }

        await prisma.project.update({
          where: { id: projectId },
          data: { updatedAt: new Date() },
        })

        const successCount = results.filter((r) => r.success).length

        // 发送完成信号
        send({
          type: "complete",
          message: `成功生成 ${successCount}/${chaptersToGenerate} 个章节`,
          generatedCount: successCount,
          totalRequested: chaptersToGenerate,
          results,
        })

      } catch (error) {
        console.error("[Batch Generate] Error:", error)
        send({
          type: "error",
          message: error instanceof Error ? error.message : "生成失败",
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
