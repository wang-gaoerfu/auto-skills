/**
 * 剧本系统 AI 提示词
 *
 * 所有提示词均为原创设计，无版权问题
 */

// ============================================
// 系统提示词
// ============================================

/** 剧本分析师角色 */
export const SYSTEM_PROMPT_SCRIPT_ANALYST = `你是一位专业的剧本分析师和分镜编剧，拥有丰富的影视剧本创作经验。
你的任务是将小说文本转化为专业的分镜剧本，包括：
1. 分析故事结构，划分场景
2. 提取和定义角色信息
3. 为每个场景生成分镜镜头描述

你需要遵循专业分镜剧本的格式规范，输出结构化的 YAML 格式内容。`

/** 分镜导演角色 */
export const SYSTEM_PROMPT_DIRECTOR = `你是一位专业的分镜导演，擅长将文字描述转化为具体的镜头语言。
你的职责是根据场景描述和角色信息，生成专业的分镜镜头脚本，包括：
- 镜头类型（特写、中景、远景等）
- 镜头运动（推、拉、摇、移等）
- 画面内容描述
- 角色动作和表情
- 场景氛围和光线
- 预估时长

输出必须严格遵循 YAML 格式。`

// ============================================
// 章节分析提示词
// ============================================

/** 分析章节结构 */
export function getChapterAnalysisPrompt(chapterTitle: string, chapterContent: string): string {
  return `请分析以下小说章节，识别其中的场景划分和关键情节点。

## 章节标题
${chapterTitle}

## 章节内容
\`\`\`
${chapterContent}
\`\`\`

## 任务要求
1. 将章节划分为若干个连续的场景
2. 每个场景应该有明确的地点和时间
3. 识别场景中的主要角色
4. 提取场景的核心冲突或情节点

## 输出格式（YAML）
\`\`\`yaml
scenes:
  - scene_number: 1
    title: "场景标题"
    location: "地点描述"
    time: "时间（白天/夜晚/黄昏等）"
    mood: "氛围（紧张/温馨/神秘等）"
    characters:
      - "角色名1"
      - "角色名2"
    summary: "场景概要（50-100字）"
    key_events:
      - "关键事件1"
      - "关键事件2"
\`\`\`

请直接输出 YAML 内容，不要包含其他解释文字。`
}

// ============================================
// 角色提取提示词
// ============================================

/** 从章节中提取角色 */
export function getCharacterExtractionPrompt(chapterContent: string): string {
  return `请从以下文本中提取所有出现的角色信息。

## 文本内容
\`\`\`
${chapterContent}
\`\`\`

## 任务要求
1. 识别文本中所有有名字的角色
2. 根据文本描述推断角色的基本特征
3. 判断角色在故事中的重要程度
4. 记录角色的外貌特征和性格特点

## 输出格式（YAML）
\`\`\`yaml
characters:
  - name: "角色名称"
    role: "protagonist|antagonist|supporting|minor"
    gender: "male|female|other|unknown"
    age_range: "年龄段（如：青年、中年等）"
    appearance: "外貌描述（50字以内）"
    personality: "性格特点（30字以内）"
    first_appearance: "首次出现的场景描述"
    key_traits:
      - "特征1"
      - "特征2"
\`\`\`

请直接输出 YAML 内容，不要包含其他解释文字。`
}

/** 合并和去重角色列表 */
export function getCharacterMergePrompt(existingCharacters: string[], newCharacters: string[]): string {
  return `请分析以下两组角色列表，判断是否存在重复或相似的角色，需要进行合并。

## 已有角色
${existingCharacters.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 新提取的角色
${newCharacters.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 任务要求
1. 识别可能重复的角色（名字相似、描述相似）
2. 返回需要合并的角色映射关系
3. 返回新增的唯一角色

## 输出格式（YAML）
\`\`\`yaml
merges:
  - existing: "已有角色名"
    new: "新角色名"
    reason: "合并原因"

new_characters:
  - "新增角色1"
  - "新增角色2"
\`\`\`

如果没有需要合并的角色，merges 列表为空。请直接输出 YAML 内容。`
}

// ============================================
// 分镜生成提示词
// ============================================

/** 生成分镜镜头 */
export function getShotGenerationPrompt(
  sceneTitle: string,
  sceneLocation: string,
  sceneMood: string,
  sceneCharacters: string[],
  sceneContent: string,
  characterInfo: Record<string, { appearance: string; personality: string }>
): string {
  const characterDescriptions = Object.entries(characterInfo)
    .map(([name, info]) => `- ${name}：${info.appearance}，性格${info.personality}`)
    .join('\n')

  return `请为以下场景生成分镜镜头脚本。

## 场景信息
- 标题：${sceneTitle}
- 地点：${sceneLocation}
- 氛围：${sceneMood}
- 出场角色：${sceneCharacters.join('、')}

## 角色参考
${characterDescriptions || '无角色信息'}

## 场景内容
\`\`\`
${sceneContent}
\`\`\`

## 任务要求
1. 将场景内容分解为 3-8 个镜头
2. 每个镜头需要有明确的画面描述
3. 包含角色动作、表情、对话的指示
4. 合理安排镜头类型和运动
5. 估算每个镜头的时长

## 镜头类型参考
- 远景(LS)：展示环境和人物关系
- 全景(FS)：展示人物全身
- 中景(MS)：展示人物半身
- 近景(CU)：展示人物面部
- 特写(ECU)：展示细节

## 镜头运动参考
- 固定：镜头不动
- 推：镜头向前移动
- 拉：镜头向后移动
- 摇：镜头水平转动
- 移：镜头平行移动
- 跟：跟随主体移动

## 输出格式（YAML）
\`\`\`yaml
shots:
  - shot_number: "1"
    shot_type: "MS"
    camera_movement: "固定"
    duration_seconds: 5
    description: "画面内容描述"
    action: "角色动作描述"
    dialogue: "对话内容（如有）"
    mood_note: "氛围提示"
    visual_reference: "视觉参考描述"
\`\`\`

请直接输出 YAML 内容，不要包含其他解释文字。`
}

