// 简单的内存缓存实现
interface CacheEntry<T> {
  value: T
  expires: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultMaxAge: number

  constructor(maxAge: number = 5 * 60 * 1000) {
    this.defaultMaxAge = maxAge
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const maxAge = ttl || this.defaultMaxAge
    this.cache.set(key, {
      value,
      expires: Date.now() + maxAge,
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

// 创建缓存实例
export const novelCache = new SimpleCache(5 * 60 * 1000)

// 缓存键生成器
export function createCacheKey(...parts: string[]): string {
  return parts.join(":")
}

// 项目缓存
export const projectCache = {
  get: <T>(key: string): T | null => {
    return novelCache.get<T>(key)
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
    return Promise.resolve(cached)
  }

  return fetcher().then((result) => {
    projectCache.set(key, result, ttl)
    return result
  })
}
