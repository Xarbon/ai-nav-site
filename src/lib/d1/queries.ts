import { getDB } from './client';

// 解析 D1 行数据（JSON 字段转换）
function parseToolRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    is_hot: !!row.is_hot,
    is_recommended: !!row.is_recommended,
    is_new: !!row.is_new,
    is_featured: !!row.is_featured,
    audience_tags: safeJsonParse(row.audience_tags, []),
    language: safeJsonParse(row.language, []),
    tags: safeJsonParse(row.tags, []),
  };
}

function safeJsonParse(str: any, fallback: any) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

// 获取所有工具（按 locale 过滤）
export async function getAllTools(locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const { results } = await db.prepare(
    `SELECT * FROM tools WHERE status = ? AND locale = ? ORDER BY sort_order ASC, rating DESC`
  ).bind('active', locale).all();
  return results.map(parseToolRow);
}

// 获取工具列表（按 locale 过滤）
export async function getTools(options?: {
  category?: string;
  subCategory?: string;
  audienceTags?: string[];
  isHot?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  limit?: number;
  locale?: string;
}): Promise<any[]> {
  const db = getDB();
  const locale = options?.locale || 'zh';
  let sql = `SELECT * FROM tools WHERE status = ? AND locale = ?`;
  const params: any[] = ['active', locale];

  if (options?.category) {
    sql += ' AND category = ?';
    params.push(options.category);
  }
  if (options?.subCategory) {
    sql += ' AND sub_category = ?';
    params.push(options.subCategory);
  }
  if (options?.isHot) {
    sql += ' AND is_hot = 1';
  }
  if (options?.isRecommended) {
    sql += ' AND is_recommended = 1';
  }
  if (options?.isNew) {
    sql += ' AND is_new = 1';
  }
  if (options?.audienceTags && options.audienceTags.length > 0) {
    const conditions = options.audienceTags.map(() => 'audience_tags LIKE ?').join(' OR ');
    sql += ` AND (${conditions})`;
    for (const tag of options.audienceTags) {
      params.push(`%"${tag}"%`);
    }
  }

  sql += ' ORDER BY sort_order ASC, rating DESC';

  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  let stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }
  const { results } = await stmt.all();
  return results.map(parseToolRow);
}

// 根据 slug 获取单个工具（按 locale 过滤，en locale 自动查找 slug-en）
export async function getToolBySlug(slug: string, locale: string = 'zh'): Promise<any> {
  const db = getDB();
  // en locale 的记录使用 slug-en 后缀
  const dbSlug = locale === 'en' ? `${slug}-en` : slug;
  const row = await db.prepare(
    `SELECT * FROM tools WHERE slug = ? AND status = ? AND locale = ?`
  ).bind(dbSlug, 'active', locale).first();
  return parseToolRow(row);
}

// 获取相关工具（按 locale 过滤）
export async function getRelatedTools(category: string, subCategory: string, excludeSlug: string, locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  // en locale 的记录使用 slug-en 后缀
  const dbExcludeSlug = locale === 'en' ? `${excludeSlug}-en` : excludeSlug;
  
  // Try sub_category match first, fall back to category-only
  let { results } = await db.prepare(
    `SELECT * FROM tools 
     WHERE category = ? AND sub_category = ? AND slug != ? AND status = ? AND locale = ?
     ORDER BY rating DESC LIMIT 6`
  ).bind(category, subCategory, dbExcludeSlug, 'active', locale).all();
  
  if (results.length < 3) {
    const { results: catResults } = await db.prepare(
      `SELECT * FROM tools 
       WHERE category = ? AND slug != ? AND status = ? AND locale = ?
       ORDER BY rating DESC LIMIT 6`
    ).bind(category, dbExcludeSlug, 'active', locale).all();
    results = catResults;
  }
  
  return results.map(parseToolRow);
}

// 搜索工具（按 locale 过滤）
export async function searchTools(keyword: string, locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const likeKeyword = `%${keyword}%`;
  
  const { results } = await db.prepare(
    `SELECT * FROM tools 
     WHERE status = ? AND locale = ?
     AND (name LIKE ? OR description LIKE ? OR tags LIKE ? 
          OR opc_scenario LIKE ? OR business_question_list LIKE ? OR core_capabilities LIKE ?)
     ORDER BY rating DESC LIMIT 50`
  ).bind('active', locale, likeKeyword, likeKeyword, likeKeyword, likeKeyword, likeKeyword, likeKeyword).all();
  
  return results.map(parseToolRow);
}

// 获取热门工具（按 locale 过滤）
export async function getHotTools(limit: number = 10, locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const { results } = await db.prepare(
    `SELECT * FROM tools WHERE is_hot = 1 AND status = ? AND locale = ? ORDER BY rating DESC LIMIT ?`
  ).bind('active', locale, limit).all();
  return results.map(parseToolRow);
}

