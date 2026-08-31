import { getCloudflareContext } from '@opennextjs/cloudflare';

// 获取 D1 数据库实例
export function getDB(): any {
  const context: any = getCloudflareContext();
  const db = context.env?.DB;
  if (!db) {
    throw new Error('D1 database binding not found. Make sure DB is configured in wrangler.toml');
  }
  return db;
}
