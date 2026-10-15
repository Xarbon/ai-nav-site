import { getDB } from '@/lib/d1/client';
import { ToolCard } from '@/components/tool/ToolCard';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const SITE_URL = 'https://aiqury.com';
  return {
    title: isZh ? '最新收录 - AIQury' : 'Recently Added - AIQury',
    description: isZh
      ? '最近新收录的 AI 工具，持续更新。第一时间发现最新 AI 生产力工具。'
      : 'Recently added AI tools, updated continuously. Discover the latest AI productivity tools.',
    alternates: {
      canonical: `${SITE_URL}/${locale}/latest`,
      languages: {
        'zh': `${SITE_URL}/zh/latest`,
        'en': `${SITE_URL}/en/latest`,
        'x-default': `${SITE_URL}/en/latest`,
      },
    },
  };
}

function safeJsonParse(str: any, fallback: any) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseRow(row: any) {
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

export default async function LatestPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const db = getDB();

  // 优先获取 is_new=1 的工具
  const { results: newTools } = await db.prepare(
    `SELECT * FROM tools 
     WHERE status = 'active' AND locale = ? AND is_new = 1
     ORDER BY created_at DESC`
  ).bind(locale).all();

  // 再获取最近创建的工具（按 created_at 降序，最近 50 个）
  const { results: recentTools } = await db.prepare(
    `SELECT * FROM tools 
     WHERE status = 'active' AND locale = ?
     ORDER BY created_at DESC 
     LIMIT 50`
  ).bind(locale).all();

  // 合并去重：is_new 优先，再补充 recent
  const seenSlugs = new Set<string>();
  const allTools: any[] = [];
  for (const t of [...newTools, ...recentTools]) {
    if (!seenSlugs.has(t.slug)) {
      seenSlugs.add(t.slug);
      allTools.push(t);
    }
  }

  // 如果合并后仍为空（极端情况），退化为按 sort_order
  let displayTools = allTools;
  if (displayTools.length === 0) {
    const { results: fallback } = await db.prepare(
      `SELECT * FROM tools WHERE status = 'active' AND locale = ? ORDER BY sort_order ASC LIMIT 50`
    ).bind(locale).all();
    displayTools = fallback;
  }

  const parsedTools = displayTools.map(parseRow);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0E3A7A' }}>
          🆕 {isZh ? '最新收录' : 'Recently Added'}
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {isZh
            ? `共 ${parsedTools.length} 个最新收录的 AI 工具`
            : `${parsedTools.length} recently added AI tools`}
        </p>
      </div>

      {/* Tools Grid */}
      {parsedTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {parsedTools.map((tool: any) => (
            <ToolCard key={tool.id} tool={tool} isZh={isZh} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg" style={{ color: '#9CA3AF' }}>
            {isZh ? '暂无最新工具' : 'No recent tools yet'}
          </p>
        </div>
      )}
    </div>
  );
}