// 获取推荐工具（按 locale 过滤）
export async function getRecommendedTools(limit: number = 10, locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const { results } = await db.prepare(
    `SELECT * FROM tools WHERE is_recommended = 1 AND status = ? AND locale = ? ORDER BY rating DESC LIMIT ?`
  ).bind('active', locale, limit).all();
  return results.map(parseToolRow);
}

// 获取最新工具（按 locale 过滤）
export async function getNewTools(limit: number = 10, locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const { results } = await db.prepare(
    `SELECT * FROM tools WHERE is_new = 1 AND status = ? AND locale = ? ORDER BY created_at DESC LIMIT ?`
  ).bind('active', locale, limit).all();
  return results.map(parseToolRow);
}

// 获取分类统计（按 locale 过滤）
export async function getCategoryStats(locale: string = 'zh'): Promise<any[]> {
  const db = getDB();
  const { results } = await db.prepare(
    `SELECT category, COUNT(*) as count FROM tools WHERE status = ? AND locale = ? GROUP BY category ORDER BY count DESC`
  ).bind('active', locale).all();
  return results;
}

// 获取工具评论
export async function getToolReviews(toolSlug: string) {
  const db = getDB();
  const tool = await db.prepare('SELECT id FROM tools WHERE slug = ?').bind(toolSlug).first();
  if (!tool) return [];
  const { results } = await db.prepare(
    "SELECT * FROM tool_reviews WHERE tool_id = ? AND status = 'approved' ORDER BY created_at DESC"
  ).bind((tool as any).id).all();
  return results;
}

// 添加评论
export async function addReview(toolSlug: string, rating: number, comment: string, authorName: string, authorEmail: string) {
  const db = getDB();
  const tool = await db.prepare('SELECT id FROM tools WHERE slug = ?').bind(toolSlug).first();
  if (!tool) throw new Error('Tool not found');
  
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO tool_reviews (id, tool_id, rating, comment, author_name, author_email, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')"
  ).bind(id, (tool as any).id, rating, comment, authorName, authorEmail).run();
}

// 提交新工具
export async function submitTool(data: {
  name: string;
  name_en: string;
  slug: string;
  url: string;
  description: string;
  description_en: string;
  category: string;
  sub_category: string;
}) {
  const db = getDB();
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO tools (id, slug, name, name_en, url, description, description_en, category, sub_category, status, locale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'zh')"
  ).bind(id, data.slug, data.name, data.name_en, data.url, data.description, data.description_en, data.category, data.sub_category).run();
}

// 检查 slug 是否存在（只检查 zh 记录）
export async function toolExists(slug: string): Promise<boolean> {
  const db = getDB();
  const row = await db.prepare('SELECT id FROM tools WHERE slug = ? AND locale = ?').bind(slug, 'zh').first();
  return !!row;
}

// 检查 URL 是否存在（只检查 zh 记录）
export async function toolUrlExists(url: string): Promise<boolean> {
  const db = getDB();
  const row = await db.prepare('SELECT id FROM tools WHERE url = ? AND locale = ?').bind(url, 'zh').first();
  return !!row;
}

