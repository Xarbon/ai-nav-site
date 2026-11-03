// Cloudflare Cache API 缓存层
// TTL 60 分钟，大幅降低 D1 读取频率
// 关键：Cloudflare Workers 的 Cache API 是全局 CDN 缓存，所有边缘节点共享

const CACHE_PREFIX = 'd1-query-cache-v4';
const DEFAULT_TTL = 3600; // 60 minutes

export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  try {
    const cache = (caches as any).default;
    const url = new URL(`https://internal.cache/${CACHE_PREFIX}/${cacheKey}`);
    
    // 尝试从 CDN 缓存读取（跨所有边缘节点共享）
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      return data as T;
    }
    
    // Cache miss - 执行 D1 查询
    const result = await queryFn();
    
    // 存入 CDN 缓存
    const response = new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`,
      },
    });
    await cache.put(url, response);
    
    return result;
  } catch (error) {
    console.error('[cache] cache error, fallback to direct query:', error);
    try { return await queryFn(); } catch { return null as any; }
  }
}

// 安全缓存查询：即使查询失败也返回空结果，不会抛出错误导致页面崩溃
export async function safeCachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  fallback: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  try {
    const result = await cachedQuery(cacheKey, queryFn, ttlSeconds);
    return result ?? fallback;
  } catch (error) {
    console.error('[safeCache] query failed, using fallback:', error);
    return fallback;
  }
}
