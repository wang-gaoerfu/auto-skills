import type { NextApiRequest } from "next"

// 性能监控
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 记录指标
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  // 获取平均响应时间
  getAverageResponseTime(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // 获取慢请求数量
  getSlowRequests(name: string, threshold: number = 1000): number {
    const values = this.metrics.get(name)
    if (!values) return 0
    return values.filter((v) => v > threshold).length
  }
}

// API 响应时间中间件
export function withPerformanceMonitoring(
  handler: (req: NextApiRequest) => Promise<Response>
) {
  return async (req: NextApiRequest) => {
    const start = Date.now()
    const path = req.url || "unknown"

    try {
      const response = await handler(req)
      const duration = Date.now() - start

      PerformanceMonitor.getInstance().recordMetric(`api:${path}`, duration)

      // 慢请求警告
      if (duration > 1000) {
        console.warn(`慢请求警告: ${path} 耗时 ${duration}ms`)
      }

      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(`API 错误: ${path}`, error)
      throw error
    }
  }
}

// 日志工具
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || "")
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || "")
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || "")
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || "")
    }
  },
}
