import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const db = getDB();
  if (id) {
    const row = await db.prepare('SELECT * FROM agents WHERE agent_id = ?').bind(id).first();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, agent: row });
  }
  const { results } = await db.prepare('SELECT * FROM agents ORDER BY agent_id ASC').all();
  return NextResponse.json({ success: true, agents: results });
}

export async function POST(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.agent_id || !body.zh_title || !body.en_title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  await db.prepare(`
    INSERT INTO agents (agent_id, zh_title, en_title, track_slug, zh_short_desc, en_short_desc,
      zh_capability, en_capability, zh_limit, en_limit, related_workflow_ids,
      official_url, tag_list_zh, tag_list_en, cover_image, avg_score, vote_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(body.agent_id, body.zh_title, body.en_title, body.track_slug || '',
    body.zh_short_desc || '', body.en_short_desc || '',
    body.zh_capability || '', body.en_capability || '',
    body.zh_limit || '', body.en_limit || '',
    JSON.stringify(body.related_workflow_ids || []),
    body.official_url || '',
    JSON.stringify(body.tag_list_zh || []),
    JSON.stringify(body.tag_list_en || []),
    body.cover_image || '', body.avg_score || 0, body.vote_count || 0, body.status || 'draft'
  ).run();
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.agent_id) return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
  await db.prepare(`
    UPDATE agents SET zh_title=?, en_title=?, track_slug=?, zh_short_desc=?, en_short_desc=?,
      zh_capability=?, en_capability=?, zh_limit=?, en_limit=?, related_workflow_ids=?,
      official_url=?, tag_list_zh=?, tag_list_en=?, cover_image=?, status=?
    WHERE agent_id=?
  `).bind(body.zh_title, body.en_title, body.track_slug || '',
    body.zh_short_desc || '', body.en_short_desc || '',
    body.zh_capability || '', body.en_capability || '',
    body.zh_limit || '', body.en_limit || '',
    JSON.stringify(body.related_workflow_ids || []),
    body.official_url || '',
    JSON.stringify(body.tag_list_zh || []),
    JSON.stringify(body.tag_list_en || []),
    body.cover_image || '', body.status || 'draft', body.agent_id
  ).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = getDB();
  await db.prepare('DELETE FROM agents WHERE agent_id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}
