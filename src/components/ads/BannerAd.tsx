import { getAdConfig } from '@/lib/d1/queries';

interface BannerAdProps {
  slot: 'header' | 'sidebar' | 'footer' | 'inline';
  className?: string;
  isZh?: boolean;
}

const DEFAULT_SIZES: Record<string, { width: string; height: string }> = {
  header: { width: '100%', height: '90px' },
  sidebar: { width: '100%', height: '250px' },
  footer: { width: '100%', height: '90px' },
  inline: { width: '100%', height: '100px' },
};

export async function BannerAd({ slot, className = '', isZh = true }: BannerAdProps) {
  let config: { enabled: boolean; label: string; contact: string } | null = null;
  
  try {
    const configMap = await getAdConfig();
    config = configMap[slot] || null;
  } catch (error) {
    // 表可能不存在，使用默认配置
  }

  // 如果广告位被禁用，不渲染
  if (config && !config.enabled) {
    return null;
  }

  const size = DEFAULT_SIZES[slot] || { width: '100%', height: '100px' };
  const label = config?.label || (isZh ? '广告位招商' : 'Advertise Here');
  const contact = config?.contact || 'ads@aiqury.com';

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] rounded-md flex flex-col items-center justify-center gap-1 ${className}`}
      style={{ width: size.width, height: size.height }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {isZh ? '联系: ' : 'Contact: '}{contact}
      </span>
    </div>
  );
}