/** 批量生成分镜 */
export function getBatchShotGenerationPrompt(
  scenes: Array<{
    sceneNumber: number
    title: string
    location: string
    mood: string
    characters: string[]
    content: string
  }>,
  characterInfo: Record<string, { appearance: string; personality: string }>
): string {
  const scenesDescription = scenes
    .map(
      (s) => `
### 场景 ${s.sceneNumber}: ${s.title}
- 地点：${s.location}
- 氛围：${s.mood}
- 角色：${s.characters.join('、')}
- 内容概要：${s.content.substring(0, 200)}...
`
    )
    .join('\n')

  const characterDescriptions = Object.entries(characterInfo)
    .map(([name, info]) => `- ${name}：${info.appearance}，性格${info.personality}`)
    .join('\n')

  return `请为以下多个场景生成分镜镜头脚本。

## 角色参考
${characterDescriptions || '无角色信息'}

## 场景列表
${scenesDescription}

## 任务要求
1. 为每个场景生成 2-5 个关键镜头
2. 每个镜头需要有明确的画面描述
3. 确保镜头之间的连贯性
4. 注意场景之间的过渡

## 输出格式（YAML）
\`\`\`yaml
scenes:
  - scene_number: 1
    shots:
      - shot_number: "1-1"
        shot_type: "LS"
        camera_movement: "推"
        duration_seconds: 4
        description: "画面内容"
        action: "角色动作"
        dialogue: ""
        mood_note: "氛围提示"
      - shot_number: "1-2"
        # ... 更多镜头
  - scene_number: 2
    shots:
      # ... 场景2的镜头
\`\`\`

请直接输出 YAML 内容，不要包含其他解释文字。`
}

// ============================================
// 导出提示词
// ============================================

/** 生成导出摘要 */
export function getExportSummaryPrompt(
  projectTitle: string,
  totalScenes: number,
  totalShots: number,
  totalDuration: number
): string {
  return `请为以下剧本项目生成一个简洁的项目摘要。

## 项目信息
- 标题：${projectTitle}
- 场景数：${totalScenes}
- 镜头数：${totalShots}
- 预估总时长：${Math.floor(totalDuration / 60)}分${totalDuration % 60}秒

## 任务要求
1. 生成 100-150 字的项目摘要
2. 突出剧本的主题和风格
3. 描述整体叙事结构

## 输出格式
直接输出摘要文本，不要包含其他内容。`
}

// ============================================
// API 请求构建
// ============================================

/** 构建 DeepSeek API 请求 */
export function buildDeepSeekRequest(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature: number
  max_tokens: number
} {
  return {
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  }
}

/** 解析 YAML 响应 */
export function parseYAMLResponse<T>(response: string): T | null {
  try {
    // 提取 YAML 代码块
    const yamlMatch = response.match(/```yaml\s*([\s\S]*?)\s*```/)
    if (yamlMatch) {
      // 简单的 YAML 解析（实际项目中应使用 js-yaml 库）
      const yamlContent = yamlMatch[1]
      return parseSimpleYAML(yamlContent) as T
    }

    // 尝试直接解析
    return parseSimpleYAML(response) as T
  } catch (error) {
    console.error("Failed to parse YAML response:", error)
    return null
  }
}

/** 简单的 YAML 解析器（用于基本结构） */
function parseSimpleYAML(yaml: string): unknown {
  // 这是一个非常简化的 YAML 解析器
  // 实际项目中应该使用 js-yaml 库
  const lines = yaml.split("\n")
  const result: Record<string, unknown> = {}
  let currentKey = ""
  let currentArray: unknown[] | null = null

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue

    const content = line.trim()

    if (content.includes(":")) {
      const [key, ...valueParts] = content.split(":")
      const value = valueParts.join(":").trim()

      if (value === "") {
        currentKey = key.trim()
        result[currentKey] = {}
      } else {
        // 处理带引号的值
        const cleanValue = value.replace(/^["']|["']$/g, "")
        result[key.trim()] = cleanValue
      }
    } else if (content.startsWith("- ")) {
      if (!currentArray) {
        currentArray = []
        result[currentKey] = currentArray
      }
      currentArray.push(content.substring(2).replace(/^["']|["']$/g, ""))
    }
  }

  return result
}

/** 估算 token 数量（简单估算） */
export function estimateTokens(text: string): number {
  // 中文约 1.5 字/token，英文约 4 字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishChars = text.length - chineseChars
  return Math.ceil(chineseChars / 1.5 + englishChars / 4)
}

/** 截断文本以适应 token 限制 */
export function truncateForTokenLimit(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text)
  if (currentTokens <= maxTokens) return text

  // 按比例截断
  const ratio = maxTokens / currentTokens
  const targetLength = Math.floor(text.length * ratio * 0.9) // 留 10% 余量
  return text.substring(0, targetLength) + "..."
}
