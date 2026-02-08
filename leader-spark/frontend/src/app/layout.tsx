import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { ThemeProvider } from 'next-themes';
import { ToastToaster } from '@/components/ui/toast-toaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Spark - AI 智能知识库系统',
    template: '%s | Spark',
  },
  description: '基于 AI 的多分类智能知识库问答系统',
  keywords: ['AI', '知识库', '智能问答', '教练技术', '领导力'],
  authors: [{ name: 'Spark Team' }],
  generator: 'Next.js',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {isDev && <Inspector />}
          <ToastToaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
