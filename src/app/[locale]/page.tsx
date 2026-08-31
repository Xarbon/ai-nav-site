import { getAllTools } from '@/lib/d1/queries';
import { cachedQuery } from '@/lib/d1/cache';
import { ToolCard } from '@/components/tool/ToolCard';
import categoriesData from '@/data/categories.json';
import { AdBanner } from '@/components/ads/AdBanner';
import { NewsSection } from '@/components/news/NewsSection';
import type { Metadata } from 'next';

const SITE_URL = 'https://aiqury.com';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  
  const title = isZh 
    ? 'AIqury - 用业务问题找AI工具 | 一人公司OPC创业必备AI工具导航'
    : 'AIqury - Find AI Tools By Your Questions | Solo OPC Founder Essential AI Tools Directory';
  
  const description = isZh
    ? 'AIqury是面向一人公司、跨境电商和自媒体的AI工具导航平台。按真实业务场景分类，聚合353+AI工具评测、OPC业务问题库、工具组合方案，帮助单人公司快速找到合适的AI生产力工具。涵盖电商、内容创作、量化交易、办公效率等20+赛道。'
    : 'AIqury is an AI tools navigation platform for solo OPC founders, cross-border ecommerce, and content creators. Indexes 353+ AI tools by real business questions, provides tool reviews, OPC business scenario library, and combo solutions. Covers 20+ categories including ecommerce, content creation, quant trading, office productivity, and more.';

  const keywords = isZh 
    ? 'AI工具导航,AI工具推荐,一人公司工具,OPC创业工具,跨境电商AI工具,自媒体AI工具,AI生产力工具,业务场景找工具,ChatGPT工具,AI办公工具,AI设计工具,AI营销工具,独立站工具,AI写作工具,AI视频工具'
    : 'AI tools directory,AI tools recommendation,solo founder tools,OPC startup tools,cross-border ecommerce AI tools,content creator AI tools,AI productivity tools,business scenario AI finder,ChatGPT tools,AI office tools,AI design tools,AI marketing tools,ecommerce tools,AI writing tools,AI video tools';

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'AIqury Team' }],
    publisher: 'AIqury',
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        'zh': `${SITE_URL}/zh`,
        'en': `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: 'AIqury',
      locale: isZh ? 'zh_CN' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: isZh ? 'AIqury - AI工具导航平台' : 'AIqury - AI Tools Directory',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
      creator: '@aiqury',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const isZh = locale === 'zh';

  // 使用缓存，5分钟TTL，减少D1查询
  const allTools = await cachedQuery(
    `all-tools-${isZh ? 'zh' : 'en'}`,
    () => getAllTools(locale),
    300
  );

  // 在内存中分组
  const hotTools = allTools.filter((t: any) => t.is_hot).slice(0, 20);
  const newTools = allTools.filter((t: any) => t.is_new).slice(0, 20);
  const recommendedTools = allTools.filter((t: any) => t.is_recommended).slice(0, 20);

  const categoryTools: Record<string, any[]> = {};
  for (const cat of categoriesData.categories) {
    categoryTools[cat.slug] = allTools.filter((t: any) => t.category === cat.slug).slice(0, 8);
  }

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AIqury',
    alternateName: isZh ? 'AI工具导航' : 'AI Tools Directory',
    url: SITE_URL,
    description: isZh
      ? '面向一人公司、跨境电商和自媒体的AI工具导航，按真实业务场景分类。'
      : 'AI tool navigation for solo OPC founders. Find tools by real business scenarios.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: [isZh ? 'zh-CN' : 'en-US'],
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIqury',
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full.svg`,
    description: isZh
      ? '面向一人公司OPC创业者的AI工具导航平台'
      : 'AI tools navigation platform for solo OPC founders',
    sameAs: [
      'https://www.producthunt.com/@aiqury',
    ],
  };

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="flex">
        {/* Left Sidebar: Categories */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-[var(--border-color)] min-h-[calc(100vh-64px)] py-6 px-4">
          <nav className="space-y-1">
            {categoriesData.categories.map((category) => (
              <a
                key={category.slug}
                href={`/${locale}/category/${category.slug}`}
                className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-body)' }}
              >
                <img 
                  src={`/icons/tracks/${category.slug}.svg`} 
                  alt={isZh ? category.name : (category.name_en || category.name)}
                  className="w-5 h-5 shrink-0"
                />
                {isZh ? category.name : category.name_en || category.name}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-6 md:px-10 py-8 max-w-[1200px]">
          {/* Hero */}
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#0E3A7A' }}>
            {isZh ? '按问题找 AI 工具' : 'Find AI Tools By Your Questions'}
          </h1>
          <p className="text-base md:text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
            {isZh ? '说出你的需求，找到合适的 AI 工具。' : 'Ask what you need to do, get the right AI tool.'}
          </p>

          {/* Search */}
          <form action={`/${locale}/search`} method="GET" className="mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                name="q"
                placeholder={isZh ? '说出你需要做什么...' : 'Ask what you need to do...'}
                className="w-full h-12 pl-12 pr-12 text-base bg-white border border-[var(--border-color)] rounded-full placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-[var(--color-primary)] text-white text-sm font-medium rounded-full hover:opacity-90 transition"
              >
                {isZh ? '搜索' : 'Search'}
              </button>
            </div>
          </form>

          {/* Hot Tools */}
          {hotTools.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#0E3A7A' }}>
                🔥 {isZh ? '热门工具' : 'Hot Tools'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {hotTools.map((tool: any) => (
                  <ToolCard key={tool.id} tool={tool} isZh={isZh} />
                ))}
              </div>
            </section>
          )}

          {/* New Tools */}
          {newTools.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#0E3A7A' }}>
                ✨ {isZh ? '最新工具' : 'New Tools'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {newTools.map((tool: any) => (
                  <ToolCard key={tool.id} tool={tool} isZh={isZh} />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Tools */}
          {recommendedTools.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#0E3A7A' }}>
                👍 {isZh ? '推荐工具' : 'Recommended Tools'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendedTools.map((tool: any) => (
                  <ToolCard key={tool.id} tool={tool} isZh={isZh} />
                ))}
              </div>
            </section>
          )}

          {/* Category Sections */}
          {categoriesData.categories.map((category) => {
            const tools = categoryTools[category.slug];
            if (!tools || tools.length === 0) return null;
            
            return (
              <section key={category.slug} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0E3A7A' }}>
                    <img 
                      src={`/icons/tracks/${category.slug}.svg`} 
                      alt={isZh ? category.name : (category.name_en || category.name)}
                      className="w-6 h-6"
                    />
                    {isZh ? category.name : category.name_en || category.name}
                  </h2>
                  <a 
                    href={`/${locale}/category/${category.slug}`}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {isZh ? '查看更多 →' : 'View More →'}
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tools.map((tool: any) => (
                    <ToolCard key={tool.id} tool={tool} isZh={isZh} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* News Section */}
          <NewsSection isZh={isZh} />
        </div>

        {/* Right Sidebar */}
      </div>
    </>
  );
}
