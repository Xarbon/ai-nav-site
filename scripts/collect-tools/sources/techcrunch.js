/**
 * TechCrunch AI 数据源
 * 从 TechCrunch AI 分类的 RSS Feed 提取 AI 工具
 * 使用简单正则解析 XML，避免额外依赖
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const TECHCRUNCH_AI_RSS = 'https://techcrunch.com/category/artificial-intelligence/feed/';

const TOOL_KEYWORDS = [
  'launch', 'release', 'announce', 'introduce', 'debut',
  'startup', 'raises', 'funding', 'series', 'seed',
  'platform', 'app', 'tool', 'software', 'service',
  'chatbot', 'assistant', 'agent', 'copilot', 'generator',
  'api', 'sdk', 'model', 'gpt', 'llm',
];

function extractToolInfo(title, url) {
  if (!title || !url) return null;
  
  const lower = title.toLowerCase();
  const isToolPost = TOOL_KEYWORDS.some(kw => lower.includes(kw));
  if (!isToolPost) return null;

  let toolName = '';
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    if (hostname.includes('techcrunch')) return null;
    toolName = hostname
      .replace(/\.(com|io|ai|co|org|net|app)$/i, '')
      .replace(/^[a-z]{2}\./, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return null;
  }

  return { toolName, url, title };
}

// Simple RSS XML parser using regex
function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    const title = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '';
    const link = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || '';
    const pubDate = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    
    if (title && link) {
      items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim() });
    }
  }
  
  return items;
}

export async function collectFromTechCrunch() {
  const tools = [];

  try {
    const resp = await fetch(TECHCRUNCH_AI_RSS, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIQuryBot/1.0)' }
    });
    
    if (!resp.ok) {
      log(`  ️  TechCrunch RSS 请求失败: ${resp.status}`, LogLevels.WARNING);
      return tools;
    }

    const xmlText = await resp.text();
    const items = parseRSS(xmlText);
    log(`  📰 TechCrunch RSS 获取 ${items.length} 篇文章`, LogLevels.INFO);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const item of items) {
      if (item.pubDate) {
        const pubDate = new Date(item.pubDate);
        if (pubDate < sevenDaysAgo) continue;
      }

      const info = extractToolInfo(item.title, item.link);
      if (!info) continue;

      tools.push({
        name: info.title,
        name_en: info.title,
        url: info.url,
        description: item.title,
        description_en: item.title,
        source: 'techcrunch',
        source_url: TECHCRUNCH_AI_RSS,
        category: 'general',
        pricing: 'Unknown',
        status: 'active',
        locale: 'en',
        slug: info.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      });
    }

    log(`  🔍 TechCrunch 过滤后: ${tools.length} 个工具相关帖子`, LogLevels.INFO);
  } catch (error) {
    log(`  ⚠️  TechCrunch 采集失败: ${error.message}`, LogLevels.WARNING);
  }

  return tools;
}
