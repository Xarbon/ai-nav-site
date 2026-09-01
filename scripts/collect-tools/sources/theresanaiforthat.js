/**
 * AI 工具集 数据源采集器
 * https://ai-bot.cn/ - 中文 AI 工具导航站
 * 
 * HTML 结构：<a href="..." class="card no-c is-views mb-4 site-XXX" data-id="XXX" data-url="..." title="描述">
 * 工具名称在 <h2 class="card-title"> 或类似结构中
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const AI_BOT_CATEGORIES = [
  'ai-writing-tools',
  'ai-image-tools',
  'ai-video-tools',
  'ai-office-tools',
  'ai-chatbots',
  'ai-programming-tools',
  'ai-design-tools',
  'ai-audio-tools',
  'ai-search-engines',
  'ai-frameworks'
];

const CATEGORY_MAP = {
  'ai-writing-tools': 'content-creation',
  'ai-image-tools': 'design',
  'ai-video-tools': 'audio-video',
  'ai-office-tools': 'office-productivity',
  'ai-chatbots': 'ai-customer-service',
  'ai-programming-tools': 'dev-automation',
  'ai-design-tools': 'design',
  'ai-audio-tools': 'audio-video',
  'ai-search-engines': 'ai-tools',
  'ai-frameworks': 'dev-automation'
};

export async function collectFromTAAFT() {
  log('  开始采集 ai-bot.cn...', LogLevels.DEBUG);
  const allTools = [];
  
  for (const category of AI_BOT_CATEGORIES.slice(0, 6)) {
    try {
      log(`  采集分类: ${category}`, LogLevels.DEBUG);
      const response = await fetch(`https://ai-bot.cn/favorites/${category}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      
      if (!response.ok) {
        log(`    ⚠️  ${category} 返回 ${response.status}`, LogLevels.WARNING);
        continue;
      }
      
      const html = await response.text();
      
      // 提取工具卡片 - ai-bot.cn 使用 <a class="card"> 结构
      // 匹配: <a href="..." data-id="XXX" data-url="..." title="描述" class="card ...">
      const cardMatches = html.matchAll(/<a[^>]*class="card[^"]*"[^>]*href="(https?:\/\/[^"]+)"[^>]*data-id="(\d+)"[^>]*title="([^"]*)"[^>]*>/gi);
      
      for (const match of cardMatches) {
        const url = match[1];
        const dataId = match[2];
        const title = match[3].trim();
        
        // 过滤掉 ai-bot.cn 内部链接
        if (url.includes('ai-bot.cn')) continue;
        
        // 提取工具名称 - 通常在 <h2 class="card-title"> 中
        // 查找该 data-id 对应的标题
        const titleRegex = new RegExp(`data-id="${dataId}"[\\s\\S]{0,500}?<h2[^>]*class="[^"]*card-title[^"]*"[^>]*>([^<]+)<\\/h2>`, 'i');
        const titleMatch = html.match(titleRegex);
        const name = titleMatch ? titleMatch[1].trim() : '';
        
        if (name && name.length > 1) {
          allTools.push({
            name,
            url,
            description: title,
            category: CATEGORY_MAP[category] || 'ai-tools',
            tags: [category, 'ai-bot-cn'],
            source: 'ai-bot-cn'
          });
        }
      }
      
      // 等待避免频率限制
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      log(`  ⚠️  ai-bot.cn ${category} 采集失败: ${error.message}`, LogLevels.WARNING);
    }
  }
  
  // 去重
  const seen = new Set();
  const unique = allTools.filter(t => {
    const normalized = t.url?.replace(/\/$/, '').toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  
  log(`  ✅ ai-bot.cn: 采集到 ${unique.length} 个工具`, LogLevels.SUCCESS);
  return unique;
}
