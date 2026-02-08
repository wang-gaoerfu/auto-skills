'use client';

import { useState } from 'react';
import { BarChart3, Users, MessageSquare, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据统计</h2>
          <p className="text-slate-500 dark:text-slate-400">查看系统使用情况和统计数据</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
          >
            本周
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
          >
            本月
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            onClick={() => setPeriod('year')}
          >
            本年
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总对话数</CardTitle>
            <MessageSquare className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% 较上周
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">活跃用户</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.2% 较上周
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">文档处理</CardTitle>
            <FileText className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +23.1% 较上周
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Token 使用</CardTitle>
            <BarChart3 className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5M</div>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
              -3.2% 较上周
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 对话趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>对话趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <BarChart3 className="w-12 h-12 mb-2" />
              <p className="text-sm">图表组件待集成</p>
            </div>
          </CardContent>
        </Card>

        {/* 类别分布 */}
        <Card>
          <CardHeader>
            <CardTitle>类别使用分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: '教练技术', count: 450, percent: 45, color: 'bg-blue-500' },
                { name: '领导力测评', count: 280, percent: 28, color: 'bg-green-500' },
                { name: '团队管理', count: 180, percent: 18, color: 'bg-purple-500' },
                { name: '沟通技巧', count: 90, percent: 9, color: 'bg-orange-500' },
              ].map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-slate-500">{cat.count} 次</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热门问题 */}
        <Card>
          <CardHeader>
            <CardTitle>热门问题</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { question: '什么是GROW模型？', count: 156 },
                { question: '如何进行360度评估？', count: 124 },
                { question: '如何处理团队冲突？', count: 98 },
                { question: '什么是教练技术？', count: 87 },
                { question: '如何提高团队凝聚力？', count: 76 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{item.question}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 活跃时间 */}
        <Card>
          <CardHeader>
            <CardTitle>活跃时段分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                <div key={day} className="text-center">
                  <div className="text-xs text-slate-500 mb-2">{day}</div>
                  <div
                    className="h-20 bg-blue-500 rounded-md"
                    style={{ opacity: 0.3 + Math.random() * 0.7 }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
