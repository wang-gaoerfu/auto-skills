"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, BookOpen, Clapperboard, Shield } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  membership: { novelPlan: string; novelStatus: string; novelExpiresAt: string | null } | null
  scriptMembership: { plan: string; status: string; expiresAt: string | null } | null
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)

  useEffect(() => { checkPermission() }, [])
  useEffect(() => { if (isSuperAdmin) fetchUsers() }, [isSuperAdmin])

  async function checkPermission() {
    try {
      const res = await fetch("/api/admin/users")
      if (res.status === 401) { toast.error("请先登录"); router.push("/login"); return }
      if (res.status === 403) { toast.error("无权访问"); router.push("/"); return }
      const data = await res.json()
      setIsSuperAdmin(data.isSuperAdmin)
      if (!data.isSuperAdmin) { toast.error("需要超级管理员权限"); router.push("/") }
    } catch { toast.error("检查权限失败"); router.push("/") }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch { toast.error("获取用户列表失败") }
    finally { setLoading(false) }
  }

  async function updateMembership(userId: string, type: "novel" | "script", plan: string) {
    setSaving(userId + type)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, plan }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("会员等级已更新")
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            if (type === "novel") {
              return { ...u, membership: { ...u.membership!, novelPlan: plan, novelStatus: "APPROVED" } }
            } else {
              return { ...u, scriptMembership: { ...u.scriptMembership!, plan, status: "ACTIVE" } }
            }
          }
          return u
        }))
      } else { toast.error(data.error || "更新失败") }
    } catch { toast.error("更新失败") }
    finally { setSaving(null) }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("zh-CN")
  }

  function getPlanBadge(plan: string) {
    const colors: Record<string, string> = {
      FREE: "bg-gray-100 text-gray-800",
      VIP: "bg-yellow-100 text-yellow-800",
      PRO: "bg-purple-100 text-purple-800",
      ENTRY: "bg-blue-100 text-blue-800",
    }
    return <Badge className={colors[plan] || colors.FREE} variant="outline">{plan}</Badge>
  }

  if (loading || isSuperAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }
  if (!isSuperAdmin) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>超级管理员面板</CardTitle>
          </div>
          <CardDescription>管理所有用户的会员等级</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead><div className="flex items-center gap-1"><BookOpen className="w-4 h-4" />小说会员</div></TableHead>
                  <TableHead><div className="flex items-center gap-1"><Clapperboard className="w-4 h-4" />剧本会员</div></TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name || "未设置"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.membership ? getPlanBadge(user.membership.novelPlan) : null}
                        <Select value={user.membership?.novelPlan || "FREE"} onValueChange={v => updateMembership(user.id, "novel", v)} disabled={saving === user.id + "novel"}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="PRO">PRO</SelectItem>
                          </SelectContent>
                        </Select>
                        {saving === user.id + "novel" && <Loader2 className="w-4 h-4 animate-spin" />}
                      </div>
                      {user.membership?.novelExpiresAt && <div className="text-xs text-muted-foreground mt-1">到期: {formatDate(user.membership.novelExpiresAt)}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.scriptMembership ? getPlanBadge(user.scriptMembership.plan) : null}
                        <Select value={user.scriptMembership?.plan || "FREE"} onValueChange={v => updateMembership(user.id, "script", v)} disabled={saving === user.id + "script"}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="ENTRY">ENTRY</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="PRO">PRO</SelectItem>
                          </SelectContent>
                        </Select>
                        {saving === user.id + "script" && <Loader2 className="w-4 h-4 animate-spin" />}
                      </div>
                      {user.scriptMembership?.expiresAt && <div className="text-xs text-muted-foreground mt-1">到期: {formatDate(user.scriptMembership.expiresAt)}</div>}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
