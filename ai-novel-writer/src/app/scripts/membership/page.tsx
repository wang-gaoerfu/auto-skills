"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Crown,
  Sparkles,
  Check,
  Gift,
  Loader2,
  ArrowLeft,
  Film,
  PenTool,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface MembershipInfo {
  plan: string
  status: string
  expiresAt: string | null
  dailyGenerations: number
  monthlyGenerations: number
}

interface QuotaInfo {
  maxProjects: number
  maxChaptersPerProject: number | null
  dailyGenerations: number
  monthlyGenerations: number
  exportFormats: string[]
  hasWatermark: boolean
  hasAIShotImage: boolean
}

const planInfo = {
  FREE: {
    name: "免费版",
    price: "免费",
    color: "bg-gray-500",
    features: [
      "5 个章节数限制",
      "基础 AI 生成",
      "JSON/MD 导出",
    ],
    limitations: [
      "无批量生成",
      "无 PDF 导出",
    ],
  },
  BASIC: {
    name: "入门版",
    price: "¥9/月",
    color: "bg-blue-500",
    features: [
      "20 个章节数/月",
      "完整 AI 生成功能",
      "所有导出格式",
      "批量生成",
    ],
    limitations: [],
  },
  VIP: {
    name: "专业版",
    price: "¥29/月",
    color: "bg-purple-500",
    features: [
      "100 个章节数/月",
      "优先 AI 生成速度",
      "所有导出格式",
      "批量生成",
      "水印控制",
    ],
    limitations: [],
  },
  PRO: {
    name: "旗舰版",
    price: "¥99/月",
    color: "bg-amber-500",
    features: [
      "无限章节数",
      "最高优先级",
      "所有导出格式",
      "批量生成",
      "无水印",
      "专属客服",
    ],
    limitations: [],
  },
}

export default function ScriptMembershipPage() {
  const router = useRouter()
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMessage, setDialogMessage] = useState({ title: "", description: "" })

  useEffect(() => {
    fetchMembership()
  }, [])

  const fetchMembership = async () => {
    try {
      const res = await fetch("/api/scripts/membership")
      if (res.ok) {
        const data = await res.json()
        setMembership(data.membership)
        setQuota(data.quota)
      }
    } catch (error) {
      console.error("获取会员信息失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return

    setRedeeming(true)
    try {
      const res = await fetch("/api/scripts/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode }),
      })

      const data = await res.json()

      if (res.ok) {
        setDialogMessage({
          title: "激活成功",
          description: `已成功激活${planInfo[data.plan as keyof typeof planInfo]?.name || data.plan}会员！`,
        })
        setRedeemCode("")
        fetchMembership()
      } else {
        setDialogMessage({
          title: "激活失败",
          description: data.error || "兑换码无效或已过期",
        })
      }
      setDialogOpen(true)
    } catch (error) {
      setDialogMessage({
        title: "激活失败",
        description: "网络错误，请稍后重试",
      })
      setDialogOpen(true)
    } finally {
      setRedeeming(false)
    }
  }

  const currentPlan = membership?.plan || "FREE"
  const currentPlanInfo = planInfo[currentPlan as keyof typeof planInfo] || planInfo.FREE

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container max-w-4xl flex h-16 items-center justify-between px-4">
          <Link href="/scripts" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>返回剧本列表</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/scripts">
              <Button variant="ghost" size="sm">
                <Film className="h-4 w-4 mr-2" />
                剧本工坊
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-amber-500" />
          剧本工坊会员中心
        </h1>
        <p className="text-muted-foreground mt-2">
          管理您的剧本系统会员权益
        </p>
      </div>

      {/* 当前会员状态 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>当前会员等级</CardTitle>
              <CardDescription>您的剧本系统会员状态</CardDescription>
            </div>
            <Badge className={`${currentPlanInfo.color} text-white`}>
              {currentPlanInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{quota?.maxProjects ?? "∞"}</div>
              <div className="text-sm text-muted-foreground">最大项目数</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{quota?.maxChaptersPerProject ?? "∞"}</div>
              <div className="text-sm text-muted-foreground">每项目章节数</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{currentPlanInfo.price}</div>
              <div className="text-sm text-muted-foreground">当前价格</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {membership?.expiresAt
                  ? new Date(membership.expiresAt).toLocaleDateString()
                  : "永久"}
              </div>
              <div className="text-sm text-muted-foreground">到期时间</div>
            </div>
          </div>

          {/* 兑换码激活 */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              兑换码激活
            </h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="redeem-code" className="sr-only">
                  兑换码
                </Label>
                <Input
                  id="redeem-code"
                  placeholder="请输入兑换码"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                />
              </div>
              <Button onClick={handleRedeem} disabled={redeeming || !redeemCode.trim()}>
                {redeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    激活中...
                  </>
                ) : (
                  "立即激活"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 会员等级对比 */}
      <h2 className="text-xl font-bold mb-4">会员等级对比</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(planInfo).map(([key, info]) => (
          <Card
            key={key}
            className={`relative overflow-visible ${currentPlan === key ? "ring-2 ring-primary" : ""}`}
          >
            <CardHeader className="text-center pb-2 relative">
              {currentPlan === key && (
                <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs">当前等级</Badge>
              )}
              <Badge className={`${info.color} text-white mx-auto mb-2`}>
                {info.name}
              </Badge>
              <div className="text-2xl font-bold">{info.price}</div>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                {info.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {info.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-4 w-4 flex-shrink-0">✕</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 提示 */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">温馨提示</p>
            <ul className="list-disc list-inside space-y-1">
              <li>剧本会员与小说会员相互独立</li>
              <li>兑换码激活后立即生效</li>
              <li>如有问题请联系客服</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 结果弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialogMessage.title}</DialogTitle>
            <DialogDescription>{dialogMessage.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  )
}
