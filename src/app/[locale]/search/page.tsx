
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/search`;
  const isZh = locale === 'zh';
  const title = isZh ? 'AIqury - 用业务问题找AI工具 | 一人公司OPC创业必备AI工具导航' : 'AIqury - Find AI Tools By Your Questions | Solo OPC Founder Essential AI Tools Directory';
  const description = isZh ? 'AIqury是面向一人公司、跨境电商和自媒体的AI工具导航平台。' : 'AIqury is an AI tools navigation platform for solo OPC founders.';
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/search`,
        'en': `${SITE_URL}/en/search`,
        'x-default': `${SITE_URL}/en/search`,
      },
    },
  };
}

import { searchTools } from '@/lib/d1/queries';
import {ToolCard} from '@/components/tool/ToolCard';
import { AdBanner } from '@/components/ads/AdBanner';
import categoriesData from '@/data/categories.json';

interface Props {
  params: Promise<{locale: string}>;
  searchParams: Promise<{q?: string; category?: string}>;
}

export default async function SearchPage({params, searchParams}: Props) {
  const {locale} = await params;
  const {q, category} = await searchParams;
  const isZh = locale === 'zh';

  let tools: any[] = [];
  let isFallback = false;
  
  if (q && q.trim()) {
    tools = await searchTools(q, locale);
    
    // 如果有分类过滤，在内存中过滤
    if (category) {
      tools = tools.filter(t => t.category === category);
    }
    
    // 无结果时，按分类推荐同类工具
    if (tools.length === 0 && category) {
      const { getTools } = await import('@/lib/d1/queries');
      tools = await getTools({ category, limit: 12, locale });
      isFallback = true;
    } else if (tools.length === 0) {
      // 无分类时推荐热门工具
      const { getTools } = await import('@/lib/d1/queries');
      tools = await getTools({ isHot: true, limit: 12, locale });
      isFallback = true;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4" style={{color: '#0E3A7A'}}>
            {isZh ? '搜索 AI 工具' : 'Search AI Tools'}
          </h1>
          
          {/* Search Form */}
          <form action={`/search`} method="GET" className="flex gap-3 mb-6">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={isZh ? '输入工具名称、描述或标签...' : 'Enter tool name, description or tags...'}
              className="flex-1 px-4 py-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
              style={{background: 'white'}}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-medium transition"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
            >
              {isZh ? '搜索' : 'Search'}
            </button>
          </form>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`/search${q ? `?q=${q}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !category ? 'bg-[#0E3A7A] text-white' : 'bg-white border border-[var(--border-color)] text-[var(--text-body)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {isZh ? '全部分类' : 'All Categories'}
            </a>
            {categoriesData.categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/search${q ? `?q=${q}&` : '?'}category=${cat.slug}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  category === cat.slug ? 'bg-[#0E3A7A] text-white' : 'bg-white border border-[var(--border-color)] text-[var(--text-body)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {isZh ? cat.name : cat.name_en}
              </a>
            ))}
          </div>
        </div>

        {/* Results */}
        {q && q.trim() ? (
          <>
            <div className="mb-6">
              <p className="text-sm" style={{color: 'var(--text-muted)'}}>
                {isFallback
                  ? (isZh ? '未找到精确匹配，为你推荐 ' + tools.length + ' 个相关工具' : 'No exact match, showing ' + tools.length + ' recommended tools')
                  : (isZh ? '找到 ' + tools.length + ' 个相关工具' : 'Found ' + tools.length + ' related tools')}
              </p>
            </div>

            {/* Header Ad */}
            <div className="mb-6">
              <AdBanner slot="header" isZh={isZh} />
            </div>

            {tools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool, idx) => (
                  <div key={tool.id}>
                    <ToolCard tool={tool} isZh={isZh} />
                    {idx === 7 && <div className="col-span-full mt-2"><AdBanner slot="inline" isZh={isZh} /></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto mb-4" style={{color: 'var(--text-muted)'}} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <p className="text-base mb-2" style={{color: 'var(--text-muted)'}}>
                  {isZh ? '没有找到相关工具' : 'No tools found'}
                </p>
                <p className="text-sm" style={{color: 'var(--text-muted)'}}>
                  {isZh ? '试试其他关键词或浏览所有分类' : 'Try different keywords or browse all categories'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4" style={{color: 'var(--text-muted)'}} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <p className="text-base" style={{color: 'var(--text-muted)'}}>
              {isZh ? '输入关键词开始搜索' : 'Enter keywords to start searching'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
