export interface Skill {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  category: string
  path: string
  enabled: boolean
  useCount: number
  lastUsed: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MCPServer {
  id: string
  name: string
  type: string
  config: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowHistory {
  id: string
  type: string
  title: string
  input: string
  output: string
  status: 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface SkillMetadata {
  name: string
  displayName?: string
  description: string
  version: string
  author?: string
  parameters?: {
    type: string
    properties?: Record<string, any>
    required?: string[]
  }
}
