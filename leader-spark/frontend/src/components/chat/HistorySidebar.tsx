'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type Conversation } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  currentConversationId?: string;
  selectedCategoryId?: string;
}

export function HistorySidebar({
  isOpen,
  onClose,
  onConversationSelect,
  currentConversationId,
  selectedCategoryId,
}: HistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupedConversations, setGroupedConversations] = useState<{
    today: Conversation[];
    yesterday: Conversation[];
    past7Days: Conversation[];
    past30Days: Conversation[];
    older: Conversation[];
  }>({
    today: [],
    yesterday: [],
    past7Days: [],
    past30Days: [],
    older: [],
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, selectedCategoryId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      groupConversations(filtered);
    } else {
      groupConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSessions(selectedCategoryId);
      setConversations(response.sessions || []);
      groupConversations(response.sessions || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const groupConversations = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const past7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      past7Days: [] as Conversation[],
      past30Days: [] as Conversation[],
      older: [] as Conversation[],
    };

    convs.forEach((conv) => {
      const updatedAt = new Date(conv.updatedAt);
      if (updatedAt >= today) {
        groups.today.push(conv);
      } else if (updatedAt >= yesterday) {
        groups.yesterday.push(conv);
      } else if (updatedAt >= past7Days) {
        groups.past7Days.push(conv);
      } else if (updatedAt >= past30Days) {
        groups.past30Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    setGroupedConversations(groups);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: '',
      title: '新对话',
      category: selectedCategoryId || 'coaching',
      categoryIcon: '🎯',
      categoryColor: '#4A90E2',
      messages: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    onConversationSelect(newConv);
    onClose();
  };

  const handleClearHistory = async () => {
    if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
      try {
        // 清空本地显示
        setConversations([]);
        setGroupedConversations({
          today: [],
          yesterday: [],
          past7Days: [],
          past30Days: [],
          older: [],
        });

        toast({
          title: '历史记录已清空',
          description: '所有对话记录已被删除',
        });
      } catch (error) {
        toast({
          title: '操作失败',
          description: '请稍后重试',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      try {
        await apiClient.deleteSession(id);
        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        toast({
          title: '对话已删除',
        });
      } catch (error) {
        toast({
          title: '删除失败',
          description: '请稍后重试',
          variant: 'destructive',
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">历史记录</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="搜索历史..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* 新建对话按钮 */}
        <Button onClick={handleNewConversation} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          新对话
        </Button>
      </div>

      {/* 历史记录列表 */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 今天 */}
            {groupedConversations.today.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  今天
                </h3>
                <div className="space-y-1">
                  {groupedConversations.today.map((conv) => (
                    <HistoryItem
                      key={conv.id}
                      conversation={conv}
                      isActive={currentConversationId === conv.id}
                      onClick={() => {
                        onConversationSelect(conv);
                        onClose();
                      }}
                      onDelete={(e) => handleDeleteConversation(conv.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 昨天 */}
            {groupedConversations.yesterday.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  昨天
                </h3>
                <div className="space-y-1">
                  {groupedConversations.yesterday.map((conv) => (
                    <HistoryItem
                      key={conv.id}
                      conversation={conv}
                      isActive={currentConversationId === conv.id}
                      onClick={() => onConversationSelect(conv)}
                      onDelete={(e) => handleDeleteConversation(conv.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 过去7天 */}
            {groupedConversations.past7Days.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  过去 7 天
                </h3>
                <div className="space-y-1">
                  {groupedConversations.past7Days.map((conv) => (
                    <HistoryItem
                      key={conv.id}
                      conversation={conv}
                      isActive={currentConversationId === conv.id}
                      onClick={() => onConversationSelect(conv)}
                      onDelete={(e) => handleDeleteConversation(conv.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!loading && conversations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">暂无历史记录</p>
                <p className="text-xs mt-1">开始新对话吧</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* 底部操作 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          onClick={handleClearHistory}
          variant="ghost"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          disabled={conversations.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          清空全部历史
        </Button>
      </div>
    </div>
  );
}

// 历史记录项组件
function HistoryItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`group relative rounded-lg transition-all ${
        isActive
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
      }`}
    >
      <button
        onClick={onClick}
        className="w-full text-left p-3"
      >
        <div className="flex items-start gap-3">
          {/* 类别图标 */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{
              backgroundColor: isActive ? conversation.categoryColor : 'transparent',
            }}
          >
            {conversation.categoryIcon}
          </div>

          {/* 标题和预览 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium truncate">{conversation.title}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate line-clamp-2">
              {conversation.messages.length > 0
                ? conversation.messages[conversation.messages.length - 1]?.content
                : '新对话'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
            </p>
          </div>

          {/* 消息数量 */}
          <div className="flex-shrink-0 text-xs text-slate-400">
            {conversation.messages.length}
          </div>
        </div>
      </button>

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
        title="删除对话"
      >
        <Trash2 className="w-3 h-3 text-red-500" />
      </button>
    </div>
  );
}