// 插入工具（导入用 - 同时创建 zh 和 en 记录）
export async function insertTool(data: any) {
  const db = getDB();
  const zhId = crypto.randomUUID();
  const enId = crypto.randomUUID();
  
  // 插入 zh 记录
  await db.prepare(
    `INSERT INTO tools (id, slug, name, name_en, url, description, description_en, detail, detail_en, icon_url, category, sub_category, audience_tags, pricing, pricing_detail, language, rating, tags, is_hot, is_recommended, is_new, is_featured, affiliate_url, workflow, sort_order, status, run_mode, hardware_level, learn_level, hardware_note, commercial_notice, business_question_list, seo_title, seo_meta_desc, opc_scenario, payment_info, cn_access, pros, cons, core_capabilities, copyright_note, pricing_note, access_note, difficulty_note, capability_note, scenario_note, opc_scenario_en, core_capabilities_en, pros_en, cons_en, business_question_list_en, payment_info_en, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'zh')`
  ).bind(
    zhId,
    data.slug,
    data.name,
    data.name_en,
    data.url,
    data.description,
    data.description_en || '',
    data.detail || '',
    data.detail_en || '',
    data.icon_url || '',
    data.category,
    data.sub_category || '',
    JSON.stringify(data.audience_tags || []),
    data.pricing || 'Free',
    data.pricing_detail || '',
    JSON.stringify(data.language || []),
    data.rating || 0,
    JSON.stringify(data.tags || []),
    data.is_hot ? 1 : 0,
    data.is_recommended ? 1 : 0,
    data.is_new ? 1 : 0,
    data.is_featured ? 1 : 0,
    data.affiliate_url || '',
    data.workflow || '',
    data.sort_order || 999,
    data.status || 'active',
    data.run_mode || '',
    data.hardware_level || '',
    data.learn_level || '',
    data.hardware_note || '',
    data.commercial_notice || '',
    JSON.stringify(data.business_question_list || []),
    data.seo_title || '',
    data.seo_meta_desc || '',
    JSON.stringify(data.opc_scenario || []),
    data.payment_info || '',
    data.cn_access || '',
    JSON.stringify(data.pros || []),
    JSON.stringify(data.cons || []),
    JSON.stringify(data.core_capabilities || []),
    data.copyright_note || '',
    data.pricing_note || '',
    data.access_note || '',
    data.difficulty_note || '',
    data.capability_note || '',
    data.scenario_note || '',
    JSON.stringify(data.opc_scenario_en || []),
    JSON.stringify(data.core_capabilities_en || []),
    JSON.stringify(data.pros_en || []),
    JSON.stringify(data.cons_en || []),
    JSON.stringify(data.business_question_list_en || []),
    data.payment_info_en || ''
  ).run();
  
  // 插入 en 记录（使用 slug-en）
  await db.prepare(
    `INSERT INTO tools (id, slug, name, name_en, url, description, description_en, detail, detail_en, icon_url, category, sub_category, audience_tags, pricing, pricing_detail, language, rating, tags, is_hot, is_recommended, is_new, is_featured, affiliate_url, workflow, sort_order, status, run_mode, hardware_level, learn_level, hardware_note, commercial_notice, business_question_list, seo_title, seo_meta_desc, opc_scenario, payment_info, cn_access, pros, cons, core_capabilities, copyright_note, pricing_note, access_note, difficulty_note, capability_note, scenario_note, opc_scenario_en, core_capabilities_en, pros_en, cons_en, business_question_list_en, payment_info_en, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en')`
  ).bind(
    enId,
    data.slug + '-en',
    data.name_en || data.name,
    data.name_en,
    data.url,
    data.description_en || data.description,
    data.description_en || '',
    data.detail_en || data.detail,
    data.detail_en || '',
    data.icon_url || '',
    data.category,
    data.sub_category || '',
    JSON.stringify(data.audience_tags || []),
    data.pricing || 'Free',
    data.pricing_detail || '',
    JSON.stringify(data.language || []),
    data.rating || 0,
    JSON.stringify(data.tags || []),
    data.is_hot ? 1 : 0,
    data.is_recommended ? 1 : 0,
    data.is_new ? 1 : 0,
    data.is_featured ? 1 : 0,
    data.affiliate_url || '',
    data.workflow || '',
    data.sort_order || 999,
    data.status || 'active',
    data.run_mode || '',
    data.hardware_level || '',
    data.learn_level || '',
    data.hardware_note || '',
    data.commercial_notice || '',
    JSON.stringify(data.business_question_list_en || data.business_question_list || []),
    data.seo_title || '',
    data.seo_meta_desc || '',
    JSON.stringify(data.opc_scenario_en || data.opc_scenario || []),
    data.payment_info_en || data.payment_info || '',
    data.cn_access || '',
    JSON.stringify(data.pros_en || data.pros || []),
    JSON.stringify(data.cons_en || data.cons || []),
    JSON.stringify(data.core_capabilities_en || data.core_capabilities || []),
    data.copyright_note || '',
    data.pricing_note || '',
    data.access_note || '',
    data.difficulty_note || '',
    data.capability_note || '',
    data.scenario_note || '',
    JSON.stringify(data.opc_scenario_en || []),
    JSON.stringify(data.core_capabilities_en || []),
    JSON.stringify(data.pros_en || []),
    JSON.stringify(data.cons_en || []),
    JSON.stringify(data.business_question_list_en || []),
    data.payment_info_en || ''
  ).run();
}

// 更新广告配置
export async function updateAdConfig(slot: string, enabled: boolean, label: string, contact: string) {
  const db = getDB();
  const existing = await db.prepare('SELECT id FROM ad_config WHERE slot = ?').bind(slot).first();
  
  if (existing) {
    await db.prepare(
      "UPDATE ad_config SET enabled = ?, label = ?, contact = ?, updated_at = datetime('now') WHERE slot = ?"
    ).bind(enabled ? 1 : 0, label, contact, slot).run();
  } else {
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO ad_config (id, slot, enabled, label, contact) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, slot, enabled ? 1 : 0, label, contact).run();
  }
}

// 获取广告配置
export async function getAdConfig(): Promise<Record<string, { enabled: boolean; label: string; contact: string }>> {
  const db = getDB();
  try {
    const { results } = await db.prepare('SELECT * FROM ad_config').all();
    const config: Record<string, { enabled: boolean; label: string; contact: string }> = {};
    for (const row of results) {
      config[(row as any).slot] = {
        enabled: !!(row as any).enabled,
        label: (row as any).label || '',
        contact: (row as any).contact || '',
      };
    }
    return config;
  } catch {
    return {};
  }
}

// 记录点击
export async function recordClick(toolSlug: string, affiliateUrl: string, userAgent: string, referrer: string) {
  const db = getDB();
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO click_stats (id, tool_slug, affiliate_url, user_agent, referrer, clicked_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(id, toolSlug, affiliateUrl, userAgent, referrer).run();
}
