'use client';

interface NewsItem {
  id: number;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  url: string;
  source: string;
  source_url: string;
  cover_image: string;
  category: string;
  published_at: string;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  model: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  design: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  video: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  audio: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  dev: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  productivity: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  industry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  funding: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  policy: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  general: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const categoryLabels: Record<string, { zh: string; en: string }> = {
  model: { zh: '大模型', en: 'LLM' },
  design: { zh: 'AI设计', en: 'Design' },
  video: { zh: 'AI视频', en: 'Video' },
  audio: { zh: 'AI音频', en: 'Audio' },
  dev: { zh: 'AI开发', en: 'Dev' },
  productivity: { zh: '效率工具', en: 'Productivity' },
  industry: { zh: '行业动态', en: 'Industry' },
  funding: { zh: '融资', en: 'Funding' },
  policy: { zh: '政策法规', en: 'Policy' },
  general: { zh: '综合', en: 'General' },
};

function formatDate(dateStr: string, isZh: boolean): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isZh) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NewsCard({ item, isZh }: { item: NewsItem; isZh: boolean }) {
  const title = isZh ? item.title_zh || item.title_en : item.title_en || item.title_zh;
  const summary = isZh ? item.summary_zh || item.summary_en : item.summary_en || item.summary_zh;
  const colors = categoryColors[item.category] || categoryColors.general;
  const catLabel = isZh ? categoryLabels[item.category]?.zh : categoryLabels[item.category]?.en;

  return (
    <a
      href={item.url || item.source_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl border ${colors.border} ${colors.bg} p-4 transition hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-3">
        {item.cover_image && (
          <img
            src={item.cover_image}
            alt={title}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-medium border ${colors.border}`}>
              {catLabel || item.category}
            </span>
            {item.published_at && (
              <span className="text-xs" style={{ color: 'var(--text-caption)' }}>
                {formatDate(item.published_at, isZh)}
              </span>
            )}
          </div>
          <h3
            className="text-sm font-semibold leading-snug mb-1 line-clamp-2"
            style={{ color: 'var(--text-title)' }}
          >
            {title}
          </h3>
          {summary && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: 'var(--text-body)' }}
            >
              {summary}
            </p>
          )}
          {item.source && (
            <span
              className="inline-block mt-1.5 text-xs"
              style={{ color: 'var(--text-caption)' }}
            >
              {isZh ? '来源：' : 'Source: '}{item.source}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
