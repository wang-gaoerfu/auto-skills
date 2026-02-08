'use client';

import { useState } from 'react';
import { MessageSquare, Search, Filter, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conversation } from '@/lib/types';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'GROW模型教练对话',
      category: 'coaching',
      categoryIcon: '🎯',
      categoryColor: '#4A90E2',
      messages: [
        { role: 'user', content: '什么是GROW模型？', timestamp: '2025-01-15T10:30:00Z' },
        {
          role: 'assistant',
          content: 'GROW模型是教练技术中的核心工具...',
          timestamp: '2025-01-15T10:30:05Z',
        },
      ],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:35:00Z',
    },
    {
      id: '2',
      title: '领导力测评问题',
      category: 'leadership',
      categoryIcon: '📊',
      categoryColor: '#50E3C2',
      messages: [
        { role: 'user', content: '如何进行360度评估？', timestamp: '2025-01-14T15:20:00Z' },
        {
          role: 'assistant',
          content: '360度评估是一种全方位的反馈机制...',
          timestamp: '2025-01-14T15:20:05Z',
        },
      ],
      createdAt: '2025-01-14T15:20:00Z',
      updatedAt: '2025-01-14T15:25:00Z',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个对话记录吗？')) {
      setConversations(conversations.filter((conv) => conv.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">对话记录</h2>
          <p className="text-slate-500 dark:text-slate-400">查看和管理用户对话历史</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">总对话数</p>
              <p className="text-2xl font-bold mt-1">1,234</p>
            </div>
            <MessageSquare className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">今日对话</p>
              <p className="text-2xl font-bold mt-1">56</p>
            </div>
            <MessageSquare className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">活跃用户</p>
              <p className="text-2xl font-bold mt-1">89</p>
            </div>
            <MessageSquare className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      {/* 对话列表 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>对话标题</TableHead>
              <TableHead>类别</TableHead>
              <TableHead>消息数</TableHead>
              <TableHead>最后更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell className="font-medium">{conv.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {conv.categoryIcon} {conv.category}
                  </Badge>
                </TableCell>
                <TableCell>{conv.messages.length}</TableCell>
                <TableCell className="text-slate-500">
                  {new Date(conv.updatedAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(conv.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 对话详情对话框 */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedConversation?.title}</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <Badge variant="outline">
                  {selectedConversation.categoryIcon} {selectedConversation.category}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {selectedConversation?.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp || '').toLocaleTimeString('zh-CN')}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                      👤
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
