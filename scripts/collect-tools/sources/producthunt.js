/**
 * Product Hunt 数据源
 * 采集最新发布的AI工具
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';
const TOPICS = ['artificial-intelligence', 'machine-learning', 'developer-tools', 'productivity'];

export async function collectFromProductHunt() {
  const token = process.env.PRODUCT_HUNT_API_TOKEN;
  if (!token) {
    throw new Error('Product Hunt API token not configured');
  }

  const tools = [];
  
  for (const topic of TOPICS) {
    try {
      log(`  采集 Product Hunt topic: ${topic}`, LogLevels.DEBUG);
      const posts = await fetchPostsByTopic(topic, token);
      tools.push(...posts);
    } catch (error) {
      log(`  ⚠️  Product Hunt ${topic} 采集失败: ${error.message}`, LogLevels.WARNING);
    }
  }

  return deduplicateBy(tools, 'url');
}

async function fetchPostsByTopic(topic, token) {
  const query = `
    query {
      posts(first: 20, topic: "${topic}", order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            description
            website
            topics {
              edges {
                node {
                  name
                }
              }
            }
            votesCount
            commentsCount
            createdAt
          }
        }
      }
    }
  `;

  const response = await fetch(PRODUCT_HUNT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`Product Hunt API error: ${response.status}`);
  }

  const data = await response.json();
  const posts = data.data?.posts?.edges || [];

  return posts
    .map(edge => edge.node)
    .filter(post => post.website)
    .map(post => ({
      name: post.name,
      url: post.website,
      description: post.tagline || post.description || '',
      category: 'ai-tools',
      tags: post.topics?.edges?.map(e => e.node.name) || [],
      source: 'producthunt',
      votes: post.votesCount,
      comments: post.commentsCount,
      created_at: post.createdAt
    }));
}

function deduplicateBy(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
