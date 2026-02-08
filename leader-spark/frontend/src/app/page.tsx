'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
  html = html.replace(/___(.*?)___/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

  // 删除线
  html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>');

  // 代码块
  html = html.replace(/```(\w*)([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

  // 行内代码
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" />');

  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 分隔线
  html = html.replace(/^---$/gim, '<hr>');
  html = html.replace(/^\*\*\*$/gim, '<hr>');

  // 无序列表
  html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\+ (.*$)/gim, '<ul><li>$1</li></ul>');

  // 有序列表
  html = html.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');

  // 合并相邻的列表
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');

  // 换行
  html = html.replace(/\n/gim, '<br>');

  return html;
};

export default function LeadershipCoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMarkdown = (content: string, isUser: boolean) => {
    const htmlContent = parseMarkdown(content);
    return (
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          color: isUser ? 'white' : undefined,
        }}
      />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]' || data === 'event: message') continue;

              try {
                const parsed = JSON.parse(data);
                // 处理两种可能的格式
                if (parsed.content && parsed.content.answer) {
                  assistantMessage += parsed.content.answer;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Skip parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发生了错误。请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 transition-colors duration-300">
      {/* 顶部导航栏 */}
      <header className="absolute top-0 left-0 right-0 z-10 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-white/80 dark:from-slate-900/80 to-transparent backdrop-blur-sm border-b border-slate-200/50 dark:border-white/10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x"></div>
            <div className="relative w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center transition-colors duration-300">
              <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          {/* 标题 */}
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              领导力教练
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 transition-colors duration-300">
              Professional Leadership Coaching
            </p>
          </div>
        </div>

        {/* 右侧控件 */}
        <div className="flex items-center gap-6">
          {/* 主题切换按钮 */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-200 dark:border-white/10"
            aria-label="切换主题"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* 状态指示器 */}
          <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-500 text-sm transition-colors duration-300">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>在线</span>
          </div>
        </div>
      </header>

      {/* 主聊天区域 */}
      <main className="h-full w-full pt-24 pb-4 px-4 md:px-8 flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto w-full bg-white dark:bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-white/20 flex items-center justify-center transition-colors duration-300">
                      <Bot className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">
                      欢迎使用领导力教练
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base max-w-md mx-auto leading-relaxed transition-colors duration-300">
                      我是您的专业领导力教练，专注于帮助您提升领导技能、优化团队管理、实现个人成长。
                      <br />
                      <br />
                      <span className="text-blue-600 dark:text-blue-400">有什么我可以帮助您的吗？</span>
                    </p>
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
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 transition-colors duration-300'
                    }`}
                  >
                    {renderMarkdown(message.content, message.role === 'user')}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 transition-colors duration-300">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100" />
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <form onSubmit={handleSubmit} className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm transition-colors duration-300">
            <div className="flex gap-4 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入您的问题，开始对话..."
                disabled={isLoading}
                className="flex-1 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 disabled:opacity-50 text-base transition-all duration-300"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 text-base hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5" />
                发送
              </button>
            </div>
          </form>
        </div>

        {/* 底部信息 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500 transition-colors duration-300">
            领导力教练 · 专业咨询 · 持续成长 · Powered by AI
          </p>
        </div>
      </main>

      {/* 背景装饰 */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-colors duration-300"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none transition-colors duration-300"></div>

      {/* Markdown 样式 */}
      <style jsx global>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .markdown-content h1 {
          font-size: 1.5rem;
        }

        .markdown-content h2 {
          font-size: 1.375rem;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
        }

        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-size: 1.125rem;
        }

        .markdown-content p {
          margin-bottom: 0.875rem;
          line-height: 1.7;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-left: 1.75rem;
          margin-bottom: 0.875rem;
        }

        .markdown-content li {
          margin-bottom: 0.375rem;
          line-height: 1.7;
        }

        .markdown-content code {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Droid Sans Mono',
            'Source Code Pro', monospace;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background-color: rgba(0, 0, 0, 0.05);
        }

        @media (prefers-color-scheme: dark) {
          .markdown-content code {
            background-color: rgba(255, 255, 255, 0.1);
          }
        }

        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin-bottom: 0.875rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        @media (prefers-color-scheme: dark) {
          .markdown-content pre {
            background-color: rgba(0, 0, 0, 0.2);
            border-color: rgba(255, 255, 255, 0.1);
          }
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          border: none;
        }

        .markdown-content blockquote {
          border-left: 4px solid rgba(59, 130, 246, 0.5);
          padding-left: 1rem;
          margin-bottom: 0.875rem;
          opacity: 0.9;
          font-style: italic;
          background-color: rgba(59, 130, 246, 0.05);
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .markdown-content a {
          text-decoration: underline;
          color: #2563eb;
        }

        @media (prefers-color-scheme: dark) {
          .markdown-content a {
            color: #60a5fa;
          }
        }

        .markdown-content a:hover {
          color: #1d4ed8;
        }

        @media (prefers-color-scheme: dark) {
          .markdown-content a:hover {
            color: #93c5fd;
          }
        }

        .markdown-content strong {
          font-weight: bold;
        }

        .markdown-content em {
          font-style: italic;
        }

        .markdown-content del {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 1.5rem 0;
        }

        @media (prefers-color-scheme: dark) {
          .markdown-content hr {
            border-top-color: rgba(255, 255, 255, 0.2);
          }
        }

        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  );
}
