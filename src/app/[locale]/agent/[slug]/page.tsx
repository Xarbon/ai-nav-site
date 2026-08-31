
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/agent/${slug}`;
  return {
    title: slug,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/agent/${slug}`,
        'en': `${SITE_URL}/en/agent/${slug}`,
        'x-default': `${SITE_URL}/en/agent/${slug}`,
      },
    },
  };
}

import { getAgentById } from '@/lib/d1/agent-queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';

  const agent = await getAgentById(slug);

  if (!agent) {
    notFound();
  }

  const category = categoriesData.categories.find((c: any) => c.slug === agent.track_slug);
  const categoryName = isZh ? category?.name : category?.name_en || category?.name;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
          <Link href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</Link>
          <span>/</span>
          <Link href={'/' + locale + '/agent'} className="hover:text-[#165DFF] transition">{isZh ? 'AI智能体' : 'AI Agents'}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: '#0E3A7A' }}>{isZh ? agent.zh_title : agent.en_title}</span>
        </nav>

        {/* Header */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0E3A7A' }}>
            {isZh ? agent.zh_title : agent.en_title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
            <span className="px-3 py-1 rounded-full border" style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-body)',
              background: 'var(--bg-surface)'
            }}>
              {categoryName}
            </span>
            
            {(isZh ? agent.tag_list_zh : agent.tag_list_en)?.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full border" style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}>
                {tag}
              </span>
            ))}
          </div>
<p className="text-base mb-4" style={{ color: 'var(--text-body)' }}>
            {isZh ? agent.zh_short_desc : agent.en_short_desc}
          </p>

          {agent.official_url && (
            <a 
              href={agent.official_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              {isZh ? '访问官网' : 'Visit Website'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
          )}
        </div>

        {/* Capabilities */}
        {(agent.zh_capability || agent.en_capability) && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? '核心能力' : 'Capabilities'}
            </h2>
            <div className="text-base" style={{ color: 'var(--text-body)' }}>
              {isZh ? agent.zh_capability : agent.en_capability}
            </div>
          </div>
        )}

        {/* Limitations */}
        {(agent.zh_limit || agent.en_limit) && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? '使用限制' : 'Limitations'}
            </h2>
            <div className="text-base" style={{ color: 'var(--text-body)' }}>
              {isZh ? agent.zh_limit : agent.en_limit}
            </div>
          </div>
        )}

        {/* Related Workflows */}
        {agent.related_workflow_ids && agent.related_workflow_ids.length > 0 && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? '关联工作流' : 'Related Workflows'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {agent.related_workflow_ids.map((wfId: string, i: number) => (
                <Link
                  key={i}
                  href={`/workflow/${wfId}`}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition hover:shadow-sm"
                  style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    background: 'var(--bg-surface)'
                  }}
                >
                  {wfId}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="text-center">
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {isZh ? '返回智能体列表' : 'Back to Agents'}
          </Link>
        </div>
      </div>
    </div>
  );
}
