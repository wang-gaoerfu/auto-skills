'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, FileText, GitBranch, FileOutput, History } from "lucide-react"
import Link from "next/link"

type WorkflowStep = 'input' | 'clarify' | 'structure' | 'document' | 'result'

interface WorkflowState {
  step: WorkflowStep
  input: string
  result: {
    clarify?: string
    structure?: string
    document?: string
  }
  historyId?: string
}

export function RequirementsTool() {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    step: 'input',
    input: '',
    result: {},
  })
  const [loading, setLoading] = useState(false)

  const steps = [
    { id: 'clarify', name: '需求澄清', icon: FileText, description: '收集和分析需求要素' },
    { id: 'structure', name: '需求结构化', icon: GitBranch, description: '整理为标准文档格式' },
    { id: 'document', name: '文档生成', icon: FileOutput, description: '生成 Markdown 文档' },
  ]

  const startWorkflow = async () => {
    if (!workflow.input.trim()) {
      return
    }

    setLoading(true)
    try {
      // 创建工作流历史记录
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requirements-analysis',
          title: workflow.input.substring(0, 50) + '...',
          input: workflow.input,
        }),
      })

      const data = await response.json()

      setWorkflow(prev => ({
        ...prev,
        step: 'clarify',
        historyId: data.history.id,
      }))
    } catch (error) {
      console.error('Error starting workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const runStep = async (stepId: string) => {
    setLoading(true)
    try {
      // 这里应该调用对应的技能 API
      // 目前先模拟结果
      await new Promise(resolve => setTimeout(resolve, 2000))

      setWorkflow(prev => ({
        ...prev,
        result: {
          ...prev.result,
          [stepId]: `模拟的${stepId}结果...`,
        },
        step: stepId === 'clarify' ? 'structure' : stepId === 'structure' ? 'document' : 'result',
      }))
    } catch (error) {
      console.error('Error running step:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetWorkflow = () => {
    setWorkflow({
      step: 'input',
      input: '',
      result: {},
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 输入阶段 */}
      {workflow.step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>开始需求分析</CardTitle>
            <CardDescription>描述你的需求，我们将帮你完成完整的分析流程</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={workflow.input}
              onChange={(e) => setWorkflow({ ...workflow, input: e.target.value })}
              placeholder="描述你的需求，例如：我想开发一个在线文档编辑器，支持多人实时协作..."
              className="min-h-[200px] w-full rounded-md border border-input bg-background p-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-4 flex justify-between items-center">
              <Link href="/workflow">
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  查看历史记录
                </Button>
              </Link>
              <Button onClick={startWorkflow} disabled={loading || !workflow.input.trim()}>
                {loading ? '启动中...' : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工作流步骤 */}
      {workflow.step !== 'input' && workflow.step !== 'result' && (
        <div className="space-y-6">
          {/* 进度指示 */}
          <Card>
            <CardHeader>
              <CardTitle>工作流进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = workflow.step === step.id
                  const isCompleted = steps.indexOf(steps.find(s => s.id === workflow.step)!) > index

                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? '✓' : <StepIcon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isActive ? 'text-primary' : ''}`}>{step.name}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                      {isActive && (
                        <Button size="sm" onClick={() => runStep(step.id)} disabled={loading}>
                          {loading ? '执行中...' : '执行'}
                        </Button>
                      )}
                      {isCompleted && (
                        <Button size="sm" variant="outline" disabled>
                          已完成
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 当前步骤结果 */}
          {workflow.result[workflow.step === 'structure' ? 'clarify' : workflow.step === 'document' ? 'structure' : ''] && (
            <Card>
              <CardHeader>
                <CardTitle>当前结果</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                  {workflow.result[workflow.step === 'structure' ? 'clarify' : workflow.step === 'document' ? 'structure' : '']}
                </pre>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={resetWorkflow}>
            重新开始
          </Button>
        </div>
      )}

      {/* 结果阶段 */}
      {workflow.step === 'result' && (
        <div className="space-y-6">
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                需求分析完成
              </CardTitle>
              <CardDescription>所有步骤已完成，查看生成的文档</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.result.clarify && (
                <div>
                  <h4 className="mb-2 font-medium">需求澄清结果</h4>
                  <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                    {workflow.result.clarify}
                  </pre>
                </div>
              )}
              {workflow.result.structure && (
                <div>
                  <h4 className="mb-2 font-medium">需求结构化结果</h4>
                  <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                    {workflow.result.structure}
                  </pre>
                </div>
              )}
              {workflow.result.document && (
                <div>
                  <h4 className="mb-2 font-medium">生成的文档</h4>
                  <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm max-h-[300px]">
                    {workflow.result.document}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={resetWorkflow}>
              开始新的分析
            </Button>
            <Link href="/workflow">
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                查看所有历史
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
