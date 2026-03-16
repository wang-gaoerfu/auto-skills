/**
 * 剧本导出工具
 */

import { prisma } from "@/lib/prisma"

// ============================================
// 类型定义
// ============================================

export type ExportFormat = "json" | "md" | "pdf" | "excel"

export interface ExportData {
  project: {
    id: string
    title: string
    description: string | null
    sourceNovelTitle: string | null
    genre: string | null
    totalScenes: number
    totalShots: number
    totalDuration: number
    createdAt: Date
  }
  characters: Array<{
    name: string
    role: string | null
    gender: string | null
    ageRange: string | null
    appearance: any
    personality: string | null
  }>
  scenes: Array<{
    sceneNumber: number
    title: string
    location: string | null
    timeOfDay: string | null
    mood: string | null
    description: string | null
    shots: Array<{
      shotNumber: string
      shotType: string
      angle: string | null
      duration: number
      visual: any
      audio: any
    }>
  }>
  metadata: {
    exportedAt: Date
    exporter: string
  }
}

// ============================================
// 导出函数
// ============================================

/**
 * 获取完整的导出数据
 */
export async function getExportData(projectId: string): Promise<ExportData | null> {
  const project = await prisma.scriptProject.findFirst({
    where: { id: projectId },
    include: {
      characters: {
        orderBy: { createdAt: "asc" },
      },
      scenes: {
        orderBy: { sceneNumber: "asc" },
        include: {
          shots: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!project) {
    return null
  }

  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      sourceNovelTitle: project.sourceNovelTitle,
      genre: project.genre,
      totalScenes: project.totalScenes,
      totalShots: project.totalShots,
      totalDuration: project.totalDuration,
      createdAt: project.createdAt,
    },
    characters: project.characters.map((c) => ({
      name: c.name,
      role: c.role,
      gender: c.gender,
      ageRange: c.ageRange,
      appearance: c.appearance,
      personality: c.personality,
    })),
    scenes: project.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      title: s.title,
      location: s.location,
      timeOfDay: s.timeOfDay,
      mood: s.mood,
      description: s.description,
      shots: s.shots.map((shot) => ({
        shotNumber: shot.shotNumber,
        shotType: shot.shotType,
        angle: shot.angle,
        duration: shot.duration,
        visual: shot.visual,
        audio: shot.audio,
      })),
    })),
    metadata: {
      exportedAt: new Date(),
      exporter: "AI Novel Writer",
    },
  }
}

/**
 * 导出为 JSON
 */
export function exportAsJSON(data: ExportData, addWatermark?: boolean): string {
  const result = { ...data }

  if (addWatermark) {
    result.project.title = result.project.title + " [试用版]"
  }

  return JSON.stringify(result, null, 2)
}

/**
 * 导出为 Markdown
 */
export function exportAsMarkdown(data: ExportData, addWatermark?: boolean): string {
  let md = ""

  // 标题
  md = md + "# " + data.project.title + "\n\n"
  if (addWatermark) {
    md = md + "> **[试用版]** - 请升级会员以移除水印\n\n"
  }

  // 项目信息
  md = md + "## 项目信息\n\n"
  md = md + "- **来源小说**：" + (data.project.sourceNovelTitle || "原创") + "\n"
  md = md + "- **类型**：" + (data.project.genre || "未分类") + "\n"
  md = md + "- **场景数**：" + data.project.totalScenes + "\n"
  md = md + "- **镜头数**：" + data.project.totalShots + "\n"
  md = md + "- **总时长**：" + formatDuration(data.project.totalDuration) + "\n"
  md = md + "- **导出时间**：" + data.metadata.exportedAt.toLocaleString("zh-CN") + "\n\n"

  // 角色列表
  if (data.characters.length > 0) {
    md = md + "## 角色列表\n\n"
    for (const char of data.characters) {
      md = md + "### " + char.name + "\n"
      if (char.role) md = md + "- **角色**：" + char.role + "\n"
      if (char.gender) md = md + "- **性别**：" + char.gender + "\n"
      if (char.ageRange) md = md + "- **年龄**：" + char.ageRange + "\n"
      if (char.personality) md = md + "- **性格**：" + char.personality + "\n"
      md = md + "\n"
    }
  }

  // 场景和镜头
  md = md + "## 分镜脚本\n\n"

  for (const scene of data.scenes) {
    md = md + "### 场景 " + scene.sceneNumber + "：" + scene.title + "\n\n"

    if (scene.location) md = md + "**地点**：" + scene.location + " | "
    if (scene.timeOfDay) md = md + "**时间**：" + scene.timeOfDay + " | "
    if (scene.mood) md = md + "**氛围**：" + scene.mood
    md = md + "\n\n"

    if (scene.description) {
      md = md + scene.description + "\n\n"
    }

    if (scene.shots.length === 0) {
      md = md + "*暂无镜头*\n\n"
      continue
    }

    for (const shot of scene.shots) {
      md = md + "#### " + shot.shotNumber + " | " + shot.shotType
      if (shot.angle) md = md + " | " + shot.angle
      md = md + " | " + shot.duration + "s\n\n"

      if (shot.visual && shot.visual.description) {
        md = md + "**画面**：" + shot.visual.description + "\n\n"
      }

      if (shot.audio && shot.audio.action) {
        md = md + "**动作**：" + shot.audio.action + "\n\n"
      }

      if (shot.audio && shot.audio.dialogue) {
        md = md + '**对话**："' + shot.audio.dialogue + '"\n\n'
      }
    }

    md = md + "---\n\n"
  }

  return md
}

