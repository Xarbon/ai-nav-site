import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

// Ensure settings table exists
async function ensureTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`).run();
}

export async function GET() {
  const db = getDB();
  await ensureTable(db);
  const { results } = await db.prepare('SELECT * FROM site_settings').all();
  const settings: Record<string, string> = {};
  for (const row of results as any[]) {
    settings[row.key] = row.value;
  }
  return NextResponse.json({ success: true, settings });
}

export async function POST(request: NextRequest) {
  const db = getDB();
  await ensureTable(db);
  const body = await request.json();
  
  for (const [key, value] of Object.entries(body)) {
    await db.prepare(`INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`)
      .bind(key, String(value)).run();
  }
  
  return NextResponse.json({ success: true });
}
