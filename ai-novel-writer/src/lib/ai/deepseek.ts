import OpenAI from "openai"

// DeepSeek 配置 - 根据运行环境动态配置
const isServer = typeof window === "undefined"

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
  // 设置较长的超时时间（2分钟）
  timeout: 120000,
  // 仅在浏览器端需要此选项，服务端不需要
  ...(isServer ? {} : { dangerouslyAllowBrowser: true }),
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
    console.log("[DeepSeek] Generating text, prompt length:", prompt.length)

    const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  })

    const content = response.choices[0]?.message?.content || ""
    console.log("[DeepSeek] Generated text length:", content.length)
    return content
  } catch (error: any) {
    console.error("[DeepSeek] Generate error:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    })
    // 重新抛出带有更详细信息的错误
    if (error?.status === 401) {
      throw new Error("DeepSeek API密钥无效，请检查配置")
    } else if (error?.status === 429) {
      throw new Error("DeepSeek API请求过于频繁，请稍后重试")
    } else if (error?.code === "ETIMEDOUT" || error?.code === "ECONNREFUSED") {
      throw new Error("DeepSeek API连接超时，请检查网络")
    }
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

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta
      const content = delta?.content || ""
      const done = chunk.choices[0]?.finish_reason === "stop"

      yield { content, done }
    }
  } catch (error) {
    console.error("DeepSeek stream error:", error)
    throw error
  }
}

// ============================================
// 题材配置 - 从参考项目提取的完整提示词系统
// ============================================

export interface GenreConfig {
  name: string
  prompts: {
    outline: string
    chapter: string
    content: string
  }
  outlineMenu: Array<{ name: string; prompt: string }>
  chapterMenu?: Array<{ name: string; prompt: string }>
  contentMenu?: Array<{ name: string; prompt: string }>
}

