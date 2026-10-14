import { getToolBySlug, getRelatedTools } from '@/lib/d1/queries';
import { getTools } from '@/lib/d1/queries';
import { cachedQuery } from '@/lib/d1/cache';
import { notFound } from 'next/navigation';
import { ToolCard } from '@/components/tool/ToolCard';

interface Props {
  params: Promise<{ locale: string; slugA: string; slugB: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, slugA, slugB } = await params;
  const isZh = locale === 'zh';
  const [toolA, toolB] = await Promise.all([
    getToolBySlug(slugA, locale),
    getToolBySlug(slugB, locale),
  ]);
  if (!toolA || !toolB) return { title: 'Compare Not Found' };
  return {
    title: isZh
      ? `${toolA.name} vs ${toolB.name} - 全面对比评测 | AIQury`
      : `${toolA.name} vs ${toolB.name} - Full Comparison | AIQury`,
    description: isZh
      ? `${toolA.name} 和 ${toolB.name} 怎么选？从功能、定价、评分、优缺点多维度对比，帮你快速决策。`
      : `Choosing between ${toolA.name} and ${toolB.name}? Compare features, pricing, ratings, pros & cons side by side.`,
    alternates: {
      languages: {
        'zh': `https://aiqury.com/zh/compare/${slugA}/${slugB}`,
        'en': `https://aiqury.com/en/compare/${slugA}/${slugB}`,
        'x-default': `https://aiqury.com/en/compare/${slugA}/${slugB}`,
      },
    },
  };
}

function safeArr(str: any): string[] {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return str.includes('|') ? str.split('|').map((s: string) => s.trim()).filter(Boolean) : []; }
}

const pricingColors: Record<string, string> = {
  'Free': '#36D399', 'Freemium': '#165DFF', 'Paid': '#FB923C',
};
const pricingRank: Record<string, number> = { 'Free': 3, 'Freemium': 2, 'Paid': 1 };

function CompareBar({ label, valA, valB, isZh }: { label: string; valA: number; valB: number; isZh: boolean }) {
  const max = Math.max(valA, valB, 1);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#0E3A7A' }} className="font-medium">{label}</span>
        <span style={{ color: '#9CA3AF' }}>{valA.toFixed(1)} vs {valB.toFixed(1)}</span>
      </div>
      <div className="flex gap-1 items-center">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(valA / max) * 100}%`, background: '#165DFF' }} />
        </div>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(valB / max) * 100}%`, background: '#A855F7' }} />
        </div>
      </div>
    </div>
  );
}

