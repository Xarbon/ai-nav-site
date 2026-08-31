/**
 * Toolify.ai 数据源采集器
 * https://www.toolify.ai/
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

export async function collectFromToolify() {
  log('  开始采集 Toolify.ai...', LogLevels.DEBUG);
  const tools = [];
  
  try {
    // Toolify.ai 有公开的 API 接口
    const response = await fetch('https://www.toolify.ai/api/tools?page=1&limit=50', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Toolify API 返回 ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.data || data.tools || data || [];
    
    for (const item of items) {
      if (!item.name || !item.website) continue;
      
      tools.push({
        name: item.name,
        url: item.website || item.url,
        description: item.description || item.tagline || '',
        category: mapCategory(item.category || item.categoryName),
        tags: [
          ...(Array.isArray(item.tags) ? item.tags : []),
          'toolify',
          item.category || 'ai-tools'
        ].filter(Boolean),
        source: 'toolify',
        visits: item.visits || item.monthlyVisits,
        rating: item.rating
      });
    }
    
    log(`  ✅ Toolify.ai: 采集到 ${tools.length} 个工具`, LogLevels.SUCCESS);
    
  } catch (error) {
    log(`  ⚠️  Toolify.ai 采集失败: ${error.message}`, LogLevels.WARNING);
  }
  
  return tools;
}

function mapCategory(cat) {
  const map = {
    'writing': 'content-creation',
    'design': 'design',
    'marketing': 'marketing',
    'productivity': 'office-productivity',
    'developer': 'dev-automation',
    'education': 'education',
    'video': 'audio-video',
    'audio': 'audio-video',
    'image': 'design',
    'code': 'dev-automation',
    'ecommerce': 'ecommerce',
    'business': 'office-productivity'
  };
  return map[cat?.toLowerCase()] || 'ai-tools';
}
