/**
 * AI 剧本信息推荐 API
 *
 * POST /api/scripts/suggest
 * - 根据内容自动推荐标题、描述、题材
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateText } from "@/lib/ai/deepseek"

// ============================================
// AI 推荐提示词
// ============================================

const SUGGEST_PROMPT = `你是一位专业的剧本编辑，擅长为小说内容生成吸引人的剧本标题、描述和题材标签。

请分析以下小说内容，返回 JSON 格式的建议：

\`\`\`json
{
  "title": "建议的剧本标题（简短有力，8-15字）",
  "description": "简短描述（30-60字，突出核心冲突和看点）",
  "genre": "题材分类（从以下选择：都市、玄幻、修仙、言情、悬疑、历史、科幻、武侠、其他）",
  "reasoning": "简短说明推荐理由（20-30字）"
}
\`\`\`

要求：
1. 标题要有吸引力和画面感
2. 描述要突出核心冲突和视觉化元素
3. 题材要准确反映内容特征
4. 所有文本使用中文

【内容】
{content}

【分析并返回 JSON】`

const ORIGINAL_SUGGEST_PROMPT = `你是一位专业的剧本编辑，擅长创作{genre}题材的剧本。

请根据"{genre}"题材，生成 3 个不同的剧本标题和描述创意，返回 JSON 格式：

\`\`\`json
{
  "suggestions": [
    {
      "title": "创意1标题（简短有力，8-15字）",
      "description": "创意1描述（30-60字，突出核心冲突和看点）",
      "reasoning": "创意亮点（15-30字）"
    },
    {
      "title": "创意2标题（简短有力，8-15字）",
      "description": "创意2描述（30-60字，突出核心冲突和看点）",
      "reasoning": "创意亮点（15-30字）"
    },
    {
      "title": "创意3标题（简短有力，8-15字）",
      "description": "创意3描述（30-60字，突出核心冲突和看点）",
      "reasoning": "创意亮点（15-30字）"
    }
  ]
}
\`\`\`

要求：
1. 3 个创意要风格各异，给用户更多选择
2. 标题要有吸引力和画面感
3. 描述要突出核心冲突和视觉化元素
4. 所有文本使用中文

【生成 3 个创意并返回 JSON】`

// ============================================
// POST - AI 推荐
// ============================================

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "SCRIPT_001" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { content, sourceType, sourceProjectId, genre } = body

    // ORIGINAL mode: generate multiple creative suggestions based on genre
    if (sourceType === "ORIGINAL" && genre) {
      const prompt = ORIGINAL_SUGGEST_PROMPT.replace(/\{genre\}/g, genre)

      const result = await generateText({
        prompt,
        systemPrompt: "你是一位专业的剧本编辑",
        temperature: 0.8,
        maxTokens: 2000,
      })

      // 解析 JSON 响应
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result;

      let parsed
      try {
        parsed = JSON.parse(jsonStr)
      } catch (e) {
        parsed = JSON.parse(result)
      }

      return NextResponse.json({
        suggestions: parsed.suggestions || [],
      })
    }

    // Other modes: analyze content
    if (!content && sourceType !== "ORIGINAL") {
      return NextResponse.json(
        { error: "请提供内容" },
        { status: 400 }
      )
    }

    // 如果是自有项目，获取项目内容
    let analysisContent = content || ""
    if (sourceType === "OWN_PROJECT" && sourceProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: sourceProjectId },
        select: {
          title: true,
          description: true,
        },
      })

      if (project) {
        analysisContent = `作品名：${project.title}\n简介：${project.description || "暂无"}`
      }
    }

    // 限制内容长度（只取前 1000 字进行分析）
    const previewContent = analysisContent.slice(0, 1000)
    const prompt = SUGGEST_PROMPT.replace("{content}", previewContent)

    // 调用 AI
    const result = await generateText({
      prompt,
      systemPrompt: "你是一位专业的剧本编辑",
      temperature: 0.7,
      maxTokens: 1500,
    })

    // 解析 JSON 响应
    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : result;

    let suggestions
    try {
      suggestions = JSON.parse(jsonStr)
    } catch (e) {
      // 如果解析失败，尝试直接解析
      suggestions = JSON.parse(result)
    }

    return NextResponse.json({
      suggestions: {
        title: suggestions.title || "",
        description: suggestions.description || "",
        genre: suggestions.genre || "",
        reasoning: suggestions.reasoning || "",
      },
    })
  } catch (error) {
    console.error("Failed to generate suggestions:", error)
    return NextResponse.json(
      { error: "AI 推荐失败，请稍后重试" },
      { status: 500 }
    )
  }
}
