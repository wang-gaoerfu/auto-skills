'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface SkillFormData {
  name: string
  displayName: string
  description: string
  version: string
  author: string
  category: string
}

const steps = [
  { id: 1, title: '基本信息', description: '设置技能的基本信息' },
  { id: 2, title: '详细描述', description: '添加技能的详细描述' },
  { id: 3, title: '确认创建', description: '确认信息并创建技能' },
]

export function CreateSkillWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    displayName: '',
    description: '',
    version: '1.0.0',
    author: '',
    category: 'builtin',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name) {
        newErrors.name = '技能名称不能为空'
      } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
        newErrors.name = '技能名称只能包含小写字母、数字和连字符'
      }
      if (!formData.displayName) {
        newErrors.displayName = '显示名称不能为空'
      }
      if (!formData.description) {
        newErrors.description = '描述不能为空'
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
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建失败')
      }

      const result = await response.json()
      router.push(`/skills/${formData.name}`)
    } catch (error: any) {
      setErrors({ submit: error.message || '创建技能失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof SkillFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
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
                  技能名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="my-skill"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.name ? 'border-destructive' : 'border-input'
                  } focus:outline-none focus:ring-1 focus:ring-ring`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  使用 kebab-case 格式（小写字母和连字符）
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  显示名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => updateFormData('displayName', e.target.value)}
                  placeholder="My Skill"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.displayName ? 'border-destructive' : 'border-input'
                  } focus:outline-none focus:ring-1 focus:ring-ring`}
                />
                {errors.displayName && (
                  <p className="mt-1 text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  描述 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="简短描述这个技能的功能"
                  rows={3}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    errors.description ? 'border-destructive' : 'border-input'
                  } focus:outline-none focus:ring-1 focus:ring-ring`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-destructive">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">版本号</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => updateFormData('version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">作者</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => updateFormData('author', e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="builtin">内置技能</option>
                  <option value="community">社区技能</option>
                </select>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">下一步</p>
                <p className="text-xs text-muted-foreground">
                  创建后，你需要编辑 SKILL.md 文件来定义技能的核心行为。
                  系统会基于 basic-skill 模板生成初始文件。
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-4 font-medium">确认技能信息</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">技能名称:</dt>
                    <dd className="font-mono">{formData.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">显示名称:</dt>
                    <dd>{formData.displayName || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">描述:</dt>
                    <dd className="max-w-xs text-right">{formData.description || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">版本:</dt>
                    <dd>{formData.version || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">作者:</dt>
                    <dd>{formData.author || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">分类:</dt>
                    <dd>{formData.category === 'builtin' ? '内置技能' : '社区技能'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  系统将在 <span className="font-mono">skills/{formData.category}/{formData.name}/</span> 创建以下文件：
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• skill.json - 技能配置</li>
                  <li>• SKILL.md - 核心提示词</li>
                  <li>• description.md - 使用说明</li>
                </ul>
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
        <Link href="/skills">
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
              {loading ? '创建中...' : '创建技能'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
