// Cloudflare Cache API 缓存层
// 用于缓存 D1 查询结果，减少数据库访问延迟

const CACHE_PREFIX = 'd1-query-cache-v2';

export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  try {
    const cache = (caches as any).default;
    const url = new URL(`https://internal.cache/${CACHE_PREFIX}/${cacheKey}`);
    
    // 尝试从缓存读取
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      return data as T;
    }
    
    // Cache miss - 执行查询
    const result = await queryFn();
    
    // 存入缓存
    const response = new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${ttlSeconds}`,
      },
    });
    await cache.put(url, response);
    
    return result;
  } catch (error) {
    // 缓存失败时直接执行查询
    return queryFn();
  }
}