/**
 * 导出为 Excel（CSV 格式）
 */
export function exportAsExcel(data: ExportData, addWatermark?: boolean): string {
  const rows: string[] = []

  // 项目信息
  rows.push("剧本信息")
  rows.push('"标题","' + data.project.title + '"')
  if (addWatermark) {
    rows.push('"版本","试用版"')
  }
  rows.push('"场景数","' + data.project.totalScenes + '"')
  rows.push('"镜头数","' + data.project.totalShots + '"')
  rows.push('"总时长(秒)","' + data.project.totalDuration + '"')
  rows.push('"导出时间","' + data.metadata.exportedAt.toLocaleString("zh-CN") + '"')
  rows.push("")

  // 镜头列表
  rows.push("镜头列表")
  rows.push('"场景","镜头编号","类型","运动","时长","画面描述","动作","对话"')

  for (const scene of data.scenes) {
    for (const shot of scene.shots) {
      const visualDesc = shot.visual && shot.visual.description ? shot.visual.description.replace(/"/g, '""') : ""
      const audioAction = shot.audio && shot.audio.action ? shot.audio.action.replace(/"/g, '""') : ""
      const audioDialogue = shot.audio && shot.audio.dialogue ? shot.audio.dialogue.replace(/"/g, '""') : ""
      const angle = shot.angle ? shot.angle.replace(/"/g, '""') : ""

      rows.push(
        '"' + scene.sceneNumber + '",' +
        '"' + shot.shotNumber + '",' +
        '"' + shot.shotType + '",' +
        '"' + angle + '",' +
        '"' + shot.duration + '",' +
        '"' + visualDesc + '",' +
        '"' + audioAction + '",' +
        '"' + audioDialogue + '"'
      )
    }
  }

  return rows.join("\n")
}

/**
 * 导出为 PDF（返回 HTML，需前端转换为 PDF）
 */
export function exportAsPDF(data: ExportData, addWatermark?: boolean): string {
  let html = "<!DOCTYPE html>\n"
  html = html + '<html lang="zh-CN">\n'
  html = html + "<head>\n"
  html = html + '  <meta charset="UTF-8">\n'
  html = html + "  <style>\n"
  html = html + "    body { font-family: \"Microsoft YaHei\", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }\n"
  html = html + "    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }\n"
  html = html + "    h2 { margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }\n"
  html = html + "    h3 { margin-top: 20px; }\n"
  html = html + "    .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }\n"
  html = html + "    .shot { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }\n"
  html = html + "    .shot-header { font-weight: bold; color: #0066cc; }\n"
  if (addWatermark) {
    html = html + "    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); pointer-events: none; white-space: nowrap; }\n"
  }
  html = html + "    table { width: 100%; border-collapse: collapse; }\n"
  html = html + "    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n"
  html = html + "    th { background: #f0f0f0; }\n"
  html = html + "  </style>\n"
  html = html + "</head>\n"
  html = html + "<body>\n"

  // 水印
  if (addWatermark) {
    html = html + '<div class="watermark">试用版</div>\n'
  }

  // 标题
  html = html + "<h1>" + data.project.title + "</h1>\n"

  // 项目信息
  html = html + "<div class=\"info\">\n"
  html = html + '  <p><strong>来源小说</strong>：' + (data.project.sourceNovelTitle || "原创") + "</p>\n"
  html = html + '  <p><strong>类型</strong>：' + (data.project.genre || "未分类") + "</p>\n"
  html = html + '  <p><strong>场景数</strong>：' + data.project.totalScenes + "</p>\n"
  html = html + '  <p><strong>镜头数</strong>：' + data.project.totalShots + "</p>\n"
  html = html + '  <p><strong>总时长</strong>：' + formatDuration(data.project.totalDuration) + "</p>\n"
  html = html + '  <p><strong>导出时间</strong>：' + data.metadata.exportedAt.toLocaleString("zh-CN") + "</p>\n"
  html = html + "</div>\n"

  // 角色列表
  if (data.characters.length > 0) {
    html = html + "<h2>角色列表</h2>\n"
    html = html + "<table>\n"
    html = html + "  <tr><th>姓名</th><th>角色</th><th>性别</th><th>年龄</th><th>性格</th></tr>\n"
    for (const char of data.characters) {
      html = html + "  <tr>\n"
      html = html + "    <td>" + char.name + "</td>\n"
      html = html + "    <td>" + (char.role || "") + "</td>\n"
      html = html + "    <td>" + (char.gender || "") + "</td>\n"
      html = html + "    <td>" + (char.ageRange || "") + "</td>\n"
      html = html + "    <td>" + (char.personality || "") + "</td>\n"
      html = html + "  </tr>\n"
    }
    html = html + "</table>\n"
  }

  // 场景和镜头
  html = html + "<h2>分镜脚本</h2>\n"

  for (const scene of data.scenes) {
    html = html + "<h3>场景 " + scene.sceneNumber + "：" + scene.title + "</h3>\n"
    html = html + "<p><strong>地点</strong>：" + (scene.location || "未设置") + " | "
    html = html + "<strong>时间</strong>：" + (scene.timeOfDay || "未设置") + " | "
    html = html + "<strong>氛围</strong>：" + (scene.mood || "未设置") + "</p>\n"

    if (scene.description) {
      html = html + "<p>" + scene.description + "</p>\n"
    }

    if (scene.shots.length === 0) {
      html = html + "<p><em>暂无镜头</em></p>\n"
      continue
    }

    for (const shot of scene.shots) {
      html = html + "<div class=\"shot\">\n"
      html = html + "  <div class=\"shot-header\">" + shot.shotNumber + " | " + shot.shotType
      if (shot.angle) html = html + " | " + shot.angle
      html = html + " | " + shot.duration + "秒</div>\n"

      if (shot.visual && shot.visual.description) {
        html = html + "  <p><strong>画面</strong>：" + shot.visual.description + "</p>\n"
      }

      if (shot.audio && shot.audio.action) {
        html = html + "  <p><strong>动作</strong>：" + shot.audio.action + "</p>\n"
      }

      if (shot.audio && shot.audio.dialogue) {
        html = html + '  <p><strong>对话</strong>："' + shot.audio.dialogue + '"</p>\n'
      }

      html = html + "</div>\n"
    }
  }

  html = html + "</body>\n"
  html = html + "</html>\n"

  return html
}

// ============================================
// 辅助函数
// ============================================

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return minutes + "分" + secs + "秒"
  }
  return secs + "秒"
}

/**
 * 检查导出格式是否被允许
 */
export async function checkExportPermission(
  userId: string,
  format: ExportFormat
): Promise<{ allowed: boolean; reason?: string }> {
  // 这里需要检查用户的会员等级是否支持该格式
  // 暂时都允许，后续在会员系统中实现
  return { allowed: true }
}

/**
 * 检查是否需要添加水印
 */
export async function needsWatermark(userId: string): Promise<boolean> {
  // 这里需要检查用户的会员等级
  // 暂时返回 false，后续在会员系统中实现
  return false
}
