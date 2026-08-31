
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/category/${slug}`;
  return {
    title: slug,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/category/${slug}`,
        'en': `${SITE_URL}/en/category/${slug}`,
        'x-default': `${SITE_URL}/en/category/${slug}`,
      },
    },
  };
}

import { getTools } from '@/lib/d1/queries';
import { cachedQuery } from '@/lib/d1/cache';
import { ToolCard } from '@/components/tool/ToolCard';
import categoriesData from '@/data/categories.json';
import { notFound } from 'next/navigation';
import { AdBanner } from '@/components/ads/AdBanner';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sub?: string; audience?: string }>;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { sub, audience } = await searchParams;
  const isZh = locale === 'zh';

  const category = categoriesData.categories.find(c => c.slug === slug);
  if (!category) notFound();

  // 使用缓存，5分钟TTL
  const cacheKey = `category-${slug}-${sub || 'all'}-${audience || 'all'}`;
  const tools = await cachedQuery(
    cacheKey,
    () => getTools({
      category: slug,
      subCategory: sub,
      audienceTags: audience ? [audience] : undefined,
      locale: locale,
    }),
    300
  );

  const subCategories = (category as any).sub_categories || [];

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-[var(--border-color)] min-h-[calc(100vh-64px)] py-6 px-4">
        <nav className="space-y-1">
          {categoriesData.categories.map((cat) => {
            const isActive = cat.slug === slug;
            return (
              <a
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition ${
                  isActive ? 'bg-[var(--bg-hover)] font-medium' : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={{ color: isActive ? '#0E3A7A' : 'var(--text-body)' }}
              >
                <img 
                  src={`/icons/tracks/${cat.slug}.svg`} 
                  alt={cat.name}
                  className="w-5 h-5 shrink-0"
                />
                {isZh ? cat.name : cat.name_en || cat.name}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-6 md:px-10 py-8 max-w-[1400px]">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
          <a href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</a>
          <span>/</span>
          <span className="font-medium" style={{ color: '#0E3A7A' }}>{isZh ? category.name : category.name_en || category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={`/icons/tracks/${slug}.svg`} 
            alt={category.name}
            className="w-10 h-10"
          />
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#0E3A7A' }}>
            {isZh ? category.name : category.name_en || category.name}
          </h1>
        </div>

        {/* Header Ad */}
        <div className="mb-8">
          <AdBanner slot="header" isZh={isZh} />
        </div>

        {/* Sub-category Questions Filter */}
        {subCategories.length > 0 && (
          <div className="mb-8">
            <div className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {isZh ? '常见问题' : 'Common Questions'}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/category/${slug}`}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  !sub ? 'bg-[var(--color-model)] text-white' : 'bg-white border border-[var(--border-color)] text-[var(--text-body)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {isZh ? '全部问题' : 'All Questions'}
              </a>
              {subCategories.map((sc: any) => (
                <a
                  key={sc.slug}
                  href={`/category/${slug}?sub=${sc.slug}`}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    sub === sc.slug ? 'bg-[var(--color-model)] text-white' : 'bg-white border border-[var(--border-color)] text-[var(--text-body)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {isZh ? sc.name : sc.name_en || sc.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tools Grid */}
        {tools.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {tools.slice(0, 12).map((tool: any) => (
                <ToolCard key={tool.id} tool={tool} isZh={isZh} />
              ))}
            </div>
            
            {/* Inline Ad after first 12 tools */}
            {tools.length > 12 && (
              <div className="my-8">
                <AdBanner slot="inline" isZh={isZh} />
              </div>
            )}
            
            {/* Remaining tools */}
            {tools.length > 12 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {tools.slice(12).map((tool: any) => (
                  <ToolCard key={tool.id} tool={tool} isZh={isZh} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-base" style={{ color: 'var(--text-muted)' }}>
              {isZh ? '暂无工具' : 'No tools found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
