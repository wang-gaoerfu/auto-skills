import OpenAI from "openai"

// DeepSeek 配置
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
  dangerouslyAllowBrowser: true,
})

export interface GenerateOptions {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface StreamChunk {
  content: string
  done: boolean
}

// 生成文本（非流式）
export async function generateText(options: GenerateOptions): Promise<string> {
  const {
    prompt,
    systemPrompt = "你是一位专业的小说作家",
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  try {
    const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  })

    return response.choices[0]?.message?.content || ""
  } catch (error) {
    console.error("DeepSeek generate error:", error)
    throw error
  }
}

// 生成文本（流式）
export async function* generateTextStream(
  options: GenerateOptions
): AsyncGenerator<StreamChunk> {
  const {
    prompt,
    systemPrompt = "你是一位专业的小说作家",
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  try {
    const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
    })

    for await (const chunk of response.choices) {
      const content = chunk?.delta?.content || ""
      const done = chunk?.finish_reason === "stop"

      yield { content, done }
    }
  } catch (error) {
    console.error("DeepSeek stream error:", error)
    throw error
  }
}

// 小说相关提示词模板
export const PROMPT_TEMPLATES = {
  // 生成书名
  generateTitle: `根据以下信息，生成5个吸引人的小说书名：
风格：{{style}}
题材：{{genre}}
核心元素：{{elements}}
要求：
1. 书名要有吸引力，让人一看就想读
2. 符合题材风格
3. 3-5个字为宜`,

  // 生成简介
  generateDescription: `为以下小说生成简介：
书名：{{title}}
风格：{{style}}
题材：{{genre}}
主要人物：{{characters}}
大纲概要：{{outline}}
要求：
1. 100-200字
2. 突出故事亮点
3. 吸引读者阅读`,

  // 生成大纲
  generateOutline: `作为专业的网络小说策划，基于以下信息设计大纲：
风格：{{style}}
题材：{{genre}}
主要人物：{{characters}}
故事背景：{{background}}
核心冲突：{{conflict}}
要求：
1. 设计3-5个重大转折点
2. 人物塑造要立体，性格鲜明
3. 提炼核心冲突，设计多重矛盾
4. 规划10个章节的情节走向`,

  // 生成章节大纲
  generateChapterOutline: `根据小说大纲，生成第{{chapterNumber}}章的详细大纲：
小说大纲：{{outline}}
前情提要：{{previousContent}}
本章要点：{{keyPoints}}
要求：
1. 500字左右
2. 包含核心看点、情节线索、感情线发展、伏笔设置
3. 与前后章节衔接自然`,

  // 生成章节内容
  generateChapterContent: `根据章节大纲，生成小说章节正文：
章节标题：{{chapterTitle}}
章节大纲：{{chapterOutline}}
人物设定：{{characters}}
世界观：{{world}}
前文内容：{{previousContent}}
要求：
1. 3000字左右
2. 多感官描写（视觉、听觉、触觉）
3. 对话生动自然
4. 节奏张弛有度
5. 人物性格鲜明`,

  // AI优化 - 润色
  polish: `请润色以下正文，提升文笔：
{{content}}
要求：
1. 保持原意
2. 语言更优美流畅
3. 增加细节描写
4. 优化对话`,

  // AI优化 - 扩写
  expand: `请扩写以下内容：
{{content}}
扩写方向：{{direction}}
要求：
1. 保持原有风格
2. 增加细节和描写
3. 字数增加50%左右`,

  // AI优化 - 去AI味
  removeAITaste: `请去除以下文本的AI生成痕迹，使其更自然：
{{content}}
要求：
1. 减少模式化表达
2. 增加变化和个性
3. 语言更自然流畅`,

  // AI评分
  scoreContent: `请对以下{{type}}进行评分（1-10分），并给出改进建议：
{{content}}
评分标准：
1. 情节逻辑性
2. 人物塑造
3. 文笔质量
4. 吸引力`,

  // 续写
  continueWriting: `请续写以下内容：
{{content}}
续写方向：{{direction}}
续写字数：{{wordCount}}字左右
要求：
1. 与原文风格一致
2. 情节自然衔接
3. 保持人物性格`,

  // 角色生成
  generateCharacter: `请生成一个小说角色：
角色类型：{{type}}
故事背景：{{background}}
相关角色：{{relatedCharacters}}
要求：
1. 姓名（中文）
2. 外貌描写
3. 性格特点（3-5个）
4. 背景故事
5. 与其他角色的关系`,

  // 对话生成
  generateDialogue: `请为以下场景生成对话：
场景：{{scene}}
角色：{{characters}}
情绪：{{emotion}}
目的：{{purpose}}
要求：
1. 对话自然生动
2. 体现角色性格
3. 推动情节发展`,

  // 批量生成章节标题
  batchChapterTitles: `作为专业的小说策划，请生成{{count}}个章节标题。

小说大纲：{{outline}}
主题/题材：{{theme}}
补充说明：{{prompt}}

要求：
1. 每行一个章节标题，格式为"数字. 章节标题"（如"1. 初入江湖"）
2. 标题要有吸引力，体现章节核心内容
3. 章节之间要有逻辑连贯性，形成完整的故事线
4. 标题长度3-8个字为宜
5. 只输出章节标题列表，不要其他说明`,
}

