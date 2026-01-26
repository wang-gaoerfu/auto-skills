export interface WorkflowStep {
  id: string
  name: string
  description: string
  skill?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
}

export const workflows: Record<string, WorkflowDefinition> = {
  'requirements-analysis': {
    id: 'requirements-analysis',
    name: '需求分析',
    description: '从需求澄清到文档生成的完整流程',
    steps: [
      {
        id: 'clarify',
        name: '需求澄清',
        description: '通过对话收集和分析软件需求',
        skill: 'req-clarify',
      },
      {
        id: 'structure',
        name: '需求结构化',
        description: '将需求整理为标准文档格式',
        skill: 'req-structure',
      },
      {
        id: 'document',
        name: '文档生成',
        description: '生成 Markdown 格式的需求文档',
        skill: 'doc-generator',
      },
    ],
  },
  'architecture': {
    id: 'architecture',
    name: '架构设计',
    description: '技术选型和系统架构设计',
    steps: [
      {
        id: 'analyze',
        name: '需求分析',
        description: '分析技术需求和约束条件',
      },
      {
        id: 'selection',
        name: '技术选型',
        description: '选择合适的技术栈',
      },
      {
        id: 'design',
        name: '架构设计',
        description: '设计系统架构',
      },
    ],
  },
}

export async function executeWorkflowStep(
  workflowId: string,
  stepId: string,
  input: any
): Promise<any> {
  const workflow = workflows[workflowId]
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  const step = workflow.steps.find(s => s.id === stepId)
  if (!step) {
    throw new Error('Step not found')
  }

  // 这里应该调用对应的技能
  // 目前返回模拟结果
  return {
    step: stepId,
    result: `模拟的${step.name}结果`,
    timestamp: new Date().toISOString(),
  }
}

export async function executeWorkflow(
  workflowId: string,
  input: string,
  onProgress?: (stepId: string, result: any) => void
): Promise<any> {
  const workflow = workflows[workflowId]
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  const results: any = {
    workflowId,
    startTime: new Date().toISOString(),
    steps: {},
  }

  let currentInput = input

  for (const step of workflow.steps) {
    const result = await executeWorkflowStep(workflowId, step.id, currentInput)
    results.steps[step.id] = result

    if (onProgress) {
      onProgress(step.id, result)
    }

    // 将当前步骤的输出作为下一步的输入
    currentInput = result
  }

  results.endTime = new Date().toISOString()

  return results
}
