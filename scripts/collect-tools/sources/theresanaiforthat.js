/**
 * There's An AI For That 数据源采集器
 * https://theresanaiforthat.com/
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

export async function collectFromTAAFT() {
  log('  开始采集 There\'s An AI For That...', LogLevels.DEBUG);
  const tools = [];
  
  try {
    // 采集最新 AI 工具（通过网页 API）
    const response = await fetch('https://theresanaiforthat.com/api/get-list/?offset=0&limit=50&order=6d_saved_count&search=&m=&i=', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TAAFT API 返回 ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.tools || data.data || data || [];
    
    for (const item of items) {
      if (!item.name || !item.link) continue;
      
      tools.push({
        name: item.name,
        url: item.link || item.url || item.website,
        description: item.description || item.tagline || '',
        category: mapCategory(item.category || item.categories),
        tags: [
          ...(Array.isArray(item.tags) ? item.tags : []),
          ...(Array.isArray(item.categories) ? item.categories : []),
          'theresanaiforthat'
        ].filter(Boolean).slice(0, 10),
        source: 'theresanaiforthat',
        saves: item.saves || item.saved_count,
        rating: item.rating
      });
    }
    
    log(`  ✅ TAAFT: 采集到 ${tools.length} 个工具`, LogLevels.SUCCESS);
    
  } catch (error) {
    log(`  ⚠️  TAAFT 采集失败: ${error.message}`, LogLevels.WARNING);
  }
  
  return tools;
}

function mapCategory(cat) {
  if (!cat) return 'ai-tools';
  const catStr = Array.isArray(cat) ? cat[0] : cat;
  const map = {
    'writing': 'content-creation', 'text': 'content-creation',
    'image': 'design', 'design': 'design', 'art': 'design',
    'video': 'audio-video', 'audio': 'audio-video', 'music': 'audio-video',
    'coding': 'dev-automation', 'code': 'dev-automation', 'developer': 'dev-automation',
    'marketing': 'marketing', 'seo': 'marketing', 'social': 'marketing',
    'productivity': 'office-productivity', 'business': 'office-productivity',
    'education': 'education', 'learning': 'education',
    'ecommerce': 'ecommerce', 'shopping': 'ecommerce',
    'chat': 'ai-customer-service', 'chatbot': 'ai-customer-service',
    'healthcare': 'healthcare', 'finance': 'finance-tax'
  };
  return map[catStr?.toLowerCase()] || 'ai-tools';
}
