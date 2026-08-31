import Link from 'next/link';

interface Tool {
  slug: string;
  name: string;
  name_en: string;
  description: string;
  description_en?: string;
  icon_url: string;
  pricing: string;
  rating: number;
  audience_tags: string[];
  is_hot: boolean;
  is_recommended: boolean;
  is_new: boolean;
  run_mode?: string;
  hardware_level?: string;
  learn_level?: string;
  status?: string;
}

interface Props {
  tool: Tool;
  isZh?: boolean;
}

const runModeLabels: Record<string, { zh: string; en: string; color: string }> = {
  'web': { zh: '🌐 网页端', en: '🌐 Web', color: '#10b981' },
  'app': { zh: '📱 客户端', en: '📱 App', color: '#3b82f6' },
  'api': { zh: '🔌 API', en: '🔌 API', color: '#8b5cf6' },
  'plugin': { zh: '🧩 插件', en: '🧩 Plugin', color: '#f59e0b' },
  'local': { zh: '💻 本地', en: '💻 Local', color: '#ef4444' },
};

const hardwareLabels: Record<string, { zh: string; en: string; color: string }> = {
  'none': { zh: '⚡ 无需', en: '⚡ None', color: '#10b981' },
  'low': { zh: '🔋 低', en: '🔋 Low', color: '#3b82f6' },
  'medium': { zh: '🔋 中', en: '🔋 Med', color: '#f59e0b' },
  'high': { zh: '🔋 高', en: '🔋 High', color: '#ef4444' },
};

const learnLabels: Record<string, { zh: string; en: string; color: string }> = {
  'easy': { zh: '⭐ 简单', en: '⭐ Easy', color: '#10b981' },
  'medium': { zh: '⭐⭐ 中等', en: '⭐⭐ Med', color: '#f59e0b' },
  'hard': { zh: '⭐⭐⭐ 困难', en: '⭐⭐⭐ Hard', color: '#ef4444' },
};

export function ToolCard({ tool, isZh = true }: Props) {
  const displayName = isZh ? tool.name : (tool.name_en || tool.name);
  const displayDescription = isZh ? tool.description : (tool.description_en || tool.description);
  const isAbnormal = tool.status === 'inactive' || tool.status === 'broken';

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="group block bg-white border border-[var(--border-color)] rounded-xl p-5 hover:shadow-[var(--shadow-md)] transition-all duration-200"
    >
      {/* Abnormal status warning */}
      {isAbnormal && (
        <div className="mb-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {isZh ? '工具状态异常' : 'Tool status abnormal'}
        </div>
      )}

      {/* Top row: icon + ID + pricing badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--bg-surface)] flex items-center justify-center">
            {tool.icon_url ? (
              <img src={tool.icon_url} alt={displayName} className="w-5 h-5 rounded-full" />
            ) : (
              <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6H9z" />
              </svg>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>#{tool.slug.slice(0, 6).toUpperCase()}</span>
        </div>
        <span
          className="text-xs font-medium px-3 py-1 rounded-full border"
          style={{
            borderColor: tool.pricing === 'Paid' ? 'var(--color-paid)' : 'var(--color-free)',
            color: tool.pricing === 'Paid' ? 'var(--color-paid-text)' : 'var(--color-free-text)',
          }}
        >
          {tool.pricing === 'Paid' ? (isZh ? '付费' : 'Paid') : (isZh ? '免费' : 'Free')}
        </span>
      </div>

      {/* Tool name */}
      <h3 className="text-lg font-bold mb-1.5 group-hover:text-[var(--color-primary)] transition" style={{ color: '#0E3A7A' }}>
        {displayName}
      </h3>

      {/* Description */}
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
        {displayDescription}
      </p>

      {/* New tags: run_mode, hardware, learn_level */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tool.run_mode && runModeLabels[tool.run_mode] && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ 
              borderColor: runModeLabels[tool.run_mode].color + '40',
              color: runModeLabels[tool.run_mode].color,
              backgroundColor: runModeLabels[tool.run_mode].color + '10'
            }}
          >
            {isZh ? runModeLabels[tool.run_mode].zh : runModeLabels[tool.run_mode].en}
          </span>
        )}
        {tool.hardware_level && hardwareLabels[tool.hardware_level] && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ 
              borderColor: hardwareLabels[tool.hardware_level].color + '40',
              color: hardwareLabels[tool.hardware_level].color,
              backgroundColor: hardwareLabels[tool.hardware_level].color + '10'
            }}
          >
            {isZh ? hardwareLabels[tool.hardware_level].zh : hardwareLabels[tool.hardware_level].en}
          </span>
        )}
        {tool.learn_level && learnLabels[tool.learn_level] && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ 
              borderColor: learnLabels[tool.learn_level].color + '40',
              color: learnLabels[tool.learn_level].color,
              backgroundColor: learnLabels[tool.learn_level].color + '10'
            }}
          >
            {isZh ? learnLabels[tool.learn_level].zh : learnLabels[tool.learn_level].en}
          </span>
        )}
      </div>

      {/* View Tool button */}
      <div className="inline-flex items-center px-4 py-2 border border-[var(--border-color)] rounded-full text-sm font-medium transition hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-body)' }}>
        {isZh ? '查看工具' : 'View Tool'}
      </div>
    </Link>
  );
}
