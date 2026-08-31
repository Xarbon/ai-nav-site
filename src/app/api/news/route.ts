import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export async function GET() {
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

  // Get latest 12 news items
  const { results } = await db.prepare(
    'SELECT * FROM ai_news ORDER BY published_at DESC LIMIT 12'
  ).all();

  return NextResponse.json({ success: true, news: results });
}
