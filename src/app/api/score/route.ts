import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolSlug, visitorId, scores, totalScore } = body;

    if (!toolSlug || !visitorId || !scores) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDB();

    // Check if tool exists
    const tool = await db.prepare('SELECT id FROM tools WHERE slug = ?').bind(toolSlug).first();
    if (!tool) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // Check if visitor already rated within 30 days
    const existing = await db.prepare(
      "SELECT id FROM tool_scores WHERE tool_slug = ? AND visitor_id = ? AND created_at > datetime('now', '-30 days')"
    ).bind(toolSlug, visitorId).first();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already rated' }, { status: 409 });
    }

    // Insert score
    const id = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO tool_scores (id, tool_slug, visitor_id, intelligence, ease_of_use, output_quality, value_for_money, total_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      toolSlug,
      visitorId,
      scores.intelligence,
      scores.easeOfUse,
      scores.outputQuality,
      scores.valueForMoney,
      totalScore
    ).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Score submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolSlug = searchParams.get('slug');

    if (!toolSlug) {
      return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 });
    }

    const db = getDB();
    const { results } = await db.prepare(
      `SELECT AVG(total_score) as avg_score, COUNT(*) as total
       FROM tool_scores WHERE tool_slug = ? AND created_at > datetime('now', '-30 days')`
    ).bind(toolSlug).all();

    const row = results[0] as any;
    return NextResponse.json({
      success: true,
      averageScore: row?.avg_score ? Math.round(row.avg_score * 10) / 10 : 0,
      totalRatings: row?.total || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
