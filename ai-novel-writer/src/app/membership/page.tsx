"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PenTool,
  Crown,
  Zap,
  Check,
  Loader2,
  Gift,
} from "lucide-react"

interface MembershipInfo {
  plan: string
  status: string
  expiresAt: string | null
  appliedAt: string
  approvedAt: string | null
}

export default function MembershipPage() {
  const router = useRouter()
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activateCode, setActivateCode] = useState("")
  const [activating, setActivating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchMembership()
  }, [])

  async function fetchMembership() {
    try {
      const res = await fetch("/api/membership")
      if (res.ok) {
        const data = await res.json()
        setMembership(data.membership)
      }
    } catch (error) {
      console.error("Failed to fetch membership:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate() {
    if (!activateCode.trim()) return

    setActivating(true)
    setMessage(null)

    try {
      const res = await fetch("/api/membership/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activateCode }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "激活成功！" })
        setActivateCode("")
        fetchMembership()
      } else {
        setMessage({ type: "error", text: data.message || "激活失败" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "激活失败，请稍后重试" })
    } finally {
      setActivating(false)
    }
  }

  const planLabels: Record<string, { label: string; color: string }> = {
    FREE: { label: "免费版", color: "secondary" },
    VIP: { label: "VIP", color: "default" },
    PRO: { label: "专业版", color: "default" },
  }

  const planFeatures: Record<string, string[]> = {
    FREE: ["每日 5 万字", "1 个项目", "GLM-4-Flash 模型", "基础功能"],
    VIP: ["无限字数", "10 个项目", "DeepSeek V3 模型", "高级提示词", "优先支持"],
    PRO: ["无限字数", "无限项目", "DeepSeek + Kimi", "API 访问", "最高优先级支持"],
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPlan = membership?.plan || "FREE"
  const planInfo = planLabels[currentPlan]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <PenTool className="h-6 w-6" />
            <span className="text-xl font-bold">AI小说创作能手</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">返回仪表盘</Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">会员中心</h1>
          <p className="text-muted-foreground mb-8">管理您的会员订阅</p>

          {/* 当前状态 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                当前会员状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={planInfo.color as any} className="text-lg px-4 py-1">
                    {planInfo.label}
                  </Badge>
                  {membership?.expiresAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      有效期至：{new Date(membership.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {currentPlan === "FREE" && (
                  <p className="text-sm text-muted-foreground">
                    升级会员解锁更多功能
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-medium mb-3">当前权益</h3>
                <ul className="space-y-2">
                  {planFeatures[currentPlan].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 兑换码激活 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                兑换码激活
              </CardTitle>
              <CardDescription>输入兑换码升级会员</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                  className="mb-4"
                >
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="code" className="sr-only">
                    兑换码
                  </Label>
                  <Input
                    id="code"
                    placeholder="输入兑换码，例如：VIP-2026-XXXXXX"
                    value={activateCode}
                    onChange={(e) => setActivateCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button onClick={handleActivate} disabled={activating || !activateCode.trim()}>
                  {activating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "激活"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 升级套餐 */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className={currentPlan === "FREE" ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>免费版</CardTitle>
                <CardDescription>适合新手体验</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">¥0</div>
                <ul className="space-y-2 text-sm">
                  {planFeatures.FREE.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === "FREE" && (
                  <Badge variant="secondary" className="mt-4">
                    当前套餐
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className={currentPlan === "VIP" ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>VIP</CardTitle>
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>适合进阶创作者</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">¥29<span className="text-base font-normal">/月</span></div>
                <ul className="space-y-2 text-sm">
                  {planFeatures.VIP.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === "VIP" ? (
                  <Badge variant="secondary" className="mt-4">
                    当前套餐
                  </Badge>
                ) : (
                  <Button variant="outline" className="mt-4 w-full" disabled>
                    使用兑换码激活
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={currentPlan === "PRO" ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>专业版</CardTitle>
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
                <CardDescription>适合专业作家</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">¥99<span className="text-base font-normal">/月</span></div>
                <ul className="space-y-2 text-sm">
                  {planFeatures.PRO.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === "PRO" ? (
                  <Badge variant="secondary" className="mt-4">
                    当前套餐
                  </Badge>
                ) : (
                  <Button variant="outline" className="mt-4 w-full" disabled>
                    使用兑换码激活
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
