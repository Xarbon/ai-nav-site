import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

// GET - 获取单个工具（用于编辑页面）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const db = getDB();
  const tool = await db.prepare('SELECT * FROM tools WHERE slug = ?').bind(slug).first();
  
  if (!tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, tool });
}

// POST - 创建新工具
export async function POST(request: NextRequest) {
  const db = getDB();
  const body = await request.json();

  const required = ['slug', 'name', 'name_en', 'url', 'category'];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // Check if slug already exists
  const existing = await db.prepare('SELECT id FROM tools WHERE slug = ?').bind(body.slug).first();
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO tools (slug, name, name_en, url, description, description_en, icon_url, 
                       category, sub_category, audience_tags, pricing, rating, tags,
                       is_hot, is_recommended, is_new, is_featured, affiliate_url, 
                       sort_order, status, language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.slug,
    body.name,
    body.name_en,
    body.url,
    body.description || '',
    body.description_en || '',
    body.icon_url || '',
    body.category,
    body.sub_category || '',
    JSON.stringify(body.audience_tags || []),
    body.pricing || 'Free',
    body.rating || 0,
    JSON.stringify(body.tags || []),
    body.is_hot ? 1 : 0,
    body.is_recommended ? 1 : 0,
    body.is_new ? 1 : 0,
    body.is_featured ? 1 : 0,
    body.affiliate_url || '',
    body.sort_order || 0,
    body.status || 'draft',
    JSON.stringify(body.language || ['zh']),
    now,
    now
  ).run();

  return NextResponse.json({ success: true });
}

// PUT - 更新工具
export async function PUT(request: NextRequest) {
  const db = getDB();
  const body = await request.json();

  if (!body.slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE tools SET 
      name = ?, name_en = ?, url = ?, description = ?, description_en = ?,
      icon_url = ?, category = ?, sub_category = ?, audience_tags = ?,
      pricing = ?, rating = ?, tags = ?, is_hot = ?, is_recommended = ?,
      is_new = ?, is_featured = ?, affiliate_url = ?, sort_order = ?,
      status = ?, language = ?, updated_at = ?
    WHERE slug = ?
  `).bind(
    body.name,
    body.name_en,
    body.url,
    body.description || '',
    body.description_en || '',
    body.icon_url || '',
    body.category,
    body.sub_category || '',
    JSON.stringify(body.audience_tags || []),
    body.pricing || 'Free',
    body.rating || 0,
    JSON.stringify(body.tags || []),
    body.is_hot ? 1 : 0,
    body.is_recommended ? 1 : 0,
    body.is_new ? 1 : 0,
    body.is_featured ? 1 : 0,
    body.affiliate_url || '',
    body.sort_order || 0,
    body.status || 'draft',
    JSON.stringify(body.language || ['zh']),
    now,
    body.slug
  ).run();

  return NextResponse.json({ success: true });
}

// DELETE - 删除工具
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const db = getDB();
  await db.prepare('DELETE FROM tools WHERE slug = ?').bind(slug).run();

  return NextResponse.json({ success: true });
}