export const GENRE_CONFIGS: Record<string, GenreConfig> = {
  // 都市重生
  urbanReborn: {
    name: "都市重生",
    prompts: {
      outline: `作为资深小说策划，请基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作一个都市重生故事。要求：
1.设定吸引人的重生契机
2.规划3-5个事业转折点
3.设计感情与事业双线发展
4.突出商战与情感冲突
5.体现重生者的成长蜕变`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.职场布局与人脉积累
2.感情线索的推进方式
3.具体商业机遇把握
4.敌我力量对比变化
5.个人成长的关键节点`,
      content: `【重要】你正在为小说的章节《{{chapterTitle}}》创作正文内容。请确保你生成的内容是针对这个特定章节的，不要生成其他章节的内容。

基于以下信息创作：
- 章节标题：{{chapterTitle}}
- 章节大纲：{{chapterOutline}}
- 背景设定：{{background}}
- 人物设定：{{characters}}
- 关系设定：{{relationships}}
- 剧情设定：{{plot}}
- 前文内容：{{previousContent}}

写作要求：
1.商战细节要专业
2.感情描写要细腻
3.对话要凸显身份
4.场景要突出格调
5.节奏要张弛有度

注意：标题必须是"{{chapterTitle}}"，不要写成其他章节的标题。`
    },
    outlineMenu: [
      { name: "深化冲突", prompt: "基于背景：{{background}}\n人物：{{characters}}\n在保持合理性的前提下，将以下内容的冲突升级，制造更强的戏剧性：{{selected_text}}" },
      { name: "增加伏笔", prompt: "分析剧情：{{plot}}\n为以下内容设计巧妙的伏笔，为后续发展埋下种子：{{selected_text}}" },
      { name: "完善人物动机", prompt: "基于人物性格：{{characters}}\n关系：{{relationships}}\n补充和优化以下内容中人物的行动动机，使其更符合性格：{{selected_text}}" },
      { name: "强化感情线", prompt: "基于角色关系：{{relationships}}\n加强以下内容中的感情发展，让感情线更吸引人：{{selected_text}}" },
      { name: "优化节奏", prompt: "分析当前剧情走向，调整以下内容的节奏安排，确保张弛有度：{{selected_text}}" },
      { name: "扩充细节", prompt: "基于背景：{{background}}\n为以下内容补充更多细节，增强画面感和沉浸感：{{selected_text}}" },
      { name: "提升高潮", prompt: "在符合逻辑的前提下，将以下内容的高潮部分改写得更加震撼：{{selected_text}}" },
      { name: "商战升级", prompt: "在{{selected_text}}中加入一场高水平商业博弈，突出主角的商业才能" },
      { name: "危机应对", prompt: "为{{selected_text}}设置一个重大危机及其化解过程，展现主角的应变能力" },
      { name: "资源整合", prompt: "在{{selected_text}}中展现主角整合各方资源的手段与能力" }
    ]
  },

  // 脑洞网文
  brainHole: {
    name: "脑洞网文",
    prompts: {
      outline: `作为脑洞文策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作天马行空的故事。要求：
1.设定独特世界观
2.规划3-5个惊人梗点
3.设计反转与逆转
4.突出脑洞创意性
5.体现故事魔幻感`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.创意点的展现
2.逻辑的自洽性
3.反转的设计感
4.人物的特异性
5.世界的新奇感`,
      content: `【重要】你正在为小说的章节《{{chapterTitle}}》创作正文内容。请确保你生成的内容是针对这个特定章节的，不要生成其他章节的内容。

基于以下信息创作：
- 章节标题：{{chapterTitle}}
- 章节大纲：{{chapterOutline}}
- 背景设定：{{background}}
- 人物设定：{{characters}}
- 关系设定：{{relationships}}
- 剧情设定：{{plot}}
- 前文内容：{{previousContent}}

写作要求：
1.创意要出人意料
2.逻辑要自圆其说
3.画面要奇幻独特
4.细节要异想天开
5.节奏要跌宕起伏

注意：标题必须是"{{chapterTitle}}"，不要写成其他章节的标题。`
    },
    outlineMenu: [
      { name: "设定解密", prompt: "在{{selected_text}}中揭示一个惊人的世界设定" },
      { name: "逆天改命", prompt: "为{{selected_text}}设计一个打破常规的逆转" },
      { name: "脑洞升级", prompt: "在{{selected_text}}中加入更疯狂的脑洞元素" },
      { name: "身份反转", prompt: "为{{selected_text}}设计一个意想不到的身份揭露" },
      { name: "规则突破", prompt: "在{{selected_text}}中打破既有规则限制" },
      { name: "时空交错", prompt: "为{{selected_text}}增加时空穿梭的元素" },
      { name: "异能觉醒", prompt: "描写{{selected_text}}中诡异的能力觉醒" },
      { name: "终极真相", prompt: "在{{selected_text}}中埋下终极真相的线索" },
      { name: "维度跨越", prompt: "为{{selected_text}}添加维度穿越的情节" },
      { name: "崩坏重构", prompt: "在{{selected_text}}中展现世界秩序的崩坏重组" }
    ]
  },

  // 都市修仙
  urbanCultivation: {
    name: "都市修仙",
    prompts: {
      outline: `作为修仙小说策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作都市修仙故事。要求：
1.设定独特的修炼体系
2.规划3-5个境界突破点
3.设计修仙与都市双线
4.突出正邪势力冲突
5.体现主角的道心成长`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.修炼进境的关键
2.仙凡矛盾的处理
3.机缘造化的把握
4.敌我实力的变化
5.道心历练的体现`,
      content: `【重要】你正在为小说的章节《{{chapterTitle}}》创作正文内容。请确保你生成的内容是针对这个特定章节的，不要生成其他章节的内容。

基于以下信息创作：
- 章节标题：{{chapterTitle}}
- 章节大纲：{{chapterOutline}}
- 背景设定：{{background}}
- 人物设定：{{characters}}
- 关系设定：{{relationships}}
- 剧情设定：{{plot}}
- 前文内容：{{previousContent}}

写作要求：
1.修炼描写要专业
2.战斗场面要震撼
3.仙凡转换要自然
4.格调要玄妙雅致
5.节奏要紧张有序

注意：标题必须是"{{chapterTitle}}"，不要写成其他章节的标题。`
    },
    outlineMenu: [
      { name: "深化修炼", prompt: "基于修炼体系：{{background}}\n在{{selected_text}}中加入一场关键的修炼突破" },
      { name: "仙凡冲突", prompt: "在{{selected_text}}中制造修仙与现实世界的矛盾冲突" },
      { name: "强化战斗", prompt: "基于角色实力：{{characters}}\n优化{{selected_text}}中的修仙斗法场景" },
      { name: "增添机缘", prompt: "在{{selected_text}}中安排修仙机缘际遇" },
      { name: "道心考验", prompt: "为{{selected_text}}设置一个考验主角道心的情节" },
      { name: "势力对抗", prompt: "在{{selected_text}}中展现正邪两道势力的较量" },
      { name: "法宝炼制", prompt: "加入{{selected_text}}中的法宝炼制或获得过程" },
      { name: "布局天机", prompt: "在{{selected_text}}中埋下修仙劫数的伏笔" },
      { name: "完善人物", prompt: "基于人物性格：{{characters}}\n关系：{{relationships}}\n深化{{selected_text}}中人物的心境变化" },
      { name: "强化感情", prompt: "在{{selected_text}}中展现修仙路上的情缘牵绊" }
    ]
  },

  // 都市高武
  urbanMartial: {
    name: "都市高武",
    prompts: {
      outline: `作为都市武侠策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作都市高武故事。要求：
1.设定独特的武道体系
2.规划3-5个实力进阶点
3.设计武道与都市双线
4.突出武者间的较量
5.体现主角的武道成长`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.武学技巧展现
2.实力等级划分
3.格斗竞技安排
4.武道资源获取
5.江湖势力交织`,
      content: `【重要】你正在为小说的章节《{{chapterTitle}}》创作正文内容。请确保你生成的内容是针对这个特定章节的，不要生成其他章节的内容。

基于以下信息创作：
- 章节标题： {{chapterTitle}}
- 章节大纲: {{chapterOutline}}
- 背景设定: {{background}}
- 人物设定: {{characters}}
- 关系设定: {{relationships}}
- 像情设定: {{plot}}
- 嚷文内容: {{previousContent}}

写作要求：
1.武学描写要专业
2.打斗场面要精彩
3.武道元素要现代
4.场景要动感震撼
5.节奏要紧张刺激

注意：标题必须是"{{chapterTitle}}"，不要写成其他章节的标题。`
    },
    outlineMenu: [
      { name: "武道突破", prompt: "在{{selected_text}}中加入一场关键的武道突破" },
      { name: "格斗竞技", prompt: "为{{selected_text}}设计一场高水平的武道竞技" },
      { name: "势力冲突", prompt: "在{{selected_text}}中展现武道势力间的较量" },
      { name: "武学传承", prompt: "描写{{selected_text}}中获得武学传承的过程" },
      { name: "生死对决", prompt: "为{{selected_text}}安排一场生死决战" },
      { name: "武道资源", prompt: "在{{selected_text}}中展示武道资源的争夺" },
      { name: "暗劲交锋", prompt: "描写{{selected_text}}中的暗劲较量场景" },
      { name: "武道秘境", prompt: "为{{selected_text}}设计一处武道秘境探索" },
      { name: "武者集会", prompt: "在{{selected_text}}中展现武者间的集会交流" },
      { name: "武道考核", prompt: "描写{{selected_text}}中的武道等级考核" }
    ]
  },

  // 末日系统
  apocalypticSystem: {
    name: "末日系统",
    prompts: {
      outline: `作为末日文策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作末日系统故事。要求：
1.设定独特的末日场景
2.规划3-5个关键生存点
3.设计系统与生存双线
4.突出危机与进化
5.体现主角的成长蜕变`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.系统任务完成
2.生存资源获取
3.危机处理方式
4.进化路线选择
5.团队合作发展`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.末日氛围要真实
2.系统操作要合理
3.生存细节要专业
4.危机处理要智慧
5.节奏要紧张刺激`
    },
    outlineMenu: [
      { name: "系统升级", prompt: "在{{selected_text}}中展现系统新功能开启" },
      { name: "危机降临", prompt: "为{{selected_text}}设计一场末日危机" },
      { name: "资源争夺", prompt: "描写{{selected_text}}中的生存资源争夺" },
      { name: "进化突破", prompt: "在{{selected_text}}中展示能力进化过程" },
      { name: "团队建设", prompt: "为{{selected_text}}增加生存团队的建设" },
      { name: "怪物狩猎", prompt: "在{{selected_text}}中描写狩猎变异生物" },
      { name: "庇护所建设", prompt: "描述{{selected_text}}中的庇护所建设" },
      { name: "势力冲突", prompt: "展现{{selected_text}}中的幸存者势力冲突" },
      { name: "特殊任务", prompt: "设计{{selected_text}}中的系统特殊任务" },
      { name: "末日探索", prompt: "描写{{selected_text}}中的废墟探索历程" }
    ]
  },

  // 玄幻系统修仙
  fantasySystemCultivation: {
    name: "玄幻系统修仙",
    prompts: {
      outline: `作为系统修仙策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作玄幻系统修仙故事。要求：
1.设定独特的系统修炼
2.规划3-5个境界突破点
3.设计系统与修真双线
4.突出玄幻与仙道结合
5.体现主角的修炼成长`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.系统辅助修炼
2.玄幻世界探索
3.修真资源获取
4.势力关系处理
5.修为境界提升`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.系统功能要新颖
2.修炼描写要专业
3.玄幻元素要独特
4.场景要磅礴壮阔
5.节奏要跌宕起伏`
    },
    outlineMenu: [
      { name: "系统突破", prompt: "在{{selected_text}}中展现系统辅助突破" },
      { name: "玄幻历练", prompt: "为{{selected_text}}设计玄幻世界历练" },
      { name: "仙道机缘", prompt: "描写{{selected_text}}中的仙道机缘获得" },
      { name: "法宝炼制", prompt: "在{{selected_text}}中展示系统辅助炼器" },
      { name: "势力建设", prompt: "为{{selected_text}}增加修真势力的建设" },
      { name: "秘境探索", prompt: "在{{selected_text}}中描写玄幻秘境探索" },
      { name: "系统任务", prompt: "设计{{selected_text}}中的特殊系统任务" },
      { name: "天劫应对", prompt: "展现{{selected_text}}中的天劫渡化过程" },
      { name: "玄幻战斗", prompt: "描写{{selected_text}}中的玄幻战斗场景" },
      { name: "道法融合", prompt: "在{{selected_text}}中展示道法系统的融合" }
    ]
  },

  // 霸总
  dominantCEO: {
    name: "霸总",
    prompts: {
      outline: `作为霸总文策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作都市霸总故事。要求：
1.设定强大的商业帝国
2.规划3-5个关键商战
3.设计权势与爱情双线
4.突出豪门恩怨纠葛
5.体现霸道总裁的成长`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.商业布局的关键
2.感情纠葛的推进
3.权力较量的升级
4.家族势力的变化
5.个人成长的体现`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.商战描写要霸气
2.感情描写要强势
3.对话要凸显身份
4.场景要奢华精致
5.节奏要紧凑有力`
    },
    outlineMenu: [
      { name: "商业布局", prompt: "在{{selected_text}}中展现一场惊心动魄的商业收购" },
      { name: "豪门对抗", prompt: "基于背景：{{background}}\n加入{{selected_text}}中的豪门势力较量" },
      { name: "霸道追爱", prompt: "基于角色关系：{{relationships}}\n深化{{selected_text}}中的霸道追求戏码" },
      { name: "家族纷争", prompt: "在{{selected_text}}中制造家族内部的权力争斗" },
      { name: "商战反转", prompt: "为{{selected_text}}设计一个商战局势的逆转" },
      { name: "感情危机", prompt: "在{{selected_text}}中制造感情信任的考验" },
      { name: "权力交锋", prompt: "加强{{selected_text}}中的权力博弈场面" },
      { name: "身世之谜", prompt: "在{{selected_text}}中埋下身世之谜的线索" },
      { name: "复仇布局", prompt: "展现{{selected_text}}中的商业复仇计划" },
      { name: "强化气场", prompt: "深化{{selected_text}}中霸总的强势魅力表现" }
    ]
  },

  // 后悔流
  regretFlow: {
    name: "后悔流",
    prompts: {
      outline: `作为后悔流策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作后悔文故事。要求：
1.设定令人心痛的后悔点
2.规划3-5个关键转折
3.设计愧疚与弥补双线
4.突出情感打动人心
5.体现人物的救赎成长`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.情感创伤的根源
2.愧疚心理的体现
3.挽回行动的展开
4.心理状态的变化
5.救赎之路的探索`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.心理描写要细腻
2.情感冲突要真挚
3.对话要饱含深意
4.场景要催人泪下
5.节奏要缓急得当`
    },
    outlineMenu: [
      { name: "深化后悔", prompt: "在{{selected_text}}中展现更深层的后悔情感" },
      { name: "愧疚折磨", prompt: "描写{{selected_text}}中的内心煎熬" },
      { name: "挽回行动", prompt: "设计{{selected_text}}中的弥补努力" },
      { name: "情感爆发", prompt: "在{{selected_text}}中展现压抑情感的爆发" },
      { name: "心理转变", prompt: "描述{{selected_text}}中的心理变化过程" },
      { name: "记忆闪回", prompt: "在{{selected_text}}中插入关键往事回忆" },
      { name: "救赎时刻", prompt: "设计{{selected_text}}中的救赎关键点" },
      { name: "原谅契机", prompt: "为{{selected_text}}创造和解的可能" },
      { name: "情感修复", prompt: "描写{{selected_text}}中的关系修复过程" },
      { name: "成长蜕变", prompt: "展现{{selected_text}}中的心智成长" }
    ]
  },

  // 无敌文
  invincibleHero: {
    name: "无敌文",
    prompts: {
      outline: `作为无敌文策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作无敌流故事。要求：
1.设定独特的强大体系
2.规划3-5个实力暴涨点
3.设计碾压与成长双线
4.突出主角的无敌姿态
5.体现霸绝天下的气概`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.实力提升方式
2.碾压对手过程
3.底牌释放时机
4.强者之路展现
5.无敌气质塑造`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.战斗描写要震撼
2.实力展现要惊艳
3.对话要霸气十足
4.场景要磅礴大气
5.节奏要快意恩仇`
    },
    outlineMenu: [
      { name: "实力暴涨", prompt: "在{{selected_text}}中展现实力暴涨过程" },
      { name: "强者碾压", prompt: "描写{{selected_text}}中的压倒性战斗" },
      { name: "底牌尽出", prompt: "设计{{selected_text}}中的底牌释放" },
      { name: "势力臣服", prompt: "在{{selected_text}}中展示敌对势力臣服" },
      { name: "境界突破", prompt: "描述{{selected_text}}中的境界突破" },
      { name: "装逼打脸", prompt: "在{{selected_text}}中安排装逼打脸情节" },
      { name: "霸道镇压", prompt: "设计{{selected_text}}中的强势镇压" },
      { name: "威压全场", prompt: "展现{{selected_text}}中的气势碾压" },
      { name: "无敌战斗", prompt: "描写{{selected_text}}中的无敌战斗" },
      { name: "称霸天下", prompt: "为{{selected_text}}设计称霸情节" }
    ]
  },

  // 历史架空
  alternateHistory: {
    name: "历史架空",
    prompts: {
      outline: `作为历史架空策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作架空历史故事。要求：
1.设定合理的历史分歧点
2.规划3-5个历史转折点
3.设计权谋与变革双线
4.突出历史事件改写
5.体现时代变迁特色`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.历史背景还原
2.政治博弈展开
3.军事战略运用
4.民生变革实施
5.历史走向改变`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.历史细节要考究
2.权谋描写要精妙
3.对话要符合时代
4.场景要还原历史
5.节奏要波澜壮阔`
    },
    outlineMenu: [
      { name: "历史转折", prompt: "在{{selected_text}}中设计关键的历史转折点" },
      { name: "权谋博弈", prompt: "展现{{selected_text}}中的朝堂权谋斗争" },
      { name: "军事战略", prompt: "描写{{selected_text}}中的军事战略部署" },
      { name: "变法改革", prompt: "设计{{selected_text}}中的变法改革过程" },
      { name: "民生发展", prompt: "展示{{selected_text}}中的民生发展变化" },
      { name: "外交较量", prompt: "描述{{selected_text}}中的国际外交博弈" },
      { name: "科技革新", prompt: "在{{selected_text}}中加入科技发展线索" },
      { name: "文化演变", prompt: "体现{{selected_text}}中的文化发展变迁" },
      { name: "势力消长", prompt: "描写{{selected_text}}中各方势力的消长" },
      { name: "历史影响", prompt: "展现{{selected_text}}中的蝴蝶效应" }
    ]
  },

  // 都市种田养成
  urbanFarming: {
    name: "都市种田养成",
    prompts: {
      outline: `作为都市种田策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作都市种田故事。要求：
1.设定特色农业体系
2.规划3-5个发展阶段
3.设计种植与经营双线
4.突出田园生活情趣
5.体现产业化发展`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.种植技术运用
2.产业链打造
3.市场运营拓展
4.人际网络建设
5.田园生活展现`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.农业知识要专业
2.经营手法要新颖
3.生活气息要浓厚
4.场景要自然田园
5.节奏要从容惬意`
    },
    outlineMenu: [
      { name: "技术创新", prompt: "在{{selected_text}}中展示农业技术创新" },
      { name: "产业升级", prompt: "描述{{selected_text}}中的产业升级过程" },
      { name: "市场营销", prompt: "设计{{selected_text}}中的市场营销策略" },
      { name: "品牌打造", prompt: "展现{{selected_text}}中的农产品品牌化" },
      { name: "生态建设", prompt: "描写{{selected_text}}中的生态农业建设" },
      { name: "人才培养", prompt: "设计{{selected_text}}中的技术人才培养" },
      { name: "休闲农业", prompt: "展示{{selected_text}}中的观光农业发展" },
      { name: "社区营造", prompt: "描述{{selected_text}}中的乡村社区建设" },
      { name: "资源整合", prompt: "展现{{selected_text}}中的资源整合过程" },
      { name: "产业链条", prompt: "设计{{selected_text}}中的全产业链布局" }
    ]
  },

  // 东方玄幻
  orientalFantasy: {
    name: "东方玄幻",
    prompts: {
      outline: `作为东方玄幻策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作东方玄幻故事。要求：
1.设定独特的修炼体系
2.规划3-5个大境界划分
3.设计问道与争锋双线
4.突出东方文化底蕴
5.体现天道大势变化`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.修炼体系展现
2.东方元素融入
3.势力格局变化
4.天地大道感悟
5.仙凡格局演变`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.玄幻元素要东方
2.战斗场景要磅礴
3.文化底蕴要深厚
4.场景要意境优美
5.节奏要大气恢宏`
    },
    outlineMenu: [
      { name: "问道天地", prompt: "在{{selected_text}}中展现问道求索过程" },
      { name: "神通大战", prompt: "描写{{selected_text}}中的神通法术对决" },
      { name: "势力争锋", prompt: "展示{{selected_text}}中的势力间较量" },
      { name: "仙缘机遇", prompt: "设计{{selected_text}}中的仙缘际遇" },
      { name: "大道感悟", prompt: "描述{{selected_text}}中的大道感悟" },
      { name: "天劫考验", prompt: "展现{{selected_text}}中的天劫历程" },
      { name: "神器炼制", prompt: "描写{{selected_text}}中的神器炼制" },
      { name: "秘境探索", prompt: "设计{{selected_text}}中的秘境探索" },
      { name: "因果轮回", prompt: "展示{{selected_text}}中的因果报应" },
      { name: "天道变化", prompt: "描述{{selected_text}}中的天道演变" }
    ]
  },

  // 策略经营
  strategyManagement: {
    name: "策略经营",
    prompts: {
      outline: `作为策略经营策划，基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、剧情{{plot}}，创作策略经营故事。要求：
1.设定完整商业体系
2.规划3-5个发展阶段
3.设计经营与竞争双线
4.突出策略性决策
5.体现企业化发展`,
      chapter: `基于大纲{{outline}}，将章节《{{chapterTitle}}》细化：
重点规划：
1.经营策略制定
2.资源调配优化
3.市场竞争应对
4.团队建设管理
5.危机处理方案`,
      content: `请为章节《{{chapterTitle}}》创作正文内容。
基于：背景{{background}}、人物{{characters}}、关系{{relationships}}、情节{{plot}}、章节大纲{{chapterOutline}}
要求：
1.经营细节要专业
2.策略运用要精妙
3.决策过程要理性
4.场景要商业化
5.节奏要紧凑有序`
    },
    outlineMenu: [
      { name: "战略规划", prompt: "在{{selected_text}}中展现企业战略规划" },
      { name: "资源整合", prompt: "描述{{selected_text}}中的资源整合优化" },
      { name: "市场扩张", prompt: "设计{{selected_text}}中的市场扩张策略" },
      { name: "团队管理", prompt: "展示{{selected_text}}中的团队管理方案" },
      { name: "危机处理", prompt: "描写{{selected_text}}中的危机应对过程" },
      { name: "产品创新", prompt: "展现{{selected_text}}中的产品研发创新" },
      { name: "品牌建设", prompt: "设计{{selected_text}}中的品牌塑造过程" },
      { name: "资本运作", prompt: "描述{{selected_text}}中的资本运作手段" },
      { name: "并购重组", prompt: "展示{{selected_text}}中的并购重组计划" },
      { name: "商业模式", prompt: "设计{{selected_text}}中的商业模式创新" }
    ]
  }
}

