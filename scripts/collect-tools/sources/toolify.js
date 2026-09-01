/**
 * aitools.fyi 数据源采集器
 * https://aitools.fyi/ - 大型 AI 工具导航站 (SSR 站点，数据在 __NEXT_DATA__ 中)
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const PAGES = [
  { url: 'https://aitools.fyi/', label: '首页推荐' },
  { url: 'https://aitools.fyi/recently-added', label: '最近添加' },
  { url: 'https://aitools.fyi/trending', label: '热门趋势' }
];

const CATEGORY_MAP = {
  'analytics': 'office-productivity',
  'hosting': 'dev-automation',
  'agents': 'ai-tools',
  'sales': 'marketing',
  'marketing': 'marketing',
  'writing': 'content-creation',
  'design': 'design',
  'image': 'design',
  'video': 'audio-video',
  'audio': 'audio-video',
  'productivity': 'office-productivity',
  'developer-tools': 'dev-automation',
  'coding': 'dev-automation',
  'education': 'education',
  'chatbot': 'ai-customer-service',
  'customer-service': 'ai-customer-service',
  'seo': 'marketing',
  'ecommerce': 'ecommerce'
};

export async function collectFromToolify() {
  log('  开始采集 aitools.fyi...', LogLevels.DEBUG);
  const allTools = [];
  
  for (const page of PAGES) {
    try {
      log(`  采集页面: ${page.label} (${page.url})`, LogLevels.DEBUG);
      const response = await fetch(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      if (!response.ok) {
        log(`    ⚠️  ${page.url} 返回 ${response.status}`, LogLevels.WARNING);
        continue;
      }
      
      const html = await response.text();
      
      // 从 __NEXT_DATA__ 提取 JSON 数据
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch) {
        try {
          const jsonData = JSON.parse(nextDataMatch[1]);
          const pageProps = jsonData?.props?.pageProps;
          
          // 提取工具列表（不同页面结构可能不同）
          const toolsList = pageProps?.tools || pageProps?.data || pageProps?.featuredTools || [];
          
          for (const tool of toolsList) {
            if (!tool.name || !tool.website) continue;
            
            const categorySlug = tool.category?.slug || '';
            allTools.push({
              name: tool.name,
              url: tool.website,
              description: tool.description || '',
              category: CATEGORY_MAP[categorySlug] || mapCategoryBySlug(categorySlug),
              tags: [
                categorySlug,
                tool.category?.name || '',
                'aitools-fyi'
              ].filter(Boolean),
              source: 'aitools-fyi',
              pricing_model: tool.pricingType || '',
              votes: tool.totalUpvotes || 0
            });
          }
        } catch (parseError) {
          log(`    ⚠️  JSON 解析失败: ${parseError.message}`, LogLevels.WARNING);
        }
      }
      
      // 也尝试正则提取（备用方案）
      const toolMatches = html.matchAll(/"id":\d+,"name":"([^"]+)","slug":"([^"]+)","website":"([^"]+)"/g);
      for (const match of toolMatches) {
        const name = match[1];
        const website = match[3];
        if (name && website) {
          // 提取描述
          const descRegex = new RegExp(`"name":"${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?"description":"([^"]*)"`, 'i');
          const descMatch = html.match(descRegex);
          const description = descMatch ? descMatch[1] : '';
          
          // 提取分类
          const catRegex = new RegExp(`"name":"${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?"category":\\{[^}]*"slug":"([^"]*)"`, 'i');
          const catMatch = html.match(catRegex);
          const categorySlug = catMatch ? catMatch[1] : '';
          
          // 提取定价
          const priceRegex = new RegExp(`"name":"${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?"pricingType":"([^"]*)"`, 'i');
          const priceMatch = html.match(priceRegex);
          
          allTools.push({
            name,
            url: website,
            description,
            category: CATEGORY_MAP[categorySlug] || mapCategoryBySlug(categorySlug),
            tags: [categorySlug, 'aitools-fyi'].filter(Boolean),
            source: 'aitools-fyi',
            pricing_model: priceMatch ? priceMatch[1] : ''
          });
        }
      }
      
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      log(`  ⚠️  aitools.fyi 采集失败: ${error.message}`, LogLevels.WARNING);
    }
  }
  
  // 按 URL 去重
  const seen = new Set();
  const unique = allTools.filter(t => {
    const normalized = t.url?.replace(/\/$/, '').toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  
  log(`  ✅ aitools.fyi: 采集到 ${unique.length} 个工具`, LogLevels.SUCCESS);
  return unique;
}

function mapCategoryBySlug(slug) {
  if (!slug) return 'ai-tools';
  const lower = slug.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'ai-tools';
}
