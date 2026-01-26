'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface EnvVar {
  key: string
  value: string
}

interface MCPServerData {
  name: string
  command: string
  args: string[]
  env: EnvVar[]
}

const steps = [
  { id: 1, title: '基本信息', description: '设置服务器名称和命令' },
  { id: 2, title: '参数配置', description: '添加命令参数和环境变量' },
  { id: 3, title: '确认创建', description: '确认配置并添加服务器' },
]

export function AddMCPWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [serverData, setServerData] = useState<MCPServerData>({
    name: '',
    command: '',
    args: [],
    env: [],
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newArg, setNewArg] = useState('')
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!serverData.name) {
        newErrors.name = '服务器名称不能为空'
      } else if (!/^[a-zA-Z0-9-_]+$/.test(serverData.name)) {
        newErrors.name = '服务器名称只能包含字母、数字、连字符和下划线'
      }
      if (!serverData.command) {
        newErrors.command = '命令不能为空'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const config: any = {
        command: serverData.command,
      }

      if (serverData.args.length > 0) {
        config.args = serverData.args
      }

      if (serverData.env.length > 0) {
        config.env = {}
        serverData.env.forEach(e => {
          config.env[e.key] = e.value
        })
      }

      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { name: serverData.name, type: serverData.command, config } }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建失败')
      }

      router.push('/mcp')
    } catch (error: any) {
      setErrors({ submit: error.message || '添加 MCP 服务器失败' })
    } finally {
      setLoading(false)
    }
  }

  const addArg = () => {
    if (newArg.trim()) {
      setServerData(prev => ({ ...prev, args: [...prev.args, newArg.trim()] }))
      setNewArg('')
    }
  }

  const removeArg = (index: number) => {
    setServerData(prev => ({ ...prev, args: prev.args.filter((_, i) => i !== index) }))
  }

  const addEnv = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setServerData(prev => ({ ...prev, env: [...prev.env, { key: newEnvKey.trim(), value: newEnvValue.trim() }] }))
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }

  const removeEnv = (index: number) => {
    setServerData(prev => ({ ...prev, env: prev.env.filter((_, i) => i !== index) }))
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-4 h-0.5 w-16 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  服务器名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={serverData.name}
                  onChange={(e) => setServerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="filesystem"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.name ? 'border-destructive' : 'border-input'
                  } focus:outline-none focus:ring-1 focus:ring-ring`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  命令 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={serverData.command}
                  onChange={(e) => setServerData(prev => ({ ...prev, command: e.target.value }))}
                  placeholder="npx"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.command ? 'border-destructive' : 'border-input'
                  } focus:outline-none focus:ring-1 focus:ring-ring`}
                />
                {errors.command && (
                  <p className="mt-1 text-xs text-destructive">{errors.command}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  启动 MCP 服务器的命令，如 npx、uvx 等
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">常用 MCP 服务器</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Filesystem</span>
                    <code className="text-muted-foreground">@modelcontextprotocol/server-filesystem</code>
                  </div>
                  <div className="flex justify-between">
                    <span>GitHub</span>
                    <code className="text-muted-foreground">@modelcontextprotocol/server-github</code>
                  </div>
                  <div className="flex justify-between">
                    <span>SQLite</span>
                    <code className="text-muted-foreground">@modelcontextprotocol/server-sqlite</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* 命令参数 */}
              <div>
                <label className="mb-2 block text-sm font-medium">命令参数</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newArg}
                    onChange={(e) => setNewArg(e.target.value)}
                    placeholder="--allow-read /path"
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    onKeyPress={(e) => e.key === 'Enter' && addArg()}
                  />
                  <Button onClick={addArg} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {serverData.args.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {serverData.args.map((arg, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                        <code>{arg}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArg(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 环境变量 */}
              <div>
                <label className="mb-2 block text-sm font-medium">环境变量</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="KEY"
                    className="w-1/3 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="value"
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    onKeyPress={(e) => e.key === 'Enter' && addEnv()}
                  />
                  <Button onClick={addEnv} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {serverData.env.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {serverData.env.map((env, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                        <code>{env.key}={env.value}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEnv(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-4 font-medium">确认 MCP 服务器配置</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">服务器名称:</dt>
                    <dd className="font-mono">{serverData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">命令:</dt>
                    <dd className="font-mono">{serverData.command}</dd>
                  </div>
                  {serverData.args.length > 0 && (
                    <div>
                      <dt className="text-muted-foreground">参数:</dt>
                      <dd className="mt-1 space-y-1">
                        {serverData.args.map((arg, i) => (
                          <div key={i} className="font-mono text-xs">{arg}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {serverData.env.length > 0 && (
                    <div>
                      <dt className="text-muted-foreground">环境变量:</dt>
                      <dd className="mt-1 space-y-1">
                        {serverData.env.map((env, i) => (
                          <div key={i} className="font-mono text-xs">{env.key}={env.value}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  配置将被添加到 <span className="font-mono">.claude/config.json</span>
                </p>
              </div>

              {errors.submit && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="mt-6 flex items-center justify-between">
        <Link href="/mcp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            取消
          </Button>
        </Link>

        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              上一步
            </Button>
          )}

          {currentStep < steps.length ? (
            <Button size="sm" onClick={handleNext}>
              下一步
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? '添加中...' : '添加服务器'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