// ============================================
// 通用右键菜单配置 - 章节和正文优化
// ============================================

export const CHAPTER_MENU = [
  { name: "章节评分", prompt: "请对以下章节大纲进行评分（1-10分），并给出改进建议：\n{{selected_text}}" },
  { name: "深化情节", prompt: "基于整体故事：{{outline}}\n深化以下章节的情节发展：{{selected_text}}" },
  { name: "强化冲突", prompt: "在以下章节中制造更强的矛盾冲突：{{selected_text}}" },
  { name: "优化结构", prompt: "重新调整以下章节的结构，使其更合理：{{selected_text}}" },
  { name: "增加细节", prompt: "为以下章节补充更多细节：{{selected_text}}" },
  { name: "完善对话", prompt: "基于人物性格：{{characters}}\n优化以下章节中的对话设计：{{selected_text}}" },
  { name: "设置伏笔", prompt: "为后续剧情发展，在以下章节中设置伏笔：{{selected_text}}" },
  { name: "强化感情", prompt: "基于角色关系：{{relationships}}\n加强以下章节的感情线发展：{{selected_text}}" }
]

export const CONTENT_MENU = [
  { name: "文字评分", prompt: "请对以下正文进行评分（1-10分），评分标准：文笔、情节、人物、吸引力：\n{{selected_text}}" },
  { name: "优化文笔", prompt: "请润色以下正文，提升文笔质量：\n{{selected_text}}" },
  { name: "扩写对话", prompt: "基于人物性格：{{characters}}\n扩写以下正文中的对话：{{selected_text}}" },
  { name: "强化情感", prompt: "加强以下正文中的情感表达：{{selected_text}}" },
  { name: "添加细节", prompt: "为以下正文添加更多感官描写（视觉、听觉、触觉）：{{selected_text}}" },
  { name: "改写视角", prompt: "请从另一人物视角改写以下正文：{{selected_text}}" },
  { name: "去除说教", prompt: "去除以下正文中的说教成分，使叙事更自然：{{selected_text}}" },
  { name: "润色升华", prompt: "对以下正文进行润色升华，提升文学性：{{selected_text}}" }
]

