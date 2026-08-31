/**
 * GitHub Trending 数据源
 * 采集热门的 AI 开源项目
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const GITHUB_API = 'https://api.github.com';
const AI_LANGUAGES = ['python', 'javascript', 'typescript', 'jupyter-notebook'];

export async function collectFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GitHub token not configured');
  }

  const tools = [];
  
  // 1. 采集热门 AI 仓库
  try {
    log('  采集 GitHub AI 仓库...', LogLevels.DEBUG);
    const repos = await fetchTrendingAIRepos(token);
    tools.push(...repos);
  } catch (error) {
    log(`  ⚠️  GitHub 采集失败: ${error.message}`, LogLevels.WARNING);
  }

  return tools;
}

async function fetchTrendingAIRepos(token) {
  const keywords = [
    'ai', 'artificial-intelligence', 'machine-learning',
    'deep-learning', 'nlp', 'computer-vision',
    'llm', 'gpt', 'chatbot', 'ai-tool'
  ];

  const repos = [];
  
  for (const keyword of keywords.slice(0, 3)) { // 只取前3个避免超限
    try {
      const query = `${keyword} stars:>100 pushed:>2024-01-01`;
      const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const items = data.items || [];

      for (const repo of items) {
        if (repo.homepage && repo.homepage.startsWith('http')) {
          repos.push({
            name: repo.name,
            url: repo.homepage,
            github_url: repo.html_url,
            description: repo.description || '',
            category: 'ai-tools',
            tags: [keyword, ...(repo.topics || [])],
            source: 'github',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at
          });
        }
      }

      // 避免触发速率限制
      await sleep(1000);
    } catch (error) {
      log(`    ⚠️  GitHub ${keyword} 搜索失败: ${error.message}`, LogLevels.WARNING);
    }
  }

  return repos;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
