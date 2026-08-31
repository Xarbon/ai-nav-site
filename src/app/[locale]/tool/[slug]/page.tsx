import { getToolBySlug, getRelatedTools } from '@/lib/d1/queries';
import { cachedQuery } from '@/lib/d1/cache';
import { ToolCard } from '@/components/tool/ToolCard';
import { CopyPromptButton } from '@/components/tool/CopyPromptButton';
import { notFound } from 'next/navigation';
import { ToolJsonLd } from '@/components/seo/ToolJsonLd';
import { ScoreRate } from '@/components/score/ScoreRate';
import { BannerAd } from '@/components/ads/BannerAd';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';
  const tool = await getToolBySlug(slug, locale);
  if (!tool) return { title: 'Tool Not Found' };
  const displayName = tool.name; // 已由 selectLocaleFields 处理
  const displayDescription = tool.description; // 已由 selectLocaleFields 处理
  // For English, skip seo_title if it contains Chinese characters
  const hasChinese = /[一-鿿]/.test(tool.seo_title || '');
  const seoTitle = isZh ? tool.seo_title : (hasChinese ? '' : tool.seo_title);
  const title = seoTitle || (displayName + ' | ' + (displayDescription || '').slice(0, 30) + ' | AIQury OPC');
  const opcScenarios = safeJsonParse(tool.opc_scenario, []); // 已由 selectLocaleFields 处理
  const scenarioSummary = opcScenarios.slice(0, 2).join('; ');
  const hasChineseDesc = /[一-鿿]/.test(tool.seo_meta_desc || '');
  const seoMetaDesc = isZh ? tool.seo_meta_desc : (hasChineseDesc ? '' : tool.seo_meta_desc);
  const description = seoMetaDesc || ((displayDescription || '').slice(0, 100) + (scenarioSummary ? '. OPC: ' + scenarioSummary : ''));
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/tool/${slug}`;
  const otherLocale = locale === 'zh' ? 'en' : 'zh';
  const otherSlug = 'khan-academy-en'; // en uses slug-en suffix
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/tool/${slug}`,
        'en': `${SITE_URL}/en/tool/${slug}`,
        'x-default': `${SITE_URL}/en/tool/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: tool.icon_url ? [{ url: tool.icon_url }] : [],
    },
  };
}

function safeJsonParse(str: any, fallback: any) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch {
    if (typeof str === 'string' && str.includes('|')) return str.split('|').map((s: string) => s.trim()).filter(Boolean);
    return fallback;
  }
}

const runModeMap: Record<string, { zh: string; en: string }> = {
  'web': { zh: '网页端', en: 'Web App' }, 'app': { zh: '桌面客户端', en: 'Desktop App' },
  'api': { zh: 'API 接口', en: 'API' }, 'plugin': { zh: '浏览器插件', en: 'Browser Plugin' },
  'local': { zh: '本地部署', en: 'Self-hosted' },
};
const hardwareMap: Record<string, { zh: string; en: string; icon: string; color: string }> = {
  'none': { zh: '无需额外硬件', en: 'No extra hardware', icon: '✅', color: '#36D399' },
  'low': { zh: '低配即可', en: 'Low Config', icon: '✅', color: '#36D399' },
  'medium': { zh: '中等配置', en: 'Mid Config', icon: '️', color: '#FB923C' },
  'high': { zh: '需要高配', en: 'High Config', icon: '', color: '#EF4444' },
};
const learnMap: Record<string, { zh: string; en: string; icon: string; color: string }> = {
  'easy': { zh: '上手简单', en: 'Easy to Use', icon: '🟢', color: '#36D399' },
  'medium': { zh: '需要一定学习', en: 'Moderate', icon: '🟡', color: '#FB923C' },
  'hard': { zh: '学习曲线陡峭', en: 'Steep', icon: '🔴', color: '#EF4444' },
};
const cnAccessMap: Record<string, { zh: string; en: string; color: string }> = {
  'accessible': { zh: '国内可直接', en: 'Accessible', color: '#36D399' },
  'limited': { zh: '国内部分可用', en: 'Limited', color: '#FB923C' },
  'blocked': { zh: '需要特殊访问', en: 'Requires VPN', color: '#EF4444' },
};

function InfoCard({ badge, badgeColor, title, subtitle, children }: { badge?: string; badgeColor?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:shadow-sm transition-shadow">
      {badge && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-md mb-2 font-medium"
          style={{ background: (badgeColor || '#165DFF') + '15', color: badgeColor || '#165DFF' }}>
          {badge}
        </span>
      )}
      <h3 className="text-sm font-bold mb-1" style={{ color: '#0E3A7A' }}>{title}</h3>
      {subtitle && <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export default async function ToolDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';
  const tool = await cachedQuery('tool-' + slug + '-v2', () => getToolBySlug(slug, locale), 600);
  if (!tool) notFound();

  const relatedTools = await getRelatedTools(tool.category, tool.sub_category, tool.slug, locale);



  const displayName = tool.name; // 已由 selectLocaleFields 处理
  const displayDescription = tool.description; // 已由 selectLocaleFields 处理
  const displayDetail = isZh ? tool.detail : (tool.detail_en || tool.detail);
  const isAbnormal = tool.status === 'inactive' || tool.status === 'broken';

  const breadcrumb: { label: string; href?: string }[] = [
    { label: isZh ? '首页' : 'Home', href: '/' + locale },
    { label: isZh ? 'AI工具' : 'AI Tools', href: '/' + locale + '/search' },
  ];
  if (tool.category) {
    breadcrumb.push({ label: tool.category, href: '/' + locale + '/category/' + tool.category });
  }
  breadcrumb.push({ label: displayName });

  const opcScenarios = safeJsonParse(tool.opc_scenario, []); // 已由 selectLocaleFields 处理
  const coreCapabilities = safeJsonParse(tool.core_capabilities, []); // 已由 selectLocaleFields 处理
  const businessQuestions = safeJsonParse(tool.business_question_list, []); // 已由 selectLocaleFields 处理
  const pros = safeJsonParse(tool.pros, []); // 已由 selectLocaleFields 处理
  const cons = safeJsonParse(tool.cons, []); // 已由 selectLocaleFields 处理
  const tags = safeJsonParse(tool.tags, []);

  // Note fields — empty or "待补充" means hide UI
  const noteFields = {
    copyright: (tool.copyright_note && tool.copyright_note !== '待补充') ? tool.copyright_note : '',
    pricing: (tool.pricing_note && tool.pricing_note !== '待补充') ? tool.pricing_note : '',
    access: (tool.access_note && tool.access_note !== '待补充') ? tool.access_note : '',
    difficulty: (tool.difficulty_note && tool.difficulty_note !== '待补充') ? tool.difficulty_note : '',
    hardware: (tool.hardware_note && tool.hardware_note !== '待补充') ? tool.hardware_note : '',
    capability: (tool.capability_note && tool.capability_note !== '待补充') ? tool.capability_note : '',
    scenario: (tool.scenario_note && tool.scenario_note !== '待补充') ? tool.scenario_note : '',
  };

  const runMode = runModeMap[tool.run_mode || ''] || null;
  const hardware = hardwareMap[tool.hardware_level || ''] || null;
  const learn = learnMap[tool.learn_level || ''] || null;
  const cnAccess = cnAccessMap[tool.cn_access || ''] || null;
  const isBlocked = tool.cn_access === 'blocked';

  const opcForOPC = tool.pricing === 'Free' || tool.pricing === 'Freemium';

  return (
    <>
      <ToolJsonLd tool={tool} isZh={isZh} />

      {/* Blocked warning banner */}
      {isBlocked && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm font-medium" style={{ color: '#92400E' }}>
          ⚠️ {isZh ? '该工具在中国大陆访问存在限制，请知悉。' : 'This tool has access restrictions in mainland China.'}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
          {breadcrumb.map(function(crumb, i) {
            if (crumb.href) {
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span>/</span>}
                  <a href={crumb.href} className="hover:text-[#165DFF] transition">{crumb.label}</a>
                </span>
              );
            }
            return (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span className="font-medium" style={{ color: '#0E3A7A' }}>{crumb.label}</span>
              </span>
            );
          })}
        </nav>
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ========== MAIN CONTENT ========== */}
          <div className="flex-1 min-w-0">

            {/* 1. Header Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:p-5 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <img src={tool.icon_url || '/logo-icon.svg'} alt={displayName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg md:text-xl font-bold" style={{ color: '#0E3A7A' }}>{displayName}</h1>
                    {tool.pricing && (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{
                        borderColor: tool.pricing === 'Paid' ? '#FB923C' : tool.pricing === 'Freemium' ? '#165DFF' : '#36D399',
                        color: tool.pricing === 'Paid' ? '#FB923C' : tool.pricing === 'Freemium' ? '#165DFF' : '#36D399',
                      }}>{tool.pricing}</span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{displayDescription}</p>
                </div>
              </div>

              {/* Quick-decision pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {learn && (
                  <span className="text-xs px-2 py-1 rounded-full border border-[#E5E7EB]" style={{ color: learn.color }}>
                    {learn.icon} {isZh ? '上手' : 'Learn'}: {learn[isZh ? 'zh' : 'en']}
                  </span>
                )}
                {tool.commercial_notice && (
                  <span className="text-xs px-2 py-1 rounded-full border border-[#E5E7EB]" style={{ color: '#6B7280' }}>
                    © {isZh ? '商用' : 'Commercial'}
                  </span>
                )}
                {runMode && (
                  <span className="text-xs px-2 py-1 rounded-full border border-[#E5E7EB]" style={{ color: '#4E5969' }}>
                    🌐 {runMode[isZh ? 'zh' : 'en']}
                  </span>
                )}
                {opcForOPC && (
                  <span className="text-xs px-2 py-1 rounded-full border border-[#E5E7EB]" style={{ color: '#165DFF' }}>
                    ✓ {isZh ? '适合OPC' : 'OPC-Friendly'}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow"
                  className="text-sm px-4 py-2 rounded-xl font-medium text-white transition hover:opacity-90"
                  style={{ background: '#165DFF' }}>
                  🔗 {isZh ? '访问官网' : 'Visit Site'}
                </a>
                <CopyPromptButton
                  toolName={displayName}
                  shortIntro={displayDescription || ''}
                  opcScenarios={opcScenarios}
                />
              </div>
            </div>

            {/* 2. OPC Scenarios */}
            {opcScenarios.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  ✨ {isZh ? '适合OPC业务场景' : 'Best for OPC'}
                </h2>
                <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
                  {isZh ? '点击问题跳转到对应工具筛选页' : 'Click to filter tools for this scenario'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {opcScenarios.map((q: string, i: number) => (
                    <a key={i} href={'/' + locale + '/search?q=' + encodeURIComponent(q)}
                      className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                      style={{ background: 'rgba(22,93,255,0.06)', color: '#165DFF' }}>
                      {q}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Core Capabilities */}
            {coreCapabilities.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  📋 {isZh ? '核心能力' : 'Core Capabilities'}
                </h2>
                <ul className="space-y-1">
                  {coreCapabilities.map((cap: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#4E5969' }}>
                      <span style={{ color: '#165DFF' }}>•</span><span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Hardware & Learn Info */}
            {(runMode || hardware || learn || noteFields.hardware || noteFields.difficulty || noteFields.capability) && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  ️ {isZh ? '硬件与上手说明' : 'Hardware & Setup'}
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {runMode && (
                    <div>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{isZh ? '运行方式' : 'Run Mode'}</span>
                      <p className="font-medium" style={{ color: '#0E3A7A' }}>{runMode[isZh ? 'zh' : 'en']}</p>
                      {noteFields.hardware && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{noteFields.hardware}</p>}
                    </div>
                  )}
                  {hardware && (
                    <div>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{isZh ? '硬件消耗' : 'Hardware'}</span>
                      <p className="font-medium" style={{ color: hardware.color }}>{hardware.icon} {hardware[isZh ? 'zh' : 'en']}</p>
                    </div>
                  )}
                  {learn && (
                    <div>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{isZh ? '上手难度' : 'Difficulty'}</span>
                      <p className="font-medium" style={{ color: learn.color }}>{learn.icon} {learn[isZh ? 'zh' : 'en']}</p>
                      {noteFields.difficulty && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{noteFields.difficulty}</p>}
                    </div>
                  )}
                </div>
                {noteFields.capability && (
                  <div className="mt-2 pt-2 border-t border-[#F3F4F6]">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{isZh ? '能力说明' : 'Capability Note'}</span>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{noteFields.capability}</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Pros/Cons + Payment side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {(pros.length > 0 || cons.length > 0) && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                  <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                    {isZh ? '优缺点' : 'Pros & Cons'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pros.length > 0 && (
                      <div className="rounded-xl p-3" style={{ background: 'rgba(54,211,153,0.06)' }}>
                        <span className="text-xs font-medium" style={{ color: '#36D399' }}>✅ {isZh ? '优点' : 'Pros'}</span>
                        <ul className="mt-1 space-y-1">
                          {pros.map((p: string, i: number) => (
                            <li key={i} className="text-xs flex items-start gap-1" style={{ color: '#4E5969' }}>
                              <span style={{ color: '#36D399' }}>+</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.06)' }}>
                        <span className="text-xs font-medium" style={{ color: '#A855F7' }}>❌ {isZh ? '缺点' : 'Cons'}</span>
                        <ul className="mt-1 space-y-1">
                          {cons.map((c: string, i: number) => (
                            <li key={i} className="text-xs flex items-start gap-1" style={{ color: '#4E5969' }}>
                              <span style={{ color: '#A855F7' }}>-</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tool.payment_info && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                  <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                    💰 {isZh ? '付费模式' : 'Pricing'}
                  </h2>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#4E5969' }}>{tool.payment_info}</p>
                  {noteFields.pricing && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                      <p className="text-xs" style={{ color: '#92400E' }}>⚠️ {noteFields.pricing}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Detailed Description */}
            {displayDetail && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  📖 {isZh ? '详细介绍' : 'Details'}
                </h2>
                <div className="whitespace-pre-wrap text-sm" style={{ color: '#4E5969', lineHeight: '1.7' }}>{displayDetail}</div>
              </div>
            )}

            {/* 7. Tags */}
            {tags.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  🏷️ {isZh ? '标签' : 'Tags'}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB]" style={{ color: '#4E5969' }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Ad */}
            <div className="mb-4"><BannerAd slot="inline" isZh={isZh} /></div>

            {/* 8. Score */}
            <div className="mb-4">
              <ScoreRate toolSlug={tool.slug} toolName={tool.name} category={tool.category} isZh={isZh} />
            </div>

            {/* 9. Alternative Tools */}
            {relatedTools.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold mb-2" style={{ color: '#0E3A7A' }}>
                  🔁 {isZh ? '同类平替工具' : 'Alternative Tools'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {relatedTools.slice(0, 8).map((t: any) => {
                    const tName = isZh ? t.name : (t.name_en || t.name);
                    return (
                      <a key={t.id} href={'/' + locale + '/tool/' + t.slug}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#E5E7EB] transition hover:shadow-sm hover:border-[#165DFF]"
                        style={{ color: '#165DFF' }}>{tName}</a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 10. More Related Tools Grid */}
            {relatedTools.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold mb-3" style={{ color: '#0E3A7A' }}>
                  📌 {isZh ? '更多同类工具' : 'More Related Tools'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {relatedTools.map((t: any) => (
                    <ToolCard key={t.id} tool={t} isZh={isZh} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========== RIGHT STICKY SIDEBAR ========== */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 space-y-3">

              {/* Access status + Commercial notice */}
              {(cnAccess || tool.commercial_notice || noteFields.access || noteFields.copyright) && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                  {cnAccess && (
                    <div className="mb-3">
                      <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                        {isZh ? '国内访问' : 'CN Access'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: cnAccess.color }}></span>
                        <span className="text-sm font-medium" style={{ color: cnAccess.color }}>{cnAccess[isZh ? 'zh' : 'en']}</span>
                      </div>
                      {noteFields.access && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{noteFields.access}</p>}
                    </div>
                  )}
                  {tool.commercial_notice && (
                    <div className="rounded-lg p-2.5 mb-2" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                      <span className="text-xs font-medium" style={{ color: '#FB923C' }}>© {isZh ? '商用提示' : 'Commercial'}</span>
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{tool.commercial_notice}</p>
                    </div>
                  )}
                  {noteFields.copyright && !tool.commercial_notice && (
                    <div className="rounded-lg p-2.5" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                      <p className="text-xs" style={{ color: '#92400E' }}>⚠️ {noteFields.copyright}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Business Questions */}
              {businessQuestions.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                  <h4 className="text-xs font-bold mb-2" style={{ color: '#0E3A7A' }}>
                    🎯 {isZh ? '业务问题' : 'Business Q&A'}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {businessQuestions.slice(0, 8).map((q: string, i: number) => (
                      <a key={i} href={'/' + locale + '/search?q=' + encodeURIComponent(q)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] transition hover:border-[#165DFF] hover:shadow-sm"
                        style={{ color: '#165DFF' }}>{q}</a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick related tools */}
              {relatedTools.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
                  <h4 className="text-xs font-bold mb-2" style={{ color: '#0E3A7A' }}>
                    🔁 {isZh ? '相关工具' : 'Related'}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {relatedTools.slice(0, 5).map((t: any) => {
                      const tName = isZh ? t.name : (t.name_en || t.name);
                      return (
                        <a key={t.id} href={'/' + locale + '/tool/' + t.slug}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] transition hover:border-[#165DFF] hover:shadow-sm truncate"
                          style={{ color: '#4E5969' }}>{tName}</a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
