/**
 * FutureTools 数据源采集器
 * https://futuretools.io/
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

export async function collectFromFutureTools() {
  log('  开始采集 FutureTools...', LogLevels.DEBUG);
  const tools = [];
  
  try {
    // 采集最新 AI 工具
    const response = await fetch('https://futuretools.io/wp-json/wp/v2/posts?per_page=50&page=1&_fields=title,link,excerpt,categories', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`FutureTools API 返回 ${response.status}`);
    }
    
    const data = await response.json();
    
    for (const item of data) {
      if (!item.title?.rendered || !item.link) continue;
      
      // 从标题中提取工具名称
      const title = item.title.rendered.replace(/&#[0-9]+;/g, '').trim();
      
      // 从摘要中提取描述
      const description = item.excerpt?.rendered
        ?.replace(/<[^>]+>/g, '')
        ?.replace(/&nbsp;/g, ' ')
        ?.trim()
        ?.slice(0, 200) || '';
      
      tools.push({
        name: title,
        url: item.link,
        description: description,
        category: 'ai-tools',
        tags: ['futuretools'],
        source: 'futuretools'
      });
    }
    
    log(`  ✅ FutureTools: 采集到 ${tools.length} 个工具`, LogLevels.SUCCESS);
    
  } catch (error) {
    log(`  ⚠️  FutureTools 采集失败: ${error.message}`, LogLevels.WARNING);
  }
  
  return tools;
}
