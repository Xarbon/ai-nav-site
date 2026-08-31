import { getDB } from './client';

function safeJsonParse(str: any, fallback: any) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

export async function getWorkflows(options?: { trackSlug?: string; status?: string }) {
  const db = getDB();
  let sql = 'SELECT * FROM workflows';
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

  sql += ' ORDER BY workflow_id ASC';

  const { results } = await db.prepare(sql).bind(...params).all();
  return results.map((row: any) => ({
    ...row,
    is_opc_selected: !!row.is_opc_selected,
    steps: safeJsonParse(row.steps, []),
    alternative_tools: safeJsonParse(row.alternative_tools, []),
    faq: safeJsonParse(row.faq, []),
  }));
}

export async function getWorkflowById(workflowId: string) {
  const db = getDB();
  // Normalize: replace regular hyphens with non-breaking hyphens (U+2011)
  const normalizedId = workflowId.replace(/-/g, '\u2011');
  const row = await db.prepare('SELECT * FROM workflows WHERE workflow_id = ?')
    .bind(normalizedId)
    .first();

  if (!row) return null;

  return {
    ...(row as any),
    is_opc_selected: !!(row as any).is_opc_selected,
    steps: safeJsonParse((row as any).steps, []),
    alternative_tools: safeJsonParse((row as any).alternative_tools, []),
    faq: safeJsonParse((row as any).faq, []),
  };
}
