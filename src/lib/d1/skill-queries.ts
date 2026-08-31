import { getDB } from './client';

export interface AiSkill {
  skill_id: string;
  zh_title: string;
  en_title: string;
  track_slug: string;
  zh_description: string;
  en_description: string;
  prompt_zh: string;
  prompt_en: string;
  usage_scene_zh: string;
  usage_scene_en: string;
  related_workflow_ids: string[];
  copy_count: number;
  cover_image: string;
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

export async function getSkills(options?: { trackSlug?: string; status?: string }): Promise<AiSkill[]> {
  const db = getDB();
  let sql = 'SELECT * FROM skills';
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

  sql += ' ORDER BY skill_id ASC';

  const { results } = await db.prepare(sql).bind(...params).all();
  return results.map((row: any) => ({
    skill_id: row.skill_id,
    zh_title: row.zh_title,
    en_title: row.en_title,
    track_slug: row.track_slug,
    zh_description: row.zh_description,
    en_description: row.en_description,
    prompt_zh: row.prompt_zh,
    prompt_en: row.prompt_en,
    usage_scene_zh: row.usage_scene_zh,
    usage_scene_en: row.usage_scene_en,
    related_workflow_ids: parseJsonArray(row.related_workflow_ids),
    copy_count: row.copy_count || 0,
    cover_image: row.cover_image,
    status: row.status,
  }));
}

export async function getSkillById(skillId: string): Promise<AiSkill | null> {
  const db = getDB();
  
  // Try both regular hyphen and non-breaking hyphen (U+2011)
  const regularHyphen = skillId;
  const nonBreakingHyphen = skillId.replace(/-/g, '‑');
  
  // Try with regular hyphen first
  let row = await db.prepare('SELECT * FROM skills WHERE skill_id = ?')
    .bind(regularHyphen)
    .first();
  
  // If not found, try with non-breaking hyphen
  if (!row) {
    row = await db.prepare('SELECT * FROM skills WHERE skill_id = ?')
      .bind(nonBreakingHyphen)
      .first();
  }

  if (!row) return null;

  return {
    skill_id: (row as any).skill_id,
    zh_title: (row as any).zh_title,
    en_title: (row as any).en_title,
    track_slug: (row as any).track_slug,
    zh_description: (row as any).zh_description,
    en_description: (row as any).en_description,
    prompt_zh: (row as any).prompt_zh,
    prompt_en: (row as any).prompt_en,
    usage_scene_zh: (row as any).usage_scene_zh,
    usage_scene_en: (row as any).usage_scene_en,
    related_workflow_ids: parseJsonArray((row as any).related_workflow_ids),
    copy_count: (row as any).copy_count || 0,
    cover_image: (row as any).cover_image,
    status: (row as any).status,
  };
}
