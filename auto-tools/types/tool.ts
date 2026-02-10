// Form field types for tool config
export type FormFieldType = 'text' | 'number' | 'select' | 'textarea' | 'file' | 'boolean'

export interface FormField {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  defaultValue?: any
  options?: { label: string; value: any }[]
  placeholder?: string
  min?: number
  max?: number
}

// Tool configuration
export interface ToolConfig {
  fields: FormField[]
  validation?: Record<string, any>
}

// Tool result
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

// Tool interface
export interface Tool {
  id: string
  name: string
  slug: string
  description: string
  icon?: string | null
  categoryId: string
  isFree: boolean
  isActive: boolean
  sortOrder: number
  useCount: number
  config?: string | null  // JSON string
  createdAt: Date
  updatedAt: Date
  category?: ToolCategory
}

// Tool category
export interface ToolCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
  description?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
}

// Tool usage record
export interface ToolUsage {
  id: string
  userId: string
  toolId: string
  input?: string | null
  output?: string | null
  duration?: number | null
  success: boolean
  error?: string | null
  createdAt: Date
}

// Tool executor interface
export interface ToolExecutor {
  name: string
  description: string
  category: string
  isFree: boolean
  config: ToolConfig
  execute(input: any): Promise<ToolResult>
}