// ============================================
// 基础提示词模板（保留原有功能）
// ============================================

export const PROMPT_TEMPLATES = {
  // 生成项目建议（题材+长度 -> 标题+简介）
  generateProjectSuggestions: `作为专业的网络小说策划，请根据以下条件生成3-5个小说项目建议：

题材类型：{{genre}}
小说长度：{{novelLength}}（{{wordCount}}）
预估章节：{{chapterRange}}

请为每个建议提供：
1. 书名（3-6个字，有吸引力）
2. 简介（100-200字，突出故事亮点）

要求：
1. 书名要符合题材风格，让人一看就想读
2. 简要描述故事背景、主角设定、核心冲突
3. 根据小说长度调整故事规模：
   - 微小说：一个完整的小故事
   - 短篇小说：紧凑的完整故事
   - 中篇小说：有起承转合的中等规模故事
   - 长篇小说：宏大的世界观和复杂的人物关系

输出格式示例：
1. 书名：XXXXX
简介：XXXXXX

2. 书名：XXXXX
简介：XXXXXX`,

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

  // 生成大纲（通用版本）
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

书名：{{title}}
简介：{{description}}
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

// ============================================
// 变量替换系统
// ============================================

export interface PromptVariables {
  background?: string
  characters?: string
  relationships?: string
  plot?: string
  style?: string
  outline?: string
  chapterOutline?: string
  chapterTitle?: string
  world?: string
  previousContent?: string
  selectedText?: string
  description?: string
  novelLength?: string
  [key: string]: string | number | undefined
}

// 替换提示词变量
export function replaceVariables(
  template: string,
  variables: PromptVariables
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value))
    }
  }
  return result
}

