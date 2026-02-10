import { prisma } from '../db'
import type { ToolExecutor, ToolConfig, FormField, ToolResult } from '@/types/tool'

// Tool registry
export const toolRegistry: Map<string, ToolExecutor> = new Map()

// Register a new tool
export function registerTool(tool: ToolExecutor) {
  toolRegistry.set(tool.name, tool)
}

// Unregister a tool
export function unregisterTool(name: string) {
  toolRegistry.delete(name)
}

// Get a tool by name
export function getTool(name: string): ToolExecutor | undefined {
  return toolRegistry.get(name)
}

// Get all registered tools
export function getAllTools(): ToolExecutor[] {
  return Array.from(toolRegistry.values())
}

// Check if user can use a tool
async function canUserUseTool(userId: string, toolName: string): Promise<boolean> {
  const tool = getTool(toolName)
  if (!tool) {
    return false
  }

  // Free tools can be used by anyone
  if (tool.isFree) {
    return true
  }

  // Check user membership
  const membership = await prisma.membership.findUnique({
    where: { userId }
  })

  if (!membership) {
    return false
  }

  // Check if membership is approved
  if (membership.status !== 'APPROVED') {
    return false
  }

  // Check if membership is expired
  if (membership.expiresAt && membership.expiresAt < new Date()) {
    return false
  }

  return true
}

// Execute a tool
export async function executeTool(
  toolName: string,
  input: Record<string, any>,
  userId: string
): Promise<ToolResult & { duration?: number }> {
  // Check if user can use this tool
  const canUse = await canUserUseTool(userId, toolName)
  if (!canUse) {
    return {
      success: false,
      error: '您需要升级会员才能使用此工具',
    }
  }

  const tool = getTool(toolName)
  if (!tool) {
    return {
      success: false,
      error: `工具 ${toolName} 不存在`,
    }
  }

  // Validate input based on tool config
  const validation = validateInput(tool.config, input)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  // Record start time
  const startTime = Date.now()

  try {
    // Execute the tool
    const result = await tool.execute(input)
    const duration = Date.now() - startTime

    // Save usage record
    await prisma.toolUsage.create({
      data: {
        userId,
        toolId: toolName,
        input: JSON.stringify(input),
        output: result.success ? JSON.stringify(result.data) : null,
        duration,
        success: result.success,
        error: result.error,
      },
    })

    // Update tool use count
    await prisma.tool.update({
      where: { id: toolName },
      data: { useCount: { increment: 1 } },
    }).catch(() => {
      // Tool might not exist in database yet
    })

    return {
      ...result,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Save failed usage record
    await prisma.toolUsage.create({
      data: {
        userId,
        toolId: toolName,
        input: JSON.stringify(input),
        duration,
        success: false,
        error: errorMessage,
      },
    })

    return {
      success: false,
      error: errorMessage,
      duration,
    }
  }
}

// Validate input against tool config
function validateInput(config: ToolConfig, input: Record<string, any>): {
  valid: boolean
  error?: string
} {
  for (const field of config.fields) {
    const value = input[field.name]

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      return {
        valid: false,
        error: `${field.label} 是必填项`,
      }
    }

    // Skip validation if field is not required and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      continue
    }

    // Type-specific validation
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return {
            valid: false,
            error: `${field.label} 必须是数字`,
          }
        }
        if (field.min !== undefined && Number(value) < field.min) {
          return {
            valid: false,
            error: `${field.label} 不能小于 ${field.min}`,
          }
        }
        if (field.max !== undefined && Number(value) > field.max) {
          return {
            valid: false,
            error: `${field.label} 不能大于 ${field.max}`,
          }
        }
        break

      case 'select':
        if (field.options && !field.options.some(opt => opt.value === value)) {
          return {
            valid: false,
            error: `${field.label} 的值无效`,
          }
        }
        break
    }
  }

  return { valid: true }
}

// Parse tool config from database JSON string
export function parseToolConfig(configString: string | null): ToolConfig {
  if (!configString) {
    return { fields: [] }
  }

  try {
    return JSON.parse(configString)
  } catch {
    return { fields: [] }
  }
}

// Stringify tool config for database storage
export function stringifyToolConfig(config: ToolConfig): string {
  return JSON.stringify(config)
}
