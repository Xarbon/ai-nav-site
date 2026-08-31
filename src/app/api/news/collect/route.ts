import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

interface NewsSource {
  name: string;
  url: string;
  category: string;
}

const NEWS_SOURCES: NewsSource[] = [
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'industry' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', category: 'industry' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'industry' },
];

async function parseRSS(xml: string): Promise<Array<{ title: string; link: string; description: string; pubDate: string }>> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    
    if (title) {
      items.push({ title, link, description: description.replace(/<[^>]*>/g, '').slice(0, 200), pubDate });
    }
  }
  
  return items;
}

function translateCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('model') || lower.includes('gpt') || lower.includes('claude') || lower.includes('gemini') || lower.includes('llm')) return 'model';
  if (lower.includes('design') || lower.includes('image') || lower.includes('art') || lower.includes('midjourney')) return 'design';
  if (lower.includes('video') || lower.includes('runway') || lower.includes('sora')) return 'video';
  if (lower.includes('music') || lower.includes('audio') || lower.includes('voice') || lower.includes('suno')) return 'audio';
  if (lower.includes('code') || lower.includes('program') || lower.includes('cursor') || lower.includes('dev')) return 'dev';
  if (lower.includes('productivity') || lower.includes('notion') || lower.includes('workspace')) return 'productivity';
  if (lower.includes('fund') || lower.includes('invest') || lower.includes('million') || lower.includes('billion')) return 'funding';
  return 'general';
}

export async function GET() {
  try {
    const db = getDB();

    // Ensure table exists
    await db.prepare(`CREATE TABLE IF NOT EXISTS ai_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_zh TEXT, title_en TEXT,
      summary_zh TEXT, summary_en TEXT,
      url TEXT, source TEXT, source_url TEXT,
      cover_image TEXT, category TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();

    let totalAdded = 0;
    
    for (const source of NEWS_SOURCES) {
      try {
        const response = await fetch(source.url, {
          headers: { 'User-Agent': 'AIqury News Bot/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) continue;
        
        const xml = await response.text();
        const items = await parseRSS(xml);
        
        for (const item of items.slice(0, 5)) {
          // Check if already exists
          const existing = await db.prepare('SELECT id FROM ai_news WHERE url = ?').bind(item.link).first();
          if (existing) continue;
          
          const category = translateCategory(item.title);
          const pubDate = item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          
          await db.prepare(
            'INSERT INTO ai_news (title_zh, title_en, summary_zh, summary_en, url, source, source_url, category, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            item.title,
            item.title,
            item.description,
            item.description,
            item.link,
            source.name,
            source.url,
            category,
            pubDate
          ).run();
          
          totalAdded++;
        }
      } catch (e) {
        console.error(`Failed to fetch from ${source.name}:`, e);
      }
    }
    
    // Keep only last 100 news items
    await db.prepare('DELETE FROM ai_news WHERE id NOT IN (SELECT id FROM ai_news ORDER BY published_at DESC LIMIT 100)').run();
    
    return NextResponse.json({ success: true, added: totalAdded });
  } catch (error) {
    console.error('News collection error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
