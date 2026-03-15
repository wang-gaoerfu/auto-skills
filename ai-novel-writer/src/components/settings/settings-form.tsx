"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  membership?: {
    plan: string;
    status: string;
    expiresAt: string | null;
  };
}

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotify, setEmailNotify] = useState(true);
  const [dailyRemind, setDailyRemind] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载用户数据
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || "");
        }
      })
      .catch(() => {
        toast.error("加载用户信息失败");
      });
  }, []);

  // 保存昵称
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("昵称不能为空");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("昵称更新成功");
        setUser((prev) => prev ? { ...prev, name } : null);
      } else {
        toast.error(data.error || "更新失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("请填写完整信息");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("新密码至少6位");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("密码修改成功");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "修改失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  // 主题切换
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`已切换到${newTheme === "light" ? "浅色" : newTheme === "dark" ? "深色" : "系统"}主题`);
  };

  // 通知设置
  const handleNotifyChange = (type: string, value: boolean) => {
    if (type === "email") {
      setEmailNotify(value);
      toast.success(value ? "已开启邮件通知" : "已关闭邮件通知");
    } else {
      setDailyRemind(value);
      toast.success(value ? "已开启创作提醒" : "已关闭创作提醒");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">墨飞小说创造</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">设置</h1>

        <div className="grid gap-6 max-w-2xl">
          {/* 账户信息 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>账户信息</CardTitle>
              </div>
              <CardDescription>管理你的账户基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">昵称</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入昵称"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>会员等级:</span>
                <span className="font-medium text-primary">
                  {user?.membership?.plan || "FREE"}
                </span>
                {user?.membership?.expiresAt && (
                  <span>
                    (有效期至 {new Date(user.membership.expiresAt).toLocaleDateString()})
                  </span>
                )}
              </div>
              <Button onClick={handleSaveProfile} disabled={loading}>
                保存修改
              </Button>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>安全设置</CardTitle>
              </div>
              <CardDescription>密码和安全选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                修改密码
              </Button>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>通知设置</CardTitle>
              </div>
              <CardDescription>管理通知偏好</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">邮件通知</p>
                    <p className="text-sm text-muted-foreground">接收重要更新和提醒</p>
                  </div>
                  <Switch
                    checked={emailNotify}
                    onCheckedChange={(v) => handleNotifyChange("email", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">创作提醒</p>
                    <p className="text-sm text-muted-foreground">每日创作提醒</p>
                  </div>
                  <Switch
                    checked={dailyRemind}
                    onCheckedChange={(v) => handleNotifyChange("daily", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 外观设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>外观设置</CardTitle>
              </div>
              <CardDescription>自定义界面外观</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">主题模式</p>
                  <p className="text-sm text-muted-foreground">选择明暗主题</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("light")}
                  >
                    浅色
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("dark")}
                  >
                    深色
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("system")}
                  >
                    跟随系统
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
