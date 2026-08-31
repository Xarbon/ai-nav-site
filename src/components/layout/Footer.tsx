interface FooterProps {
  isZh?: boolean;
  locale?: string;
}

const ecosystemLinks = [
  { label: 'Starterstory', url: 'https://www.starterstory.com/' },
  { label: 'TrustMRR', url: 'https://trustmrr.com' },
  { label: 'ProductHunt', url: 'https://www.producthunt.com/' },
  { label: 'Supabase', url: 'https://supabase.com/' },
];

const openSourceLinks = [
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Hugging Face', url: 'https://huggingface.co' },
  { label: 'Gitee', url: 'https://gitee.com/' },
];

const extLinkProps = {
  target: '_blank' as const,
  rel: 'noopener noreferrer nofollow',
};

export function Footer({ isZh, locale = 'en' }: FooterProps) {
  const isZhLocale = isZh ?? (locale === 'zh');
  
  // 站点地图分类
  const sitemapCategories = isZhLocale ? [
    { name: '电商', slug: 'ecommerce' },
    { name: '内容创作', slug: 'content_creation' },
    { name: '跨境OPC', slug: 'cross_border_opc' },
    { name: '量化交易', slug: 'quant_trading' },
    { name: '办公效率', slug: 'office_productivity' },
    { name: '开发自动化', slug: 'dev_automation' },
    { name: '设计', slug: 'design' },
    { name: '教育', slug: 'education' },
    { name: '音视频', slug: 'audio_video' },
    { name: '生活方式', slug: 'lifestyle' },
    { name: '营销', slug: 'marketing' },
    { name: 'AI客服', slug: 'ai_customer_service' },
    { name: '本地生活', slug: 'local_business' },
    { name: '法律合规', slug: 'legal_compliance' },
    { name: '人力资源', slug: 'hr' },
    { name: '医疗健康', slug: 'healthcare' },
    { name: '工业制造', slug: 'industry' },
    { name: '金融财税', slug: 'research' },
    { name: 'AI漫画', slug: 'ai_comic_drama' },
    { name: '房地产', slug: 'construction' },
  ] : [
    { name: 'E-commerce', slug: 'ecommerce' },
    { name: 'Content Creation', slug: 'content_creation' },
    { name: 'Cross-border OPC', slug: 'cross_border_opc' },
    { name: 'Quant Trading', slug: 'quant_trading' },
    { name: 'Office Productivity', slug: 'office_productivity' },
    { name: 'Dev Automation', slug: 'dev_automation' },
    { name: 'Design', slug: 'design' },
    { name: 'Education', slug: 'education' },
    { name: 'Audio & Video', slug: 'audio_video' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'AI Customer Service', slug: 'ai_customer_service' },
    { name: 'Local Business', slug: 'local_business' },
    { name: 'Legal & Compliance', slug: 'legal_compliance' },
    { name: 'HR', slug: 'hr' },
    { name: 'Healthcare', slug: 'healthcare' },
    { name: 'Manufacturing', slug: 'industry' },
    { name: 'Finance & Tax', slug: 'research' },
    { name: 'AI Comics', slug: 'ai_comic_drama' },
    { name: 'Real Estate', slug: 'construction' },
  ];
  
  return (
    <footer className="border-t border-[var(--border-color)] bg-white">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌区 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-icon.svg" alt="AIqury" className="h-8 w-8" />
              <span className="text-lg font-bold" style={{ color: '#0E3A7A' }}>aiqury.com</span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
              {isZhLocale ? '用业务问题找AI工具' : 'Find AI Tools By Your Questions'}
            </p>
            {isZhLocale ? (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                AIqury面向单人OPC创业者，以真实业务问题驱动AI工具检索，聚合评测、工具组合方案，帮助一人公司快速找到合适AI生产力工具。
              </p>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                AIqury is built for solo‑OPC founders. It indexes AI tools by real‑world business questions, provides tool reviews &amp; combo solutions to help one‑person companies pick proper AI productivity tools.
              </p>
            )}
          </div>

          {/* 站点地图 */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-title)' }}>
              {isZhLocale ? '站点地图' : 'Sitemap'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              {sitemapCategories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`/${locale}/category/${cat.slug}`}
                  className="text-xs hover:text-[var(--color-primary)] transition"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {cat.name}
                </a>
              ))}
            </div>
            <div className="mt-3 flex gap-4">
              <a
                href={`/${locale}/search`}
                className="text-xs hover:text-[var(--color-primary)] transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isZhLocale ? '🔍 搜索工具' : '🔍 Search Tools'}
              </a>
              <a
                href={`/${locale}/submit`}
                className="text-xs hover:text-[var(--color-primary)] transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isZhLocale ? '📝 提交工具' : '📝 Submit Tool'}
              </a>
            </div>
          </div>

          {/* 外部链接 + 联系 */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-title)' }}>
              {isZhLocale ? '生态链接' : 'Ecosystem Links'}
            </h4>
            <ul className="space-y-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {ecosystemLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    {...extLinkProps}
                    className="hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-title)' }}>
              {isZhLocale ? '开源资源' : 'Open‑Source Resources'}
            </h4>
            <ul className="space-y-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {openSourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    {...extLinkProps}
                    className="hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-title)' }}>
              {isZhLocale ? '联系我们' : 'Contact'}
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <a
                href="mailto:goldenpaws78@outlook.com"
                className="hover:text-[var(--color-primary)]"
              >
                goldenpaws78@outlook.com
              </a>
            </p>
          </div>
        </div>

        {/* 版权行 */}
        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            © 2026 aiqury.com · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
