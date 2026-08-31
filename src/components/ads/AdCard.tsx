import { getAdConfig } from '@/lib/d1/queries';

interface AdCardProps {
  className?: string;
  isZh?: boolean;
}

export async function AdCard({ className = '', isZh = true }: AdCardProps) {
  let config: { enabled: boolean; label: string; contact: string } | null = null;
  
  try {
    const configMap = await getAdConfig();
    config = configMap['inline'] || null;
  } catch (error) {
    // 表可能不存在，使用默认配置
  }

  // 如果广告位被禁用，不渲染
  if (config && !config.enabled) {
    return null;
  }

  const label = config?.label || (isZh ? '广告位招商' : 'Advertise Here');
  const contact = config?.contact || 'ads@aiqury.com';

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center gap-2 min-h-[120px] ${className}`}
    >
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {isZh ? '联系: ' : 'Contact: '}{contact}
      </span>
    </div>
  );
}
