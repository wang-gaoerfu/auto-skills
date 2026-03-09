import { cache } from "react"

// 创建缓存实例
export const novelCache = cache.createCache({
  maxAge: 5 * 60 * 1000, // 5分钟
})

// 缓存键生成器
export function createCacheKey(...parts: string[]): string {
  return parts.join(":")
}

// 项目缓存
export const projectCache = {
  get: <T>(key: string): T | null => {
    return novelCache.get(key) as T | null
  },

  set: <T>(key: string, value: T, ttl?: number): void => {
    novelCache.set(key, value, ttl)
  },

  delete: (key: string): void => {
    novelCache.delete(key)
  },

  clear: (): void => {
    novelCache.clear()
  },
}

// 缓存装饰器
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = projectCache.get<T>(key)
  if (cached) {
    return cached
  }

  return fetcher().then((result) => {
    projectCache.set(key, result, ttl)
    return result
  })
}
