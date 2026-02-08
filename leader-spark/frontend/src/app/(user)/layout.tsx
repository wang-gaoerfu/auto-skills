'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CategorySelector } from '@/components/chat/CategorySelector';
import { ThemeSwitcher } from '@/components/chat/ThemeSwitcher';
import { HistorySidebar } from '@/components/chat/HistorySidebar';
import { UserMenu } from '@/components/chat/UserMenu';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Menu } from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('coaching');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      // 检查是否有 token
      const token = apiClient.getToken();
      if (!token) {
        // 未登录，重定向到认证页面
        router.push('/auth');
        return;
      }

      // 验证 token 是否有效
      await apiClient.getCurrentUser();
      setIsAuthenticated(true);
    } catch (error) {
      // Token 无效，清除并重定向
      apiClient.clearToken();
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelect = (conv: Conversation) => {
    setCurrentConversation(conv);
    setSelectedCategoryId(conv.category);
    // TODO: 加载对话消息
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // 创建新对话
    setCurrentConversation(null);
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      toast({
        title: '已退出登录',
        description: '期待您的下次访问',
      });
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使退出失败也清除本地 token
      apiClient.clearToken();
      router.push('/auth');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 将重定向到认证页面
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* 历史记录侧边栏 */}
      <HistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onConversationSelect={handleConversationSelect}
        currentConversationId={currentConversation?.id}
        selectedCategoryId={selectedCategoryId}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 极简顶部栏 */}
        <header className="h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-950">
          {/* 左侧：菜单按钮 + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-blue-500/25">
              🔄
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Spark
            </span>
          </div>

          {/* 中间：类别选择 */}
          <CategorySelector value={selectedCategoryId} onChange={handleCategoryChange} />

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <UserMenu onLogout={handleLogout} />
          </div>
        </header>

        {/* 主内容区 - 使用 ChatContainer */}
        <ChatContainer selectedCategoryId={selectedCategoryId} sessionId={currentConversation?.id} />
      </div>
    </div>
  );
}
