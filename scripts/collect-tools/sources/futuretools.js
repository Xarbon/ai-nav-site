/**
 * GitHub Awesome Lists 数据源采集器
 * 采集 awesome-ai, awesome-machine-learning 等列表中的 AI 工具
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const AWESOME_LISTS = [
  {
    name: 'awesome-ai-tools',
    url: 'https://raw.githubusercontent.com/ai-boostery/awesome-ai-tools/main/README.md'
  },
  {
    name: 'awesome-chatgpt',
    url: 'https://raw.githubusercontent.com/saharmor/awesome-chatgpt/main/README.md'
  },
  {
    name: 'awesome-ai-agents',
    url: 'https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md'
  }
];

const CATEGORY_MAP = {
  'agent': 'ai-tools',
  'chatbot': 'ai-customer-service',
  'code': 'dev-automation',
  'coding': 'dev-automation',
  'developer': 'dev-automation',
  'design': 'design',
  'image': 'design',
  'video': 'audio-video',
  'audio': 'audio-video',
  'writing': 'content-creation',
  'writing': 'content-creation',
  'marketing': 'marketing',
  'seo': 'marketing',
  'productivity': 'office-productivity',
  'education': 'education',
  'research': 'dev-automation'
};

export async function collectFromFutureTools() {
  log('  开始采集 GitHub Awesome Lists...', LogLevels.DEBUG);
  const allTools = [];
  
  for (const list of AWESOME_LISTS) {
    try {
      log(`  采集列表: ${list.name}`, LogLevels.DEBUG);
      const response = await fetch(list.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        log(`    ⚠️  ${list.name} 返回 ${response.status}`, LogLevels.WARNING);
        continue;
      }
      
      const markdown = await response.text();
      
      // 解析 Markdown 中的工具链接
      // 格式: - [Tool Name](https://example.com) - Description
      // 或: * [Tool Name](https://example.com) - Description
      const toolMatches = markdown.matchAll(/(?:^|\n)[-*]\s*\[([^\]]+)\]\((https?:\/\/[^\)]+)\)(?:\s*[-–—:]\s*(.*))?/g);
      
      for (const match of toolMatches) {
        const name = match[1].trim();
        const url = match[2].trim();
        const description = (match[3] || '').trim().slice(0, 200);
        
        // 过滤无效条目
        if (!name || name.length < 2 || name.length > 100) continue;
        if (!url || url.includes('github.com') || url.includes('twitter.com') || url.includes('x.com')) continue;
        
        // 从名称和描述推断分类
        const category = inferCategory(name, description, list.name);
        
        allTools.push({
          name,
          url,
          description,
          category,
          tags: [list.name, 'github-awesome'],
          source: 'github-awesome'
        });
      }
      
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      log(`  ⚠️  ${list.name} 采集失败: ${error.message}`, LogLevels.WARNING);
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
  
  log(`  ✅ GitHub Awesome Lists: 采集到 ${unique.length} 个工具`, LogLevels.SUCCESS);
  return unique;
}

function inferCategory(name, description, listName) {
  const text = `${name} ${description}`.toLowerCase();
  
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return category;
  }
  
  // 根据列表名称推断
  if (listName.includes('chatgpt')) return 'ai-customer-service';
  if (listName.includes('agent')) return 'ai-tools';
  
  return 'ai-tools';
}
