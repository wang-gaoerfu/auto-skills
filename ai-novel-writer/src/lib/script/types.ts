/**
 * 剧本系统类型定义
 */

// ============================================
// 项目状态
// ============================================

/** 剧本项目状态 */
export type ScriptProjectStatus =
  | 'draft'       // 草稿
  | 'preparing'   // 准备中（导入内容处理中）
  | 'generating'  // 生成中
  | 'paused'      // 已暂停
  | 'completed'   // 已完成
  | 'error'       // 错误
  | 'retrying'    // 重试中

/** 剧本项目子状态 */
export type ScriptProjectSubStatus =
  | 'chapter_splitting'     // 章节拆分中
  | 'character_extracting'  // 角色提取中
  | 'scene_extracting'      // 场景提取中
  | 'storyboard_generating' // 分镜生成中
  | 'finalizing'            // 最终处理中

/** 镜头状态 */
export type ScriptShotStatus =
  | 'draft'        // 草稿
  | 'generated'    // 已生成
  | 'regenerating' // 重新生成中
  | 'failed'       // 失败

/** 生成任务状态 */
export type ScriptGenerationTaskStatus =
  | 'pending'    // 待处理
  | 'processing' // 处理中
  | 'completed'  // 已完成
  | 'failed'     // 失败
  | 'cancelled'  // 已取消

// ============================================
// 内容来源
// ============================================

/** 来源类型 */
export type SourceType =
  | 'OWN_PROJECT' // 自有小说项目
  | 'EXTERNAL'    // 外部来源（TXT上传/粘贴）
  | 'ORIGINAL'    // 原创创作

// ============================================
// 会员相关
// ============================================

/** 剧本会员等级 */
export type ScriptMembershipPlan =
  | 'FREE'   // 免费版
  | 'ENTRY'  // 入门版
  | 'VIP'    // VIP
  | 'PRO'    // PRO

/** 剧本会员状态 */
export type ScriptMembershipStatus =
  | 'ACTIVE'    // 激活
  | 'EXPIRED'   // 已过期
  | 'CANCELLED' // 已取消

// ============================================
// API 请求/响应类型
// ============================================

/** 创建剧本项目请求 */
export interface CreateScriptProjectRequest {
  title: string
  description?: string
  sourceType: SourceType
  sourceProjectId?: string  // 如果来自自有项目
  sourceNovelTitle?: string // 来源小说名称
  genre?: string
}

/** 更新剧本项目请求 */
export interface UpdateScriptProjectRequest {
  title?: string
  description?: string
  coverImage?: string
  settings?: Record<string, unknown>
}

/** 剧本项目列表响应 */
export interface ScriptProjectListResponse {
  projects: ScriptProjectWithStats[]
  total: number
}

/** 剧本项目详情（含统计） */
export interface ScriptProjectWithStats {
  id: string
  userId: string
  title: string
  description: string | null
  coverImage: string | null
  sourceType: SourceType
  sourceProjectId: string | null
  sourceNovelTitle: string | null
  genre: string | null
  status: ScriptProjectStatus
  subStatus: ScriptProjectSubStatus | null
  progress: number
  totalTokens: number
  totalShots: number
  totalDuration: number
  totalScenes: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    sources: number
    characters: number
    scenes: number
    shots: number
  }
}

// ============================================
// 会员配额
// ============================================

/** 会员权益配置 */
export interface ScriptMembershipQuota {
  plan: ScriptMembershipPlan
  maxProjects: number       // 最大项目数
  maxChaptersPerProject: number // 每项目最大章节数
  dailyGenerations: number  // 每日生成次数
  monthlyGenerations: number // 每月生成次数
  exportFormats: string[]   // 支持的导出格式
  hasWatermark: boolean     // 是否有水印
  hasAIShotImage: boolean   // 是否支持AI生成镜头图片
}

/** 会员权益配置表 */
export const SCRIPT_MEMBERSHIP_QUOTAS: Record<ScriptMembershipPlan, ScriptMembershipQuota> = {
  FREE: {
    plan: 'FREE',
    maxProjects: 3,
    maxChaptersPerProject: 5,
    dailyGenerations: 3,
    monthlyGenerations: 30,
    exportFormats: ['json', 'md'],
    hasWatermark: true,
    hasAIShotImage: false,
  },
  ENTRY: {
    plan: 'ENTRY',
    maxProjects: 10,
    maxChaptersPerProject: 20,
    dailyGenerations: 10,
    monthlyGenerations: 100,
    exportFormats: ['json', 'md', 'pdf'],
    hasWatermark: true,
    hasAIShotImage: false,
  },
  VIP: {
    plan: 'VIP',
    maxProjects: 20,
    maxChaptersPerProject: 50,
    dailyGenerations: 50,
    monthlyGenerations: 500,
    exportFormats: ['json', 'md', 'pdf', 'excel'],
    hasWatermark: false,
    hasAIShotImage: true,
  },
  PRO: {
    plan: 'PRO',
    maxProjects: Infinity,
    maxChaptersPerProject: Infinity,
    dailyGenerations: Infinity,
    monthlyGenerations: Infinity,
    exportFormats: ['json', 'md', 'pdf', 'excel'],
    hasWatermark: false,
    hasAIShotImage: true,
  },
}

// ============================================
// 错误码
// ============================================

/** 剧本系统错误码 */
export enum ScriptErrorCode {
  // 通用错误
  UNAUTHORIZED = 'SCRIPT_001',
  PROJECT_NOT_FOUND = 'SCRIPT_002',
  INVALID_PARAMS = 'SCRIPT_003',

  // 配额错误
  QUOTA_PROJECTS_EXCEEDED = 'SCRIPT_101',
  QUOTA_CHAPTERS_EXCEEDED = 'SCRIPT_102',
  QUOTA_DAILY_GENERATIONS_EXCEEDED = 'SCRIPT_103',
  QUOTA_MONTHLY_GENERATIONS_EXCEEDED = 'SCRIPT_104',

  // 生成错误
  GENERATION_IN_PROGRESS = 'SCRIPT_201',
  GENERATION_LOCKED = 'SCRIPT_202',
  GENERATION_FAILED = 'SCRIPT_203',
  GENERATION_TIMEOUT = 'SCRIPT_204',
  AI_RATE_LIMITED = 'SCRIPT_205',
  AI_CONTENT_FILTERED = 'SCRIPT_206',

  // 导入错误
  IMPORT_FILE_TOO_LARGE = 'SCRIPT_301',
  IMPORT_INVALID_FORMAT = 'SCRIPT_302',
  IMPORT_ENCODING_ERROR = 'SCRIPT_303',

  // 导出错误
  EXPORT_FAILED = 'SCRIPT_401',
  EXPORT_FORMAT_NOT_ALLOWED = 'SCRIPT_402',
}