// ============================================
// 题材相关生成函数
// ============================================

// 获取题材配置
export function getGenreConfig(genre: string): GenreConfig | undefined {
  return GENRE_CONFIGS[genre]
}

// 获取所有题材列表
export function getAllGenres(): Array<{ value: string; label: string }> {
  return Object.entries(GENRE_CONFIGS).map(([key, config]) => ({
    value: key,
    label: config.name
  }))
}

// 根据题材生成大纲
export async function generateGenreOutline(params: {
  genre: string
  background: string
  characters: string
  relationships: string
  plot: string
}): Promise<string> {
  const config = getGenreConfig(params.genre)
  const template = config?.prompts.outline || PROMPT_TEMPLATES.generateOutline

  const prompt = replaceVariables(template, {
    background: params.background,
    characters: params.characters,
    relationships: params.relationships,
    plot: params.plot,
    style: config?.name || "通用",
    genre: config?.name || "通用"
  })

  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 3000,
  })
}

// 根据题材生成章节大纲
export async function generateGenreChapterOutline(params: {
  genre: string
  outline: string
  chapterTitle?: string
}): Promise<string> {
  const config = getGenreConfig(params.genre)
  const template = config?.prompts.chapter || PROMPT_TEMPLATES.generateChapterOutline

  const prompt = replaceVariables(template, {
    outline: params.outline,
    chapterTitle: params.chapterTitle || ""
  })

  return generateText({
    prompt,
    temperature: 0.8,
    maxTokens: 2000,
  })
}