function SvgBarChart({ items, isZh }: { items: { name: string; score: number; color: string }[]; isZh: boolean }) {
  const maxScore = Math.max(...items.map(i => i.score), 1);
  const barHeight = 24;
  const gap = 8;
  const labelWidth = 100;
  const chartWidth = 300;
  const totalHeight = items.length * (barHeight + gap);

  return (
    <svg viewBox={`0 0 ${labelWidth + chartWidth + 40} ${totalHeight + 10}`} className="w-full" style={{ maxHeight: '220px' }}>
      {items.map((item, idx) => {
        const y = idx * (barHeight + gap);
        const barW = (item.score / maxScore) * chartWidth;
        return (
          <g key={idx}>
            <text x={labelWidth - 4} y={y + barHeight / 2 + 4} textAnchor="end" className="text-[10px]" fill="#4E5969">{item.name}</text>
            <rect x={labelWidth} y={y} width={chartWidth} height={barHeight} rx={4} fill="#F3F4F6" />
            <rect x={labelWidth} y={y} width={barW} height={barHeight} rx={4} fill={item.color} />
            <text x={labelWidth + barW + 6} y={y + barHeight / 2 + 4} className="text-[10px] font-medium" fill={item.color}>{item.score.toFixed(1)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function ComparePage({ params }: Props) {
  const { locale, slugA, slugB } = await params;
  const isZh = locale === 'zh';
  const [toolA, toolB] = await Promise.all([
    cachedQuery('cmp-' + slugA + '-v2', () => getToolBySlug(slugA, locale), 600),
    cachedQuery('cmp-' + slugB + '-v2', () => getToolBySlug(slugB, locale), 600),
  ]);
  if (!toolA || !toolB) notFound();

  const nameA = toolA.name;
  const nameB = toolB.name;
  const prosA = safeArr(toolA.pros);
  const consA = safeArr(toolA.cons);
  const prosB = safeArr(toolB.pros);
  const consB = safeArr(toolB.cons);

  const ratingA = toolA.rating || 0;
  const ratingB = toolB.rating || 0;

  // Get category for "other tools in this category" section
  const category = toolA.category || 'general';
  const topInCategory = await cachedQuery(
    'cmp-cat-' + category + '-v1',
    () => getTools({ category, limit: 10, locale }),
    600
  );
  const otherToolsInCategory = topInCategory.filter(
    (t: any) => t.slug !== slugA && t.slug !== slugB
  ).slice(0, 6);

  // Deterministic verdict
  let hash = 0;
  for (let i = 0; i < (slugA + slugB).length; i++) {
    hash = ((hash << 5) - hash) + (slugA + slugB).charCodeAt(i);
    hash = hash & hash;
  }
  const winnerRating = ratingA > ratingB ? nameA : ratingB > ratingA ? nameB : null;
  const winnerPricing = (pricingRank[toolA.pricing || ''] || 0) > (pricingRank[toolB.pricing || ''] || 0) ? nameA : (pricingRank[toolB.pricing || ''] || 0) > (pricingRank[toolA.pricing || ''] || 0) ? nameB : null;

  const verdictTemplates_zh = [
    `综合来看，${winnerRating || nameA}在用户评分上更胜一筹；而${winnerPricing || nameB}在性价比方面表现更好。建议根据个人需求和预算来选择。`,
    `两款工具各有优势。${nameA}的用户评分为${ratingA.toFixed(1)}分，${nameB}为${ratingB.toFixed(1)}分。如果你追求性价比，${toolA.pricing === 'Free' ? nameA : toolB.pricing === 'Free' ? nameB : nameA}的免费方案值得一试。`,
    `选择${nameA}还是${nameB}取决于你的具体场景。${ratingA > ratingB ? nameA + '的用户口碑更好' : ratingB > ratingA ? nameB + '的用户口碑更好' : '两者评分接近'}，建议先试用再决定。`,
  ];
  const verdictTemplates_en = [
    `Overall, ${winnerRating || nameA} leads in user ratings; while ${winnerPricing || nameB} offers better value. Choose based on your needs and budget.`,
    `Both have strengths. ${nameA} scores ${ratingA.toFixed(1)}, ${nameB} scores ${ratingB.toFixed(1)}. If you value affordability, ${toolA.pricing === 'Free' ? nameA : toolB.pricing === 'Free' ? nameB : nameA}'s free tier is worth trying.`,
    `Choosing between ${nameA} and ${nameB} depends on your use case. ${ratingA > ratingB ? nameA + ' has better reviews' : ratingB > ratingA ? nameB + ' has better reviews' : 'Both are similarly rated'} — try both before deciding.`,
  ];
  const verdict = isZh ? verdictTemplates_zh[Math.abs(hash) % 3] : verdictTemplates_en[Math.abs(hash) % 3];

  // Comparison dimensions
  const dimensions = [
    { label: isZh ? '用户评分' : 'User Rating', a: ratingA, b: ratingB },
    { label: isZh ? '性价比' : 'Value', a: (pricingRank[toolA.pricing || ''] || 1.5) * 3.3, b: (pricingRank[toolB.pricing || ''] || 1.5) * 3.3 },
    { label: isZh ? '功能丰富度' : 'Features', a: Math.min(prosA.length * 2.5 + 3, 10), b: Math.min(prosB.length * 2.5 + 3, 10) },
    { label: isZh ? '上手难度' : 'Ease of Use', a: toolA.learning_curve === 'easy' ? 9 : toolA.learning_curve === 'medium' ? 6 : 3, b: toolB.learning_curve === 'easy' ? 9 : toolB.learning_curve === 'medium' ? 6 : 3 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
        <a href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</a>
        <span>/</span>
        <a href={'/' + locale + '/category/' + category} className="hover:text-[#165DFF] transition">{category}</a>
        <span>/</span>
        <span className="font-medium" style={{ color: '#0E3A7A' }}>
          {nameA} vs {nameB}
        </span>
      </nav>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#0E3A7A' }}>
          {nameA} <span style={{ color: '#165DFF' }}>vs</span> {nameB}
        </h1>
        <p className="text-sm max-w-2xl mx-auto" style={{ color: '#6B7280' }}>{verdict}</p>
        {winnerRating && (
          <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(22,93,255,0.08)', color: '#165DFF' }}>
            🏆 {isZh ? `${winnerRating} 综合评分更高` : `${winnerRating} has higher rating`}
          </div>
        )}
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="overview">
        {[toolA, toolB].map((tool, idx) => {
          const pricingColor = pricingColors[tool.pricing || ''] || '#6B7280';
          return (
            <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 relative overflow-hidden">
              {idx === 0 && <div className="absolute top-0 left-0 w-full h-1" style={{ background: '#165DFF' }} />}
              {idx === 1 && <div className="absolute top-0 left-0 w-full h-1" style={{ background: '#A855F7' }} />}
              <div className="flex items-center gap-3 mb-3">
                <img src={tool.icon_url || '/logo-icon.svg'} alt={tool.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#0E3A7A' }}>{tool.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                      style={{ borderColor: pricingColor + '60', color: pricingColor }}>
                      {tool.pricing || 'Free'}
                    </span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>⭐ {(tool.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm mb-3 line-clamp-3" style={{ color: '#6B7280' }}>{tool.description}</p>
              <div className="flex gap-2">
                <a href={tool.url} target="_blank" rel="noopener noreferrer nofollow"
                  className="inline-block text-sm px-4 py-2 rounded-xl font-medium text-white"
                  style={{ background: idx === 0 ? '#165DFF' : '#A855F7' }}>
                  {isZh ? '访问官网' : 'Visit Site'}
                </a>
                <a href={'/' + locale + '/tool/' + tool.slug}
                  className="inline-block text-sm px-4 py-2 rounded-xl font-medium border border-[#E5E7EB] hover:border-[#165DFF] transition"
                  style={{ color: '#4E5969' }}>
                  {isZh ? '查看详情' : 'Details'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual comparison bars */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6" id="capabilities">
        <h3 className="text-sm font-bold mb-4" style={{ color: '#0E3A7A' }}>
          📊 {isZh ? '多维度对比' : 'Multi-Dimension Comparison'}
        </h3>
        <div className="flex gap-2 mb-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#165DFF' }}></span> {nameA}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#A855F7' }}></span> {nameB}</span>
        </div>
        {dimensions.map((d, i) => (
          <CompareBar key={i} label={d.label} valA={d.a} valB={d.b} isZh={isZh} />
        ))}
      </div>

      {/* Category ranking SVG chart */}
      {otherToolsInCategory.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#0E3A7A' }}>
            📈 {isZh ? `${category} 分类评分排行` : `${category} Category Rating`}
          </h3>
          <SvgBarChart
            isZh={isZh}
            items={[
              { name: nameA, score: ratingA, color: '#165DFF' },
              { name: nameB, score: ratingB, color: '#A855F7' },
              ...otherToolsInCategory.slice(0, 4).map((t: any) => ({
                name: t.name, score: t.rating || 0, color: '#E5E7EB'
              }))
            ]}
          />
        </div>
      )}

      {/* Detailed comparison table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6" id="details">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#0E3A7A' }}>
          📋 {isZh ? '详细对比' : 'Detailed Comparison'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left text-xs font-medium" style={{ color: '#9CA3AF' }}>{isZh ? '维度' : 'Dimension'}</th>
                <th className="py-2 px-3 text-left text-xs font-medium" style={{ color: '#165DFF' }}>{nameA}</th>
                <th className="py-2 px-3 text-left text-xs font-medium" style={{ color: '#A855F7' }}>{nameB}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: isZh ? '定价' : 'Pricing', a: toolA.pricing || 'Free', b: toolB.pricing || 'Free' },
                { label: isZh ? '评分' : 'Rating', a: `${ratingA.toFixed(1)} ⭐`, b: `${ratingB.toFixed(1)} ⭐` },
                { label: isZh ? '分类' : 'Category', a: toolA.category || '-', b: toolB.category || '-' },
                { label: isZh ? '运行方式' : 'Run Mode', a: toolA.run_mode || '-', b: toolB.run_mode || '-' },
                { label: isZh ? '学习难度' : 'Learning', a: toolA.learning_curve || '-', b: toolB.learning_curve || '-' },
                { label: isZh ? '硬件需求' : 'Hardware', a: toolA.hardware_requirement || '-', b: toolB.hardware_requirement || '-' },
                { label: isZh ? '优点数量' : 'Pros', a: `${prosA.length}`, b: `${prosB.length}` },
                { label: isZh ? '国内访问' : 'CN Access', a: toolA.cn_access || '-', b: toolB.cn_access || '-' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium text-xs" style={{ color: '#9CA3AF' }}>{row.label}</td>
                  <td className="py-2.5 px-3 text-xs" style={{ color: '#4E5969' }}>{row.a}</td>
                  <td className="py-2.5 px-3 text-xs" style={{ color: '#4E5969' }}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pros/Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="reviews">
        {[
          { name: nameA, pros: prosA, cons: consA, color: '#165DFF' },
          { name: nameB, pros: prosB, cons: consB, color: '#A855F7' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <h4 className="text-sm font-bold" style={{ color: '#0E3A7A' }}>{item.name}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {item.pros.length > 0 && (
                <div>
                  <span className="text-xs font-medium" style={{ color: '#36D399' }}>✅ {isZh ? '优点' : 'Pros'}</span>
                  <ul className="mt-1.5 space-y-1">
                    {item.pros.slice(0, 5).map((p: string, i: number) => (
                      <li key={i} className="text-xs leading-relaxed" style={{ color: '#4E5969' }}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.cons.length > 0 && (
                <div>
                  <span className="text-xs font-medium" style={{ color: '#A855F7' }}>❌ {isZh ? '缺点' : 'Cons'}</span>
                  <ul className="mt-1.5 space-y-1">
                    {item.cons.slice(0, 5).map((c: string, i: number) => (
                      <li key={i} className="text-xs leading-relaxed" style={{ color: '#4E5969' }}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Other tools in same category */}
      {otherToolsInCategory.length > 0 && (
        <div className="mb-6" id="related">
          <h2 className="text-sm font-bold mb-3" style={{ color: '#0E3A7A' }}>
            📌 {isZh ? `${category} 分类其他工具` : `Other ${category} Tools`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherToolsInCategory.map((t: any) => (
              <ToolCard key={t.id} tool={t} isZh={isZh} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center py-4">
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
          {isZh ? '还没找到满意的工具？' : "Can't find the right tool?"}
        </p>
        <div className="flex justify-center gap-3">
          <a href={'/' + locale + '/category/' + category}
            className="text-sm px-5 py-2 rounded-xl font-medium text-white"
            style={{ background: '#165DFF' }}>
            {isZh ? `浏览更多${category}工具` : `Browse more ${category} tools`}
          </a>
          <a href={'/' + locale + '/search?q=' + encodeURIComponent(nameA)}
            className="text-sm px-5 py-2 rounded-xl font-medium border border-[#E5E7EB] hover:border-[#165DFF] transition"
            style={{ color: '#4E5969' }}>
            {isZh ? `搜索${nameA}相关` : `Search ${nameA}`}
          </a>
        </div>
      </div>
    </div>
  );
}
