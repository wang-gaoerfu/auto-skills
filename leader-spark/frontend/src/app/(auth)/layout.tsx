'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();

  // 登录表单状态
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 注册表单状态
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(false);

  // 发送验证码
  const handleSendCode = async () => {
    if (!registerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      toast({
        title: '邮箱格式错误',
        description: '请输入有效的邮箱地址',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiClient.sendCode(registerEmail);
      setCodeSent(true);
      setCountdown(60);

      // 倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast({
        title: '验证码已发送',
        description: '请检查您的邮箱',
      });
    } catch (error: any) {
      toast({
        title: '发送失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerEmail || !registerCode || !registerPassword) {
      toast({
        title: '请填写完整信息',
        variant: 'destructive',
      });
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast({
        title: '密码不一致',
        description: '请确认两次输入的密码相同',
        variant: 'destructive',
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: '密码强度不足',
        description: '密码长度至少为 6 位',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRegisterLoading(true);
      await apiClient.register(registerEmail, registerCode, registerPassword);

      toast({
        title: '注册成功',
        description: '请使用您的邮箱和密码登录',
      });

      // 切换到登录标签
      setLoginEmail(registerEmail);
      setLoginPassword(registerPassword);
    } catch (error: any) {
      toast({
        title: '注册失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast({
        title: '请填写完整信息',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoginLoading(true);
      const response = await apiClient.login(loginEmail, loginPassword);

      // 保存 Token
      apiClient.setToken(response.access_token);

      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });

      // 跳转到首页
      router.push('/');
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.message || '邮箱或密码错误',
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 p-4">
      {/* 背景装饰 */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Spark
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">AI 智能知识库系统</p>
        </div>

        {/* 认证卡片 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>

              {/* 登录表单 */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-slate-500">记住我</span>
                    </label>
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                      忘记密码？
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    disabled={loginLoading}
                  >
                    {loginLoading ? '登录中...' : '登录'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-code">验证码</Label>
                    <div className="flex gap-2">
                      <Input
                        id="register-code"
                        type="text"
                        placeholder="6 位验证码"
                        value={registerCode}
                        onChange={(e) => setRegisterCode(e.target.value)}
                        maxLength={6}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || !registerEmail}
                        className="whitespace-nowrap"
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="至少 6 位"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">确认密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="再次输入密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    disabled={registerLoading}
                  >
                    {registerLoading ? '注册中...' : '注册'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col text-center text-sm text-slate-500">
            <p>登录即表示您同意我们的</p>
            <div className="flex gap-2 mt-1">
              <Link href="/terms" className="text-blue-600 hover:underline">
                服务条款
              </Link>
              <span>和</span>
              <Link href="/privacy" className="text-blue-600 hover:underline">
                隐私政策
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* 管理员入口 */}
        <div className="text-center mt-6">
          <Link
            href="/management"
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            管理员入口 →
          </Link>
        </div>
      </div>
    </div>
  );
}
