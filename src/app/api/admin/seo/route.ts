import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

async function ensureTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS seo_config (
    page_key TEXT PRIMARY KEY,
    title_zh TEXT, title_en TEXT,
    description_zh TEXT, description_en TEXT,
    keywords_zh TEXT, keywords_en TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`).run();
}

export async function GET() {
  const db = getDB();
  await ensureTable(db);
  const { results } = await db.prepare('SELECT * FROM seo_config ORDER BY page_key').all();
  return NextResponse.json({ success: true, seo: results });
}

export async function POST(request: NextRequest) {
  const db = getDB();
  await ensureTable(db);
  const body = await request.json();
  
  if (!body.page_key) {
    return NextResponse.json({ error: 'Missing page_key' }, { status: 400 });
  }

  await db.prepare(`
    INSERT OR REPLACE INTO seo_config (page_key, title_zh, title_en, description_zh, description_en, keywords_zh, keywords_en, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    body.page_key, body.title_zh || '', body.title_en || '',
    body.description_zh || '', body.description_en || '',
    body.keywords_zh || '', body.keywords_en || ''
  ).run();

  return NextResponse.json({ success: true });
}
