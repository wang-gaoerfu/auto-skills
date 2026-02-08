'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

interface UserMenuProps {
  onLogout?: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      const user = await apiClient.getCurrentUser();
      setUserEmail(user.email);
      setIsAdmin(user.is_admin);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      toast({
        title: '已退出登录',
        description: '期待您的下次访问',
      });
      onLogout?.();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使退出失败也清除本地 token
      apiClient.clearToken();
      router.push('/auth');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 bg-slate-100 dark:bg-slate-800"
          >
            <User className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">账号</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              {isAdmin && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  管理员
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { loadUserInfo(); setProfileOpen(true); }}>
            <User className="w-4 h-4 mr-2" />
            个人信息
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            设置
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/management')}>
                <Shield className="w-4 h-4 mr-2" />
                管理后台
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 设置弹窗 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">主题</Label>
              <select
                id="theme"
                className="px-3 py-2 border rounded-md bg-transparent"
                defaultValue="system"
              >
                <option value="light">亮色</option>
                <option value="dark">暗色</option>
                <option value="system">跟随系统</option>
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 个人信息弹窗 */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>个人信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" value={userEmail} disabled />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>管理员</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-slate-600" />
                    <span>普通用户</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
