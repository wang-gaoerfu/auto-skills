'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, Mic, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { CategorySelector } from './CategorySelector';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

// 简单的 Markdown 解析器
const parseMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text;

  // 转义 HTML 特殊字符
  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');

  // 标题 (H1-H6)
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // 删除线
  html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');

  // 代码块
  html = html.replace(/```(\w*)([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

  // 行内代码
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 分隔线
  html = html.replace(/^---$/gim, '<hr>');

  // 无序列表
  html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');

  // 有序列表
  html = html.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');

  // 合并相邻的列表
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');

  // 换行
  html = html.replace(/\n/gim, '<br>');

  return html;
};

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();

  // 当前选中的类别
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('coaching');
  const [sessionId, setSessionId] = useState<string | undefined>();

  useEffect(() => {
    setMounted(true);
    // 检查是否已登录
    if (!apiClient.getToken() && typeof window !== 'undefined') {
      // 未登录，可以重定向到登录页或显示提示
      // window.location.href = '/auth';
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMarkdown = (content: string) => {
    const htmlContent = parseMarkdown(content);
    return (
      <div
        className="markdown-content prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 检查登录状态
    if (!apiClient.getToken()) {
      toast({
        title: '请先登录',
        description: '您需要登录后才能使用聊天功能',
        variant: 'destructive',
      });
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 添加空的助手消息用于流式更新
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let assistantMessage = '';

      // 使用流式 API
      for await (const chunk of apiClient.chatStream(userMessage, selectedCategoryId, sessionId)) {
        // 处理不同格式的响应
        if (chunk.content) {
          assistantMessage += chunk.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
            };
            return newMessages;
          });
        }

        // 更新 session_id
        if (chunk.session_id) {
          setSessionId(chunk.session_id);
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: '发送失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });

      // 移除空的助手消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
      {/* 消息区域 */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                  <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-white/20 flex items-center justify-center">
                    <Bot className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    欢迎使用 Spark
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                    我是您的专业 AI 助手，随时为您提供帮助。
                    <br />
                    <span className="text-blue-600 dark:text-blue-400">有什么我可以帮助您的吗？</span>
                  </p>
                </div>

                {/* 快速提问建议 */}
                <div className="max-w-md mx-auto">
                  <p className="text-sm text-slate-500 mb-3">您可以尝试问：</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      '什么是GROW模型？',
                      '如何进行360度评估？',
                      '教练技术的核心要素是什么？',
                    ].map((question) => (
                      <button
                        key={question}
                        onClick={() => setInput(question)}
                        className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {renderMarkdown(message.content)}
                </div>
                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages.length > 0 && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            {/* 附件按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-10 w-10 rounded-full"
              title="附件功能即将上线"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            {/* 语音按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-10 w-10 rounded-full"
              title="语音功能即将上线"
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* 输入框 */}
            <div className="flex-1 relative">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入您的问题..."
                disabled={isLoading}
                className="min-h-[44px] py-3 px-4 rounded-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500"
              />
            </div>

            {/* 发送按钮 */}
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <Sparkles className="w-5 h-5 animate-pulse" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Markdown 样式 */}
      <style jsx global>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .markdown-content h1 {
          font-size: 1.5rem;
        }

        .markdown-content h2 {
          font-size: 1.25rem;
        }

        .markdown-content h3 {
          font-size: 1.125rem;
        }

        .markdown-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .markdown-content li {
          margin-bottom: 0.25rem;
        }

        .markdown-content code {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          background-color: rgba(0, 0, 0, 0.05);
        }

        .dark .markdown-content code {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .dark .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          border: none;
        }

        .markdown-content blockquote {
          border-left: 3px solid rgba(59, 130, 246, 0.5);
          padding-left: 0.75rem;
          margin-bottom: 0.75rem;
          opacity: 0.9;
          font-style: italic;
        }

        .markdown-content a {
          text-decoration: underline;
          color: #2563eb;
        }

        .dark .markdown-content a {
          color: #60a5fa;
        }

        .markdown-content strong {
          font-weight: bold;
        }

        .markdown-content em {
          font-style: italic;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 1rem 0;
        }

        .dark .markdown-content hr {
          border-top-color: rgba(255, 255, 255, 0.1);
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
