/**
 * AI 服务层 - DeepSeek 客户端封装
 */

import * as yaml from "js-yaml"
import {
  buildDeepSeekRequest,
  estimateTokens,
  truncateForTokenLimit,
} from "./prompts"

// ============================================
// 类型定义
// ============================================

export interface AIServiceConfig {
  apiKey?: string
  baseURL?: string
  model?: string
  maxRetries?: number
  timeout?: number
}

export interface AIResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
}

export interface StreamChunk {
  content: string
  done: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ============================================
// DeepSeek 客户端
// ============================================

export class DeepSeekClient {
  private apiKey: string
  private baseURL: string
  private model: string
  private maxRetries: number
  private timeout: number

  constructor(config?: AIServiceConfig) {
    this.apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY || ""
    this.baseURL = config?.baseURL || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    this.model = config?.model || process.env.DEEPSEEK_MODEL || "deepseek-chat"
    this.maxRetries = config?.maxRetries || 3
    this.timeout = config?.timeout || 180000 // 3 分钟超时
  }

  /**
   * 发送聊天请求
   */
  async chat(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<AIResponse> {
    console.log(`[DeepSeek] Starting API request, attempt ${0}`)
    const request = buildDeepSeekRequest(systemPrompt, userPrompt, options)
    console.log(`[DeepSeek] Request payload:`, JSON.stringify(request).slice(0, 200))

    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        console.log(`[DeepSeek] Sending request to ${this.baseURL}/v1/chat/completions`)
        const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`[DeepSeek] Response received, status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[DeepSeek] API error: ${response.status} - ${errorText}`)
          throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log(`[DeepSeek] Response parsed, content length: ${data.choices?.[0]?.message?.content.length || 0}`)

        return {
          content: data.choices[0]?.message?.content || "",
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
          model: data.model || this.model,
          finishReason: data.choices[0]?.finish_reason || "unknown",
        }
      } catch (error) {
        lastError = error as Error
        console.error(`[DeepSeek] API attempt ${attempt + 1} failed:`, error)

        // 如果是取消请求，不重试
        if ((error as Error).name === "AbortError") {
          console.error(`[DeepSeek] Request timeout after ${this.timeout}ms`)
          throw new Error("Request timeout")
        }

        // 等待后重试
        if (attempt < this.maxRetries - 1) {
          console.log(`[DeepSeek] Waiting ${1000 * (attempt + 1)}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    console.error(`[DeepSeek] All ${this.maxRetries} attempts failed`)
    throw lastError || new Error("Failed to call DeepSeek API")
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): AsyncGenerator<StreamChunk> {
    const request = {
      ...buildDeepSeekRequest(systemPrompt, userPrompt, options),
      stream: true,
    }

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              yield { content: "", done: true }
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ""

              if (content) {
                yield { content, done: false }
              }

              // 检查是否有 usage 信息
              if (parsed.usage) {
                yield {
                  content: "",
                  done: false,
                  usage: {
                    promptTokens: parsed.usage.prompt_tokens || 0,
                    completionTokens: parsed.usage.completion_tokens || 0,
                    totalTokens: parsed.usage.total_tokens || 0,
                  },
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: "", done: true }
  }
}

// ============================================
// 剧本 AI 服务
// ============================================

export class ScriptAIService {
  private client: DeepSeekClient

  constructor(config?: AIServiceConfig) {
    this.client = new DeepSeekClient(config)
  }

  /**
   * 分析章节结构
   */
  async analyzeChapter(chapterTitle: string, chapterContent: string): Promise<{
    scenes: Array<{
      sceneNumber: number
      title: string
      location: string
      time: string
      mood: string
      characters: string[]
      summary: string
      keyEvents: string[]
    }>
  }> {
    const { getChapterAnalysisPrompt } = await import("./prompts")
    const systemPrompt = `你是一位专业的剧本分析师，擅长将小说文本转化为结构化的场景分析。`
    const userPrompt = getChapterAnalysisPrompt(chapterTitle, chapterContent)

    const response = await this.client.chat(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 4096,
    })

    // 解析 YAML 响应
    const result = this.parseYAMLResponse<any>(response.content, "scenes")
    return { scenes: result.data || [] }
  }

  /**
   * 提取角色信息
   */
  async extractCharacters(chapterContent: string): Promise<{
    characters: Array<{
      name: string
      role: "protagonist" | "antagonist" | "supporting" | "minor"
      gender: "male" | "female" | "other" | "unknown"
      ageRange: string
      appearance: string
      personality: string
      firstAppearance: string
      keyTraits: string[]
    }>
  }> {
    const { getCharacterExtractionPrompt } = await import("./prompts")
    const systemPrompt = `你是一位专业的剧本分析师，擅长从文本中提取和定义角色信息。`
    const userPrompt = getCharacterExtractionPrompt(chapterContent)

    const response = await this.client.chat(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 2048,
    })

    // 解析响应
    const result = this.parseYAMLResponse<any>(response.content, "characters")
    return { characters: result.data || [] }
  }

  /**
   * 生成分镜镜头
   */
  async generateShots(
    sceneInfo: {
      title: string
      location: string
      mood: string
      characters: string[]
      content: string
    },
    characterInfo: Record<string, { appearance: string; personality: string }>
  ): Promise<{
    shots: Array<{
      shotNumber: string
      shotType: string
      cameraMovement: string
      durationSeconds: number
      description: string
      action: string
      dialogue: string
      moodNote: string
      visualReference: string
    }>
  }> {
    const { getShotGenerationPrompt } = await import("./prompts")
    const systemPrompt = `你是一位专业的分镜导演，擅长将文字描述转化为具体的镜头语言。`
    const userPrompt = getShotGenerationPrompt(
      sceneInfo.title,
      sceneInfo.location,
      sceneInfo.mood,
      sceneInfo.characters,
      sceneInfo.content,
      characterInfo
    )

    const response = await this.client.chat(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 4096,
    })

    console.log("[generateShots] Raw response length:", response.content.length)
    console.log("[generateShots] Raw response preview:", response.content.substring(0, 300))

    // 解析响应
    const result = this.parseYAMLResponse<any>(response.content, "shots")
    console.log("[generateShots] Parsed result:", JSON.stringify(result).substring(0, 200))
    console.log("[generateShots] Shots count:", result.data?.length || 0)

    // 字段映射：AI 返回下划线格式，转换为驼峰格式
    const mappedShots = (result.data || []).map((shot: any) => ({
      shotNumber: shot.shot_number || shot.shotNumber || "",
      shotType: shot.shot_type || shot.shotType || "MS",
      cameraMovement: shot.camera_movement || shot.cameraMovement || "固定",
      durationSeconds: shot.duration_seconds || shot.durationSeconds || 5,
      description: shot.description || "",
      action: shot.action || "",
      dialogue: shot.dialogue || "",
      moodNote: shot.mood_note || shot.moodNote || "",
      visualReference: shot.visual_reference || shot.visualReference || "",
    }))

    return { shots: mappedShots }
  }

  /**
   * 流式生成分镜镜头
   */
  async *generateShotsStream(
    sceneInfo: {
      title: string
      location: string
      mood: string
      characters: string[]
      content: string
    },
    characterInfo: Record<string, { appearance: string; personality: string }>
  ): AsyncGenerator<string> {
    const { getShotGenerationPrompt } = await import("./prompts")
    const systemPrompt = `你是一位专业的分镜导演，擅长将文字描述转化为具体的镜头语言。`
    const userPrompt = getShotGenerationPrompt(
      sceneInfo.title,
      sceneInfo.location,
      sceneInfo.mood,
      sceneInfo.characters,
      sceneInfo.content,
      characterInfo
    )

    for await (const chunk of this.client.chatStream(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 4096,
    })) {
      if (chunk.content) {
        yield chunk.content
      }
    }
  }

  /**
   * 估算成本
   */
  estimateCost(promptTokens: number, completionTokens: number): number {
    // DeepSeek 价格（示例，实际价格请参考官方）
    // 输入：¥0.001/1K tokens
    // 输出:¥0.002/1K tokens
    const inputCost = (promptTokens / 1000) * 0.001
    const outputCost = (completionTokens / 1000) * 0.002
    return inputCost + outputCost
  }

  /**
   * 解析 YAML 响应
   */
  private parseYAMLResponse<T>(content: string, key: string): { data: T[] } {
    try {
      // 提取 YAML 代码块
      const yamlMatch = content.match(/```yaml\s*([\s\S]*?)\s*```/)
      let yamlContent: string

      if (yamlMatch) {
        yamlContent = yamlMatch[1]
      } else {
        // 尝试直接使用整个内容
        yamlContent = content
      }

      // 预处理：修复常见的 YAML 格式问题
      // 1. 修复多行字符串（将未闭合的引号内的换行符替换为空格）
      yamlContent = this.fixYamlMultilineStrings(yamlContent)

      // 2. 移除重复的键（AI 有时会生成重复的键）
      yamlContent = this.removeDuplicateKeys(yamlContent)

      // 使用 js-yaml 解析
      const parsed = yaml.load(yamlContent) as Record<string, unknown>

      if (parsed && parsed[key]) {
        return { data: parsed[key] as T[] }
      }

      return { data: [] as T[] }
    } catch (error) {
      console.error("Failed to parse YAML response:", error)
      console.error("Original content:", content.substring(0, 500))
      return { data: [] as T[] }
    }
  }

  /**
   * 修复 YAML 中的多行字符串问题
   */
  private fixYamlMultilineStrings(yamlContent: string): string {
    // 将多行字符串值合并为单行（用空格连接）
    // 处理类似 "xxx... 的未闭合字符串
    const lines = yamlContent.split('\n')
    const fixedLines: string[] = []
    let inQuotedValue = false
    let currentLine = ''

    for (const line of lines) {
      // 统计当前行中的引号数量
      const quoteCount = (line.match(/"/g) || []).length

      if (inQuotedValue) {
        // 正在处理多行字符串值
        currentLine += ' ' + line.trim()
        if (quoteCount % 2 === 1) {
          // 引号闭合了
          fixedLines.push(currentLine)
          currentLine = ''
          inQuotedValue = false
        }
      } else {
        if (quoteCount % 2 === 1 && line.trim().endsWith('"') === false) {
          // 开始一个未闭合的多行字符串
          inQuotedValue = true
          currentLine = line
        } else {
          fixedLines.push(line)
        }
      }
    }

    // 处理未闭合的最后行
    if (currentLine) {
      fixedLines.push(currentLine)
    }

    return fixedLines.join('\n')
  }

  /**
   * 移除 YAML 中的重复键
   * AI 有时会在同一个对象中生成重复的键，导致解析失败
   */
  private removeDuplicateKeys(yamlContent: string): string {
    const lines = yamlContent.split('\n')
    const fixedLines: string[] = []
    const seenKeysInObject = new Set<string>()
    let inArrayItem = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // 检测数组项开始（如 "- shot_number:")
      if (trimmedLine.startsWith('- ')) {
        // 新的数组项，重置已见键集合
        seenKeysInObject.clear()
        inArrayItem = true
        fixedLines.push(line)
        continue
      }

      // 检测键值对（如 "shot_number: \"5\"")
      const keyMatch = trimmedLine.match(/^(\w+):\s*/)
      if (keyMatch && inArrayItem) {
        const key = keyMatch[1]
        if (seenKeysInObject.has(key)) {
          // 重复键，跳过这行
          console.warn(`Skipping duplicate key: ${key}`)
          continue
        }
        seenKeysInObject.add(key)
      }

      fixedLines.push(line)
    }

    return fixedLines.join('\n')
  }
}

// ============================================
// 单例实例
// ============================================

let scriptAIServiceInstance: ScriptAIService | null = null

export function getScriptAIService(): ScriptAIService {
  if (!scriptAIServiceInstance) {
    scriptAIServiceInstance = new ScriptAIService()
  }
  return scriptAIServiceInstance
}

export function getDeepSeekClient(): DeepSeekClient {
  return new DeepSeekClient()
}