// 根据题材生成章节内容
export async function generateGenreChapterContent(params: {
  genre: string
  chapterTitle: string
  chapterOutline?: string
  characters?: string
  world?: string
  projectTitle?: string
  projectDescription?: string
  novelLength?: string
  background?: string
  relationships?: string
  plot?: string
  previousContent?: string
}): Promise<string> {
  const config = getGenreConfig(params.genre)
  const template = config?.prompts.content || PROMPT_TEMPLATES.generateChapterContent

  console.log("[DeepSeek] generateGenreChapterContent called:", {
    genre: params.genre,
    chapterTitle: params.chapterTitle,
    hasConfig: !!config,
    templateLength: template.length,
  })

  let prompt = replaceVariables(template, {
    chapterTitle: params.chapterTitle,
    chapterOutline: params.chapterOutline || "",
    characters: params.characters || "",
    world: params.world || "",
    background: params.background || "",
    relationships: params.relationships || "",
    plot: params.plot || "",
    previousContent: params.previousContent || "",
    title: params.projectTitle || "",
    description: params.projectDescription || "",
    novelLength: params.novelLength || "medium"
  })

  // 添加额外的章节标题强调，确保 AI 生成正确章节的内容
  const chapterTitle = params.chapterTitle || "未命名章节"

  // 确保章节标题格式正确【第X章 XXXX】
  const titleFormatGuidance = `
【章节标题格式要求】
- 正文第一行必须是章节标题，格式为：# ${chapterTitle}
- 如果章节标题不包含【第X章】，请自动添加，例如：# 【第X章 章节名称】
- 标题要简洁有力，能概括本章内容
`

  prompt = `【关键要求】你现在正在为小说的"${chapterTitle}"创作正文内容。
请务必确保：
1. 你生成的内容是针对"${chapterTitle}"这个特定章节的
2. 正文第一行必须是 Markdown 格式的标题：# ${chapterTitle}
3. 如果标题格式不是【第X章 XXXX】，请调整为这种格式
4. 内容要符合这个章节的剧情发展
${titleFormatGuidance}
---

${prompt}`

  console.log("[DeepSeek] Prompt length:", prompt.length)
  console.log("[DeepSeek] Chapter title being generated:", chapterTitle)

  return generateText({
    prompt,
    temperature: 0.85,
    maxTokens: 4000,
  })
}

