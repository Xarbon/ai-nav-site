import { getDB } from './client';

export interface AiAgentItem {
  agent_id: string;
  zh_title: string;
  en_title: string;
  track_slug: string;
  zh_short_desc: string;
  en_short_desc: string;
  zh_capability: string;
  en_capability: string;
  zh_limit: string;
  en_limit: string;
  related_workflow_ids: string[];
  official_url: string;
  tag_list_zh: string[];
  tag_list_en: string[];
  cover_image: string;
  avg_score: number;
  vote_count: number;
  status: 'draft' | 'active' | 'archived';
}

function parseJsonArray(str: any): string[] {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAgents(options?: { trackSlug?: string; status?: string }): Promise<AiAgentItem[]> {
  const db = getDB();
  let sql = 'SELECT * FROM agents';
  const params: any[] = [];
  const conditions: string[] = [];

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  } else {
    conditions.push("status = 'active'");
  }

  if (options?.trackSlug) {
    conditions.push('track_slug = ?');
    params.push(options.trackSlug);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY agent_id ASC';

  const { results } = await db.prepare(sql).bind(...params).all();
  return results.map((row: any) => ({
    agent_id: row.agent_id,
    zh_title: row.zh_title,
    en_title: row.en_title,
    track_slug: row.track_slug,
    zh_short_desc: row.zh_short_desc,
    en_short_desc: row.en_short_desc,
    zh_capability: row.zh_capability,
    en_capability: row.en_capability,
    zh_limit: row.zh_limit,
    en_limit: row.en_limit,
    related_workflow_ids: parseJsonArray(row.related_workflow_ids),
    official_url: row.official_url,
    tag_list_zh: parseJsonArray(row.tag_list_zh),
    tag_list_en: parseJsonArray(row.tag_list_en),
    cover_image: row.cover_image,
    avg_score: row.avg_score || 0,
    vote_count: row.vote_count || 0,
    status: row.status,
  }));
}

export async function getAgentById(agentId: string): Promise<AiAgentItem | null> {
  const db = getDB();
  const row = await db.prepare('SELECT * FROM agents WHERE agent_id = ?')
    .bind(agentId)
    .first();

  if (!row) return null;

  return {
    agent_id: (row as any).agent_id,
    zh_title: (row as any).zh_title,
    en_title: (row as any).en_title,
    track_slug: (row as any).track_slug,
    zh_short_desc: (row as any).zh_short_desc,
    en_short_desc: (row as any).en_short_desc,
    zh_capability: (row as any).zh_capability,
    en_capability: (row as any).en_capability,
    zh_limit: (row as any).zh_limit,
    en_limit: (row as any).en_limit,
    related_workflow_ids: parseJsonArray((row as any).related_workflow_ids),
    official_url: (row as any).official_url,
    tag_list_zh: parseJsonArray((row as any).tag_list_zh),
    tag_list_en: parseJsonArray((row as any).tag_list_en),
    cover_image: (row as any).cover_image,
    avg_score: (row as any).avg_score || 0,
    vote_count: (row as any).vote_count || 0,
    status: (row as any).status,
  };
}
