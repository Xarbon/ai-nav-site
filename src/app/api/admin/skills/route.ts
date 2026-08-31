import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const db = getDB();
  if (id) {
    let row = await db.prepare('SELECT * FROM skills WHERE skill_id = ?').bind(id).first();
    if (!row) {
      const nb = id.replace(/-/g, '\u2011');
      row = await db.prepare('SELECT * FROM skills WHERE skill_id = ?').bind(nb).first();
    }
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, skill: row });
  }
  const { results } = await db.prepare('SELECT * FROM skills ORDER BY skill_id ASC').all();
  return NextResponse.json({ success: true, skills: results });
}

export async function POST(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.skill_id || !body.zh_title || !body.en_title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  await db.prepare(`
    INSERT INTO skills (skill_id, zh_title, en_title, track_slug, zh_description, en_description,
      prompt_zh, prompt_en, usage_scene_zh, usage_scene_en, related_workflow_ids,
      copy_count, cover_image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(body.skill_id, body.zh_title, body.en_title, body.track_slug || '',
    body.zh_description || '', body.en_description || '',
    body.prompt_zh || '', body.prompt_en || '',
    body.usage_scene_zh || '', body.usage_scene_en || '',
    JSON.stringify(body.related_workflow_ids || []),
    body.copy_count || 0, body.cover_image || '', body.status || 'draft'
  ).run();
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.skill_id) return NextResponse.json({ error: 'Missing skill_id' }, { status: 400 });
  await db.prepare(`
    UPDATE skills SET zh_title=?, en_title=?, track_slug=?, zh_description=?, en_description=?,
      prompt_zh=?, prompt_en=?, usage_scene_zh=?, usage_scene_en=?, related_workflow_ids=?,
      copy_count=?, cover_image=?, status=?
    WHERE skill_id=?
  `).bind(body.zh_title, body.en_title, body.track_slug || '',
    body.zh_description || '', body.en_description || '',
    body.prompt_zh || '', body.prompt_en || '',
    body.usage_scene_zh || '', body.usage_scene_en || '',
    JSON.stringify(body.related_workflow_ids || []),
    body.copy_count || 0, body.cover_image || '', body.status || 'draft', body.skill_id
  ).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = getDB();
  await db.prepare('DELETE FROM skills WHERE skill_id = ?').bind(id).run();
  return NextResponse.json({ success: true });
}
