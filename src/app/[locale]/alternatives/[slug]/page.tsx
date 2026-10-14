import { getToolBySlug, getRelatedTools } from '@/lib/d1/queries';
import { cachedQuery } from '@/lib/d1/cache';
import { ToolCard } from '@/components/tool/ToolCard';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';
  const tool = await getToolBySlug(slug, locale);
  if (!tool) return { title: 'Tool Not Found' };
  const displayName = tool.name;
  return {
    title: isZh
      ? `${displayName} 最佳替代方案 | 同类工具推荐 - AIQury`
      : `Best ${displayName} Alternatives | Similar Tools - AIQury`,
    description: isZh
      ? `正在寻找 ${displayName} 的替代方案？对比功能、价格、优缺点，找到最适合你的同类工具。`
      : `Looking for ${displayName} alternatives? Compare features, pricing, and pros/cons to find the best similar tool for you.`,
    openGraph: {
      title: isZh
        ? `${displayName} 最佳替代方案 - AIQury`
        : `Best ${displayName} Alternatives - AIQury`,
    },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';
  const tool = await cachedQuery('alt-' + slug + '-v1', () => getToolBySlug(slug, locale), 600);
  if (!tool) notFound();

  const relatedTools = await getRelatedTools(tool.category, tool.sub_category, tool.slug, locale);
  const displayName = tool.name;

  // Generate deterministic hash for varied intro text
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  const introVariants_zh = [
    `${displayName} 是一款优秀的工具，但如果你想探索更多选择，以下同类工具可能更适合你的具体需求。`,
    `除了 ${displayName}，市场上还有许多值得考虑的同类工具。以下是我们的精选推荐。`,
    `正在对比 ${displayName}？这些同类工具在不同维度上各有优势，帮你找到最佳匹配。`,
  ];
  const introVariants_en = [
    `${displayName} is a great tool, but you may want to explore these alternatives that could better fit your specific needs.`,
    `Beyond ${displayName}, there are several worthy alternatives worth considering. Here are our top picks.`,
    `Comparing ${displayName}? These tools each excel in different areas, helping you find the perfect match.`,
  ];
  const introIdx = Math.abs(hash) % introVariants_zh.length;
  const intro = isZh ? introVariants_zh[introIdx] : introVariants_en[introIdx];

  // Computed context
  const avgRating = relatedTools.length > 0
    ? (relatedTools.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) / relatedTools.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
        <a href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</a>
        <span>/</span>
        <a href={'/' + locale + '/tool/' + slug} className="hover:text-[#165DFF] transition">{displayName}</a>
        <span>/</span>
        <span className="font-medium" style={{ color: '#0E3A7A' }}>
          {isZh ? '替代方案' : 'Alternatives'}
        </span>
      </nav>

      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 md:p-6 mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#0E3A7A' }}>
          {isZh ? `${displayName} 替代方案` : `Best ${displayName} Alternatives`}
        </h1>
        <p className="text-sm mb-3" style={{ color: '#6B7280' }}>{intro}</p>

        {/* Current tool summary */}
        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(22,93,255,0.04)', border: '1px solid rgba(22,93,255,0.1)' }}>
          <img src={tool.icon_url || '/logo-icon.svg'} alt={displayName} className="w-10 h-10 rounded-lg object-cover" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: '#0E3A7A' }}>{displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{
                borderColor: tool.pricing === 'Paid' ? '#FB923C' : '#165DFF',
                color: tool.pricing === 'Paid' ? '#FB923C' : '#165DFF',
              }}>{tool.pricing || 'Free'}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{tool.description}</p>
          </div>
          <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow"
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white shrink-0"
            style={{ background: '#165DFF' }}>
            {isZh ? '访问官网' : 'Visit'}
          </a>
        </div>
      </div>

      {/* Alternatives grid */}
      {relatedTools.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#0E3A7A' }}>
              {isZh ? `同类工具推荐（共 ${relatedTools.length} 个，平均评分 ${avgRating}）` : `Similar Tools (${relatedTools.length} alternatives, avg rating ${avgRating})`}
            </h2>
          </div>

          {/* Comparison table for top tools */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse" style={{ minWidth: '600px' }}>
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-3 font-bold" style={{ color: '#0E3A7A' }}>
                    {isZh ? '工具' : 'Tool'}
                  </th>
                  <th className="text-left p-3 font-bold" style={{ color: '#0E3A7A' }}>
                    {isZh ? '简介' : 'Description'}
                  </th>
                  <th className="text-left p-3 font-bold" style={{ color: '#0E3A7A' }}>
                    {isZh ? '定价' : 'Pricing'}
                  </th>
                  <th className="text-left p-3 font-bold" style={{ color: '#0E3A7A' }}>
                    {isZh ? '操作' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatedTools.slice(0, 8).map((t: any, i: number) => {
                  const tName = isZh ? t.name : (t.name_en || t.name);
                  const tDesc = isZh ? t.description : (t.description_en || t.description);
                  return (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img src={t.icon_url || '/logo-icon.svg'} alt={tName} className="w-7 h-7 rounded-lg object-cover" />
                          <a href={'/' + locale + '/tool/' + t.slug} className="font-bold hover:text-[#165DFF] transition" style={{ color: '#0E3A7A' }}>
                            {tName}
                          </a>
                        </div>
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#6B7280', maxWidth: '250px' }}>
                        {tDesc?.slice(0, 80) || ''}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full border" style={{
                          borderColor: t.pricing === 'Paid' ? '#FB923C' : t.pricing === 'Freemium' ? '#165DFF' : '#36D399',
                          color: t.pricing === 'Paid' ? '#FB923C' : t.pricing === 'Freemium' ? '#165DFF' : '#36D399',
                        }}>{t.pricing || 'Free'}</span>
                      </td>
                      <td className="p-3">
                        <a href={'/' + locale + '/tool/' + t.slug}
                          className="text-xs px-3 py-1 rounded-lg font-medium text-white"
                          style={{ background: '#165DFF' }}>
                          {isZh ? '详情' : 'View'}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card grid */}
          <h3 className="text-sm font-bold mb-3" style={{ color: '#0E3A7A' }}>
            {isZh ? '详细对比' : 'Detailed Comparison'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTools.map((t: any) => (
              <ToolCard key={t.id} tool={t} isZh={isZh} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            {isZh ? '暂无同类工具推荐' : 'No similar tools found yet'}
          </p>
        </div>
      )}
    </div>
  );
}
