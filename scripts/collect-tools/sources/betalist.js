/**
 * BetaList 数据源
 * 从 BetaList RSS Feed 获取新上线的 AI 工具/产品
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const BETALIST_RSS = 'https://betalist.com/feed';
const AI_KEYWORDS = ['ai', 'artificial intelligence', 'gpt', 'llm', 'chatbot', 'machine learning', 'generative', 'automation'];

function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    const title = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '';
    const link = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || '';
    const pubDate = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    const description = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] || '';
    
    if (title && link) {
      items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), description: description.trim() });
    }
  }
  
  return items;
}

export async function collectFromBetaList() {
  const tools = [];

  try {
    const resp = await fetch(BETALIST_RSS, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIQuryBot/1.0)' }
    });

    if (!resp.ok) {
      log(`  ⚠️  BetaList RSS 请求失败: ${resp.status}`, LogLevels.WARNING);
      return tools;
    }

    const xmlText = await resp.text();
    const items = parseRSS(xmlText);
    log(`  📋 BetaList RSS 获取 ${items.length} 个项目`, LogLevels.INFO);

    for (const item of items) {
      const lower = (item.title + ' ' + item.description).toLowerCase();
      const isAI = AI_KEYWORDS.some(kw => lower.includes(kw));
      if (!isAI) continue;

      let toolName = '';
      try {
        const urlObj = new URL(item.link);
        const hostname = urlObj.hostname.replace('www.', '').replace('betalist.com', '');
        if (!hostname || hostname === '/' || hostname === '') continue;
        toolName = hostname.replace(/\.(com|io|ai|co|org|net|app)$/i, '')
          .replace(/^[a-z]{2}\./, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      } catch {
        continue;
      }

      tools.push({
        name: item.title,
        name_en: item.title,
        url: item.link,
        description: item.description.replace(/<[^>]+>/g, '').slice(0, 200),
        description_en: item.description.replace(/<[^>]+>/g, '').slice(0, 200),
        source: 'betalist',
        source_url: BETALIST_RSS,
        category: 'general',
        pricing: 'Unknown',
        status: 'active',
        locale: 'en',
        slug: toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      });
    }

    log(`  🔍 BetaList 过滤后: ${tools.length} 个 AI 相关项目`, LogLevels.INFO);
  } catch (error) {
    log(`  ⚠️  BetaList 采集失败: ${error.message}`, LogLevels.WARNING);
  }

  return tools;
}