// 替换提示词变量
export function replaceVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value))
  }
  return result
}

// 生成小说书名
export async function generateBookTitle(params: {
  style: string
  genre: string
  elements: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateTitle, params)
  const result = await generateText({
    prompt,
    temperature: 0.9,
  })
  return result.split("\n").filter((line) => line.trim())[0] || ""
}

// 生成小说简介
export async function generateBookDescription(params: {
  title: string
  style: string
  genre: string
  characters: string
  outline: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateDescription, params)
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 500,
  })
}

// 生成小说大纲
export async function generateBookOutline(params: {
  style: string
  genre: string
  characters: string
  background: string
  conflict: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateOutline, params)
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 3000,
  })
}

// 生成章节内容
export async function generateChapter(params: {
  chapterTitle: string
  chapterOutline: string
  characters: string
  world: string
  previousContent: string
  stream?: boolean
}): Promise<string> | AsyncGenerator<StreamChunk> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateChapterContent, params)

  if (params.stream) {
    return generateTextStream({
      prompt,
      temperature: 0.85,
      maxTokens: 4000,
    })
  }

  return generateText({
    prompt,
    temperature: 0.85,
    maxTokens: 4000,
  })
}

// 润色文本
export async function polishText(content: string): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.polish, { content })
  return generateText({
    prompt,
    temperature: 0.7,
    maxTokens: 4000,
  })
}

// 扩写文本
export async function expandText(
  content: string,
  direction: string
): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.expand, { content, direction })
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 4000,
  })
}

// 去除AI味
export async function removeAITaste(content: string): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.removeAITaste, { content })
  return generateText({
    prompt,
    temperature: 0.7,
    maxTokens: 4000,
  })
}

// 续写内容
export async function continueWriting(
  content: string,
  direction: string,
  wordCount: number
): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.continueWriting, {
    content,
    direction,
    wordCount,
  })
  return generateText({
    prompt,
    temperature: 0.85,
    maxTokens: 4000,
  })
}

// 评分内容
export async function scoreContent(
  content: string,
  type: string
): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.scoreContent, { content, type })
  return generateText({
    prompt,
    temperature: 0.5,
    maxTokens: 500,
  })
}

// 生成角色
export async function generateCharacter(params: {
  type: string
  background: string
  relatedCharacters: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateCharacter, params)
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 1000,
  })
}

// 生成书名（API 兼容别名）
export async function generateTitle(params: {
  style?: string
  genre?: string
  elements?: string
  prompt?: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateTitle, {
    style: params.style || "现代",
    genre: params.genre || "都市",
    elements: params.elements || params.prompt || "",
  })
  const result = await generateText({
    prompt,
    temperature: 0.9,
  })
  // 返回第一个书名
  return result.split("\n").filter((line) => line.trim())[0] || ""
}

// 生成小说大纲（API 兼容别名）
export async function generateOutline(params: {
  style?: string
  genre?: string
  characters?: string
  world?: string
  background?: string
  conflict?: string
  prompt?: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateOutline, {
    style: params.style || "现代",
    genre: params.genre || "都市",
    characters: params.characters || "",
    background: params.background || params.world || "",
    conflict: params.conflict || "",
  })
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 3000,
  })
}

// 生成章节大纲（用于批量生成章节标题）
export async function generateChapterOutline(params: {
  outline?: string
  prompt?: string
  count?: number
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.batchChapterTitles, {
    outline: params.outline || "暂无大纲",
    theme: "",
    prompt: params.prompt || "",
    count: params.count || 5,
  })
  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 2000,
  })
}

// 生成章节内容（API 兼容别名）
export async function generateChapterContent(params: {
  chapterTitle: string
  chapterOutline?: string
  characters?: string
  world?: string
  previousContent?: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateChapterContent, {
    chapterTitle: params.chapterTitle,
    chapterOutline: params.chapterOutline || "",
    characters: params.characters || "",
    world: params.world || "",
    previousContent: params.previousContent || "",
  })
  return generateText({
    prompt,
    temperature: 0.85,
    maxTokens: 4000,
  })
}
