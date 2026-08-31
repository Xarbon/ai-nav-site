import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const db = getDB();
  if (id) {
    const normalizedId = id.replace(/-/g, '\u2011');
    const row = await db.prepare('SELECT * FROM workflows WHERE workflow_id = ?').bind(normalizedId).first();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, workflow: row });
  }
  const { results } = await db.prepare('SELECT * FROM workflows ORDER BY workflow_id ASC').all();
  return NextResponse.json({ success: true, workflows: results });
}

export async function POST(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.workflow_id || !body.zh_title || !body.en_title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const normalizedId = body.workflow_id.replace(/-/g, '\u2011');
  await db.prepare(`
    INSERT INTO workflows (workflow_id, zh_title, en_title, track_slug, difficulty, time_cost,
      output_zh, output_en, prerequisite_zh, prerequisite_en, is_opc_selected,
      steps, alternative_tools, faq, cover_image, avg_score, vote_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(normalizedId, body.zh_title, body.en_title, body.track_slug || '',
    body.difficulty || 'simple', body.time_cost || '',
    body.output_zh || '', body.output_en || '',
    body.prerequisite_zh || '', body.prerequisite_en || '',
    body.is_opc_selected ? 1 : 0,
    JSON.stringify(body.steps || []), JSON.stringify(body.alternative_tools || []),
    JSON.stringify(body.faq || []), body.cover_image || '',
    body.avg_score || 0, body.vote_count || 0, body.status || 'draft'
  ).run();
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const db = getDB();
  const body = await request.json();
  if (!body.workflow_id) return NextResponse.json({ error: 'Missing workflow_id' }, { status: 400 });
  const normalizedId = body.workflow_id.replace(/-/g, '\u2011');
  await db.prepare(`
    UPDATE workflows SET zh_title=?, en_title=?, track_slug=?, difficulty=?, time_cost=?,
      output_zh=?, output_en=?, prerequisite_zh=?, prerequisite_en=?, is_opc_selected=?,
      steps=?, alternative_tools=?, faq=?, cover_image=?, status=?
    WHERE workflow_id=?
  `).bind(body.zh_title, body.en_title, body.track_slug || '',
    body.difficulty || 'simple', body.time_cost || '',
    body.output_zh || '', body.output_en || '',
    body.prerequisite_zh || '', body.prerequisite_en || '',
    body.is_opc_selected ? 1 : 0,
    JSON.stringify(body.steps || []), JSON.stringify(body.alternative_tools || []),
    JSON.stringify(body.faq || []), body.cover_image || '', body.status || 'draft',
    normalizedId
  ).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = getDB();
  const normalizedId = id.replace(/-/g, '\u2011');
  await db.prepare('DELETE FROM workflows WHERE workflow_id = ?').bind(normalizedId).run();
  return NextResponse.json({ success: true });
}
