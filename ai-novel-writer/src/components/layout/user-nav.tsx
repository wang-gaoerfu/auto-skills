"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, User, Crown, Settings, Loader2, Film } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserNavProps {
  membershipPlan?: string;
}

export function UserNav({ membershipPlan: propPlan }: UserNavProps) {
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<string | null>(null);

  // 获取最新的会员信息
  useEffect(() => {
    if (session?.user) {
      fetch("/api/membership")
        .then((res) => res.json())
        .then((data) => {
          if (data.membership?.plan) {
            setPlan(data.membership.plan);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  // 优先使用 API 获取的最新数据，其次使用 prop
  const membershipPlan = plan || propPlan;

  // 加载中状态
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 未登录状态 - 显示登录/注册按钮
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">登录</Button>
        </Link>
        <Link href="/register">
          <Button size="sm">注册</Button>
        </Link>
        <ThemeToggle />
      </div>
    );
  }

  // 已登录状态 - 显示用户菜单
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm hidden sm:inline">{session.user.name || session.user.email}</span>
      {membershipPlan && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
          {membershipPlan === "PRO" ? "专业版" : membershipPlan === "VIP" ? "VIP" : "免费版"}
        </span>
      )}
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
          <User className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/scripts" className="flex items-center cursor-pointer w-full">
                <Film className="h-4 w-4 mr-2" />
                <span>剧本工坊</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="flex items-center cursor-pointer w-full">
                <Settings className="h-4 w-4 mr-2" />
                <span>设置</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/membership" className="flex items-center cursor-pointer w-full">
                <Crown className="h-4 w-4 mr-2" />
                <span>会员中心</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-500 cursor-pointer focus:text-red-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// 简单的头部导航组件
export function HeaderNav({ membershipPlan }: UserNavProps) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-xl font-bold">墨飞小说创造</span>
        </Link>
        <UserNav membershipPlan={membershipPlan} />
      </div>
    </header>
  );
}
