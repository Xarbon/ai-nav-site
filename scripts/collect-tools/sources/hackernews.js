/**
 * Hacker News 数据源
 * 从 Firebase API 扫描热门帖子中的 AI 工具链接
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const HN_FIREBASE = 'https://hacker-news.firebaseio.com/v0';
const TOP_STORIES_URL = `${HN_FIREBASE}/topstories.json`;
const BEST_STORIES_URL = `${HN_FIREBASE}/beststories.json`;
const ITEM_URL = (id) => `${HN_FIREBASE}/item/${id}.json`;

// AI-related keywords to filter posts
const AI_KEYWORDS = [
  'ai', 'gpt', 'llm', 'chatgpt', 'openai', 'anthropic', 'claude',
  'machine learning', 'deep learning', 'neural', 'transformer',
  'diffusion', 'stable diffusion', 'midjourney', 'dall-e', 'dalle',
  'copilot', 'gemini', 'perplexity', 'mistral', 'ollama',
  'hugging face', 'langchain', 'rag', 'agent', 'multimodal',
  'text-to-image', 'image generation', 'voice cloning', 'tts',
  'whisper', 'sora', 'runway', 'elevenlabs', 'character ai',
  'ai tool', 'ai app', 'ai startup', 'ai product',
];

function isAIPost(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw));
}

// Filter for actual tool/product URLs (not articles)
function isToolURL(url) {
  if (!url) return false;
  const exclude = [
    'github.com', 'arxiv.org', 'news.ycombinator.com',
    'techcrunch.com', 'theverge.com', 'wired.com',
    'medium.com', 'reddit.com', 'youtube.com',
    'wikipedia.org', 'nytimes.com', 'bbc.com',
    'cnn.com', 'reuters.com', 'bloomberg.com',
  ];
  return !exclude.some(d => url.includes(d));
}

export async function collectFromHackerNews() {
  const tools = [];

  // Get top stories
  let storyIds = [];
  try {
    const resp = await fetch(TOP_STORIES_URL);
    storyIds = await resp.json();
    storyIds = storyIds.slice(0, 100); // limit to top 100
  } catch (error) {
    log(`  ⚠️  HN top stories 获取失败: ${error.message}`, LogLevels.WARNING);
    return tools;
  }

  // Also get best stories
  try {
    const resp = await fetch(BEST_STORIES_URL);
    const bestIds = await resp.json();
    const bestSubset = bestIds.slice(0, 50);
    // Merge with top stories, avoid duplicates
    for (const id of bestSubset) {
      if (!storyIds.includes(id)) {
        storyIds.push(id);
      }
    }
  } catch (error) {
    log(`  ️  HN best stories 获取失败: ${error.message}`, LogLevels.WARNING);
  }

  // Fetch details for each story
  const fetchPromises = storyIds.map(id =>
    fetch(ITEM_URL(id)).then(r => r.json()).catch(() => null)
  );

  const items = await Promise.all(fetchPromises);

  for (const item of items) {
    if (!item || !item.title || !item.url || item.type !== 'story') continue;

    // Only include AI-related posts
    if (!isAIPost(item.title)) continue;

    // Only include tool/product URLs (not articles/blog posts)
    if (!isToolURL(item.url)) continue;

    // Skip if score is too low
    if (item.score < 10) continue;

    // Extract tool name from URL hostname
    let toolName = '';
    try {
      const urlObj = new URL(item.url);
      toolName = urlObj.hostname.replace('www.', '').replace('.com', '').replace('.io', '').replace('.ai', '');
      // Capitalize first letter
      toolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
    } catch {
      continue;
    }

    tools.push({
      name: item.title,
      name_en: item.title,
      url: item.url,
      description: item.title,
      description_en: item.title,
      source: 'hackernews',
      source_url: `https://news.ycombinator.com/item?id=${item.id}`,
      category: 'general',
      pricing: 'Unknown',
      status: 'active',
      locale: 'en',
      score: item.score || 0,
      slug: toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    });
  }

  log(`  🔍 HN 过滤后: ${tools.length} 个 AI 工具帖子`, LogLevels.INFO);
  return tools;
}
