'use client';

import { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // 通用设置
    siteName: 'Spark',
    siteDescription: 'AI 智能知识库系统',
    allowRegistration: true,
    requireEmailVerification: true,

    // AI 设置
    aiModel: 'deepseek-chat',
    aiTemperature: 0.7,
    aiMaxTokens: 2000,

    // 邮件设置
    smtpServer: 'smtp.163.com',
    smtpPort: '465',
    smtpUsername: 'wangTest321@163.com',

    // 存储设置
    maxFileSize: 50,
    allowedFileTypes: '.docx,.pdf,.txt',
    chunkSize: 1500,
    chunkOverlap: 200,

    // 安全设置
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
  });

  const handleSave = async () => {
    // TODO: 调用 API 保存设置
    alert('设置已保存');
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">系统设置</h2>
          <p className="text-slate-500 dark:text-slate-400">配置系统参数和功能选项</p>
        </div>
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="ai">AI 配置</TabsTrigger>
          <TabsTrigger value="email">邮件设置</TabsTrigger>
          <TabsTrigger value="storage">存储配置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 通用设置 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>通用设置</CardTitle>
              <CardDescription>配置站点基本信息和用户选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">站点名称</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">站点描述</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许用户注册</Label>
                  <p className="text-xs text-slate-500">关闭后仅管理员可创建新用户</p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮箱验证</Label>
                  <p className="text-xs text-slate-500">注册时需要验证邮箱</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireEmailVerification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 配置 */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI 配置</CardTitle>
              <CardDescription>配置 AI 模型和参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiModel">AI 模型</Label>
                <Select
                  value={settings.aiModel}
                  onValueChange={(value) => setSettings({ ...settings, aiModel: value })}
                >
                  <SelectTrigger id="aiModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                    <SelectItem value="deepseek-coder">DeepSeek Coder</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiTemperature">Temperature</Label>
                <Input
                  id="aiTemperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={settings.aiTemperature}
                  onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-slate-500">控制输出随机性，越高越随机</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiMaxTokens">最大 Token 数</Label>
                <Input
                  id="aiMaxTokens"
                  type="number"
                  value={settings.aiMaxTokens}
                  onChange={(e) => setSettings({ ...settings, aiMaxTokens: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 邮件设置 */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>邮件设置</CardTitle>
              <CardDescription>配置 SMTP 邮件服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpServer">SMTP 服务器</Label>
                <Input
                  id="smtpServer"
                  value={settings.smtpServer}
                  onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP 端口</Label>
                <Input
                  id="smtpPort"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP 用户名</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP 密码</Label>
                <Input id="smtpPassword" type="password" placeholder="••••••••" />
              </div>

              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                发送测试邮件
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 存储配置 */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>存储配置</CardTitle>
              <CardDescription>文件上传和文档处理设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">最大文件大小 (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">允许的文件类型</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                />
                <p className="text-xs text-slate-500">用逗号分隔，如: .docx,.pdf,.txt</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chunkSize">分块大小 (Token)</Label>
                <Input
                  id="chunkSize"
                  type="number"
                  value={settings.chunkSize}
                  onChange={(e) => setSettings({ ...settings, chunkSize: parseInt(e.target.value) })}
                />
                <p className="text-xs text-slate-500">文档切分的大小</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chunkOverlap">分块重叠 (Token)</Label>
                <Input
                  id="chunkOverlap"
                  type="number"
                  value={settings.chunkOverlap}
                  onChange={(e) => setSettings({ ...settings, chunkOverlap: parseInt(e.target.value) })}
                />
                <p className="text-xs text-slate-500">相邻分块之间的重叠大小</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>会话和登录安全配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">会话超时时间 (秒)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">锁定持续时间 (秒)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  value={settings.lockoutDuration}
                  onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