// ============================================
// 保留原有函数（向后兼容）
// ============================================

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
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.generateChapterContent, params)

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
export async function generateChapterOutlineTitles(params: {
  outline?: string
  prompt?: string
  count?: number
  title?: string
  description?: string
  novelLength?: string
}): Promise<string> {
  const prompt = replaceVariables(PROMPT_TEMPLATES.batchChapterTitles, {
    title: params.title || "未命名小说",
    description: params.description || "",
    outline: params.outline || "暂无大纲",
    theme: "",
    prompt: params.prompt || "",
    count: params.count || 5,
    novelLength: params.novelLength || "medium",
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
  projectTitle?: string
  projectDescription?: string
  novelLength?: string
}): Promise<string> {
  // 章节标题格式指导
  const titleFormatGuidance = `
【章节标题格式要求】
- 正文第一行必须是 Markdown 格式的标题
- 标题格式应为：# ${params.chapterTitle}
- 如果标题不包含【第X章】，请自动添加，例如：# 【第X章 章节名称】
- 标题要简洁有力，能概括本章内容
`

  const enhancedPrompt = `${titleFormatGuidance}

---

`

  const prompt = replaceVariables(PROMPT_TEMPLATES.generateChapterContent, {
    chapterTitle: params.chapterTitle,
    chapterOutline: params.chapterOutline || "",
    characters: params.characters || "",
    world: params.world || "",
    previousContent: params.previousContent || "",
    title: params.projectTitle || "",
    description: params.projectDescription || "",
    novelLength: params.novelLength || "medium",
  })

  return generateText({
    prompt: enhancedPrompt + prompt,
    temperature: 0.85,
    maxTokens: 4000,
  })
}

// ============================================
// 右键菜单优化函数
// ============================================

// 获取大纲优化菜单
export function getOutlineMenu(genre: string): Array<{ name: string; prompt: string }> {
  const config = getGenreConfig(genre)
  return config?.outlineMenu || CHAPTER_MENU
}

// 获取章节优化菜单
export function getChapterMenu(genre?: string): Array<{ name: string; prompt: string }> {
  const config = genre ? getGenreConfig(genre) : null
  return config?.chapterMenu || CHAPTER_MENU
}

// 获取正文优化菜单
export function getContentMenu(genre?: string): Array<{ name: string; prompt: string }> {
  const config = genre ? getGenreConfig(genre) : null
  return config?.contentMenu || CONTENT_MENU
}

// 执行右键菜单优化
export async function executeMenuOptimize(params: {
  menuType: "outline" | "chapter" | "content"
  actionName: string
  selectedText: string
  genre?: string
  context?: PromptVariables
}): Promise<string> {
  const { menuType, actionName, selectedText, genre, context = {} } = params

  let menu: Array<{ name: string; prompt: string }>
  switch (menuType) {
    case "outline":
      menu = getOutlineMenu(genre || "")
      break
    case "chapter":
      menu = getChapterMenu(genre)
      break
    case "content":
      menu = getContentMenu(genre)
      break
  }

  const menuItem = menu.find(item => item.name === actionName)
  if (!menuItem) {
    throw new Error(`未找到优化动作: ${actionName}`)
  }

  const prompt = replaceVariables(menuItem.prompt, {
    ...context,
    selected_text: selectedText,
    selectedText: selectedText
  })

  return generateText({
    prompt,
    temperature: 0.7,
    maxTokens: 4000,
  })
}

// ============================================
// 项目建议生成
// ============================================

// 小说长度配置
export const NOVEL_LENGTH_CONFIG: Record<string, {
  label: string
  wordCount: string
  chapterRange: string
}> = {
  micro: { label: "微小说", wordCount: "100-500字", chapterRange: "1章" },
  short: { label: "短篇小说", wordCount: "500-20000字", chapterRange: "1-5章" },
  medium: { label: "中篇小说", wordCount: "2-10万字", chapterRange: "10-30章" },
  long: { label: "长篇小说", wordCount: "10万字以上", chapterRange: "50章以上" },
}

// 生成项目建议
export async function generateProjectSuggestions(params: {
  genre: string
  novelLength: string
}): Promise<string> {
  const genreConfig = getGenreConfig(params.genre)
  const lengthConfig = NOVEL_LENGTH_CONFIG[params.novelLength] || NOVEL_LENGTH_CONFIG.medium

  const prompt = replaceVariables(PROMPT_TEMPLATES.generateProjectSuggestions, {
    genre: genreConfig?.name || params.genre,
    novelLength: lengthConfig.label,
    wordCount: lengthConfig.wordCount,
    chapterRange: lengthConfig.chapterRange,
  })

  return generateText({
    prompt,
    temperature: 0.9,
    maxTokens: 2000,
  })
}

// ============================================
// 完结检测分析
// ============================================

// 完结分析结果接口
export interface CompletionAnalysis {
  isCompletable: boolean      // 是否可以完结
  completionScore: number     // 完结度评分 0-100
  analysis: {
    wordCountStatus: string   // 字数状态描述
    chapterStatus: string     // 章节状态描述
    storyEnding: string       // 故事结局分析
    suggestions: string[]     // 建议
  }
  lastChapterSignals: {
    hasEndingKeywords: boolean  // 是否有结局关键词
    hasEpilogue: boolean        // 是否有尾声/后记
    conflictResolved: boolean   // 主要冲突是否解决
  }
}

// 分析小说是否达到完结条件
export async function analyzeCompletion(params: {
  title: string
  description?: string | null
  genre?: string | null
  novelLength?: string | null
  currentWordCount: number
  currentChapterCount: number
  lastChapterTitle?: string
  lastChapterContent?: string
  targetWords?: number | null
  targetChapters?: number | null
}): Promise<CompletionAnalysis> {
  const lengthConfig = NOVEL_LENGTH_CONFIG[params.novelLength || "medium"]

  // 解析目标字数范围
  const parseWordCountRange = (range: string) => {
    // 检查是否包含"万"字来决定是否需要乘以10000
    const hasWanUnit = range.includes("万")

    const match = range.match(/(\d+)-(\d+)/)
    if (match) {
      const multiplier = hasWanUnit ? 10000 : 1
      return { min: parseInt(match[1]) * multiplier, max: parseInt(match[2]) * multiplier }
    }
    if (range.includes("以上")) {
      const minMatch = range.match(/(\d+)/)
      const multiplier = hasWanUnit ? 10000 : 1
      return { min: minMatch ? parseInt(minMatch[1]) * multiplier : 100000, max: Infinity }
    }
    return { min: 0, max: Infinity }
  }

  // 解析章节范围
  const parseChapterRange = (range: string) => {
    const match = range.match(/(\d+)-(\d+)/)
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) }
    }
    const singleMatch = range.match(/(\d+)/)
    if (singleMatch) {
      return { min: parseInt(singleMatch[1]), max: parseInt(singleMatch[1]) }
    }
    return { min: 1, max: 1000 }
  }

  const wordRange = parseWordCountRange(lengthConfig.wordCount)
  const chapterRange = parseChapterRange(lengthConfig.chapterRange)

  // 使用用户设定的目标或默认范围
  const targetMinWords = params.targetWords || wordRange.min
  const targetMaxWords = params.targetWords ? params.targetWords : wordRange.max
  const targetMinChapters = params.targetChapters || chapterRange.min
  const targetMaxChapters = params.targetChapters ? params.targetChapters : chapterRange.max

  // 计算进度
  const wordProgress = Math.min(100, (params.currentWordCount / targetMinWords) * 100)
  const chapterProgress = Math.min(100, (params.currentChapterCount / targetMinChapters) * 100)

  // 分析最后一章的结局信号
  let lastChapterSignals = {
    hasEndingKeywords: false,
    hasEpilogue: false,
    conflictResolved: false,
  }

  let storyEndingAnalysis = ""
  let hasStrongEnding = false // 提升到外部作用域

  if (params.lastChapterContent) {
    // 检测结局关键词
    const endingKeywords = ["大结局", "完结", "终章", "落幕", "尾声", "后记", "全书完", "剧终", "结束"]
    lastChapterSignals.hasEndingKeywords = endingKeywords.some(kw =>
      params.lastChapterContent!.includes(kw) || params.lastChapterTitle?.includes(kw)
    )

    // 检测尾声/后记
    const epilogueKeywords = ["尾声", "后记", "番外", "结局"]
    lastChapterSignals.hasEpilogue = epilogueKeywords.some(kw =>
      params.lastChapterContent!.includes(kw) || params.lastChapterTitle?.includes(kw)
    )

    // 【新增】强结局关键词检测 - 如果检测到这些关键词，直接判定为冲突已解决
    const strongEndingKeywords = ["大结局", "全书完", "剧终", "终章", "完结篇", "落幕"]
    hasStrongEnding = strongEndingKeywords.some(kw =>
      params.lastChapterContent!.includes(kw) || params.lastChapterTitle?.includes(kw)
    )

    if (hasStrongEnding) {
      // 有强结局关键词，直接标记为完结，跳过AI分析
      lastChapterSignals.conflictResolved = true
      lastChapterSignals.hasEndingKeywords = true
      storyEndingAnalysis = "检测到明确的完结标识（大结局/全书完等），故事已完结"
      console.log("[Completion Analysis] Strong ending keywords detected, marking as completed")
    } else {
      // 只有在没有强结局关键词时才调用 AI 分析
      const analysisPrompt = `你是一位专业的小说编辑，请分析以下小说最后一章的内容，判断故事是否已经完结。

小说标题：${params.title}
小说简介：${params.description || "无"}
小说类型：${params.genre || "通用"}

最后一章标题：${params.lastChapterTitle || "未知"}
最后一章内容摘要（前2000字）：
${params.lastChapterContent.slice(0, 2000)}

请分析：
1. 这一章是否有结局感？（主要冲突是否解决、人物命运是否明确）
2. 是否有明显的完结信号？（大结局、尾声等关键词）
3. 故事是否适合在此结束？

请用JSON格式回答，格式如下：
{
  "conflictResolved": true/false,
  "hasEndingFeel": true/false,
  "analysis": "简短分析（50字以内）"
}

只返回JSON，不要其他内容。`

      try {
        const aiResponse = await generateText({
          prompt: analysisPrompt,
          temperature: 0.3,
          maxTokens: 200,
        })

        // 解析AI响应
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])
          lastChapterSignals.conflictResolved = analysis.conflictResolved === true
          storyEndingAnalysis = analysis.analysis || ""
        }
      } catch (error) {
        console.error("[Completion Analysis] AI analysis failed:", error)
        storyEndingAnalysis = "AI分析失败，请手动检查"
      }
    }
  }

  // 生成状态描述
  const targetWordsDisplay = targetMaxWords < Infinity
    ? `${targetMinWords.toLocaleString()}-${targetMaxWords.toLocaleString()}字`
    : `${targetMinWords.toLocaleString()}字以上`

  const targetChaptersDisplay = targetMaxChapters < Infinity
    ? `${targetMinChapters}-${targetMaxChapters}章`
    : `${targetMinChapters}章以上`

  const wordCountStatus = params.currentWordCount >= targetMinWords
    ? `✓ 字数达标（${params.currentWordCount.toLocaleString()}字，目标${targetWordsDisplay}）`
    : `○ 字数不足（${params.currentWordCount.toLocaleString()}字，目标${targetWordsDisplay}，还需${(targetMinWords - params.currentWordCount).toLocaleString()}字）`

  const chapterStatus = params.currentChapterCount >= targetMinChapters
    ? `✓ 章节达标（${params.currentChapterCount}章，目标${targetChaptersDisplay}）`
    : `○ 章节不足（${params.currentChapterCount}章，目标${targetChaptersDisplay}，还需${targetMinChapters - params.currentChapterCount}章）`

  // 计算完结度评分
  let completionScore = 0
  completionScore += Math.min(30, wordProgress * 0.3)  // 字数占30分
  completionScore += Math.min(30, chapterProgress * 0.3) // 章节占30分
  if (lastChapterSignals.hasEndingKeywords) completionScore += 20
  if (lastChapterSignals.hasEpilogue) completionScore += 10
  if (lastChapterSignals.conflictResolved) completionScore += 10

  completionScore = Math.round(completionScore)

  // 判断是否可以完结（先计算，用于决定建议内容）
  const isCompletable =
    params.currentWordCount >= targetMinWords * 0.8 && // 字数达到目标的80%
    params.currentChapterCount >= targetMinChapters * 0.8 && // 章节达到目标的80%
    (lastChapterSignals.hasEndingKeywords || lastChapterSignals.hasEpilogue || lastChapterSignals.conflictResolved)

  // 生成建议（如果已可完结，不再添加"建议继续创作"的建议）
  const suggestions: string[] = []

  if (isCompletable) {
    // 已达到完结条件，只给出优化建议（非强制）
    if (params.currentWordCount < targetMinWords) {
      suggestions.push(`字数略低于目标（当前${params.currentWordCount.toLocaleString()}字，目标${targetMinWords.toLocaleString()}字），但已可完结`)
    }
    if (params.currentChapterCount < targetMinChapters) {
      suggestions.push(`章节数略低于目标（当前${params.currentChapterCount}章，目标${targetMinChapters}章），但已可完结`)
    }
    // 如果没有任何优化建议，显示完结确认
    if (suggestions.length === 0) {
      suggestions.push("小说已达到完结条件，可以进行人工审核后标记为完结")
    } else {
      // 有优化建议时，在最后添加完结确认
      suggestions.push("✓ 已满足完结条件，可以随时标记完结")
    }
  } else {
    // 未达到完结条件，给出必须完成的建议
    if (params.currentWordCount < targetMinWords * 0.8) {
      suggestions.push(`字数不足，建议继续创作，增加约${(targetMinWords - params.currentWordCount).toLocaleString()}字`)
    } else if (params.currentWordCount < targetMinWords) {
      suggestions.push(`字数接近目标（还需${(targetMinWords - params.currentWordCount).toLocaleString()}字），继续创作或可完结`)
    }

    if (params.currentChapterCount < targetMinChapters * 0.8) {
      suggestions.push(`章节不足，建议增加${targetMinChapters - params.currentChapterCount}个章节`)
    } else if (params.currentChapterCount < targetMinChapters) {
      suggestions.push(`章节数接近目标（还需${targetMinChapters - params.currentChapterCount}章），继续创作或可完结`)
    }

    if (!lastChapterSignals.hasEndingKeywords && !lastChapterSignals.hasEpilogue) {
      suggestions.push("最后一章未检测到结局关键词，建议添加'大结局'或'尾声'等标识")
    }
    if (!lastChapterSignals.conflictResolved && params.lastChapterContent && !hasStrongEnding) {
      suggestions.push("AI分析显示主要冲突尚未完全解决，建议完善结局")
    }
  }

  return {
    isCompletable: isCompletable,
    completionScore,
    analysis: {
      wordCountStatus,
      chapterStatus,
      storyEnding: storyEndingAnalysis || (params.lastChapterContent ? "已分析" : "暂无章节内容"),
      suggestions,
    },
    lastChapterSignals,
  }
}
