
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/agent`;
  const isZh = locale === 'zh';
  const title = isZh ? 'AIqury - 用业务问题找AI工具 | 一人公司OPC创业必备AI工具导航' : 'AIqury - Find AI Tools By Your Questions | Solo OPC Founder Essential AI Tools Directory';
  const description = isZh ? 'AIqury是面向一人公司、跨境电商和自媒体的AI工具导航平台。' : 'AIqury is an AI tools navigation platform for solo OPC founders.';
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/agent`,
        'en': `${SITE_URL}/en/agent`,
        'x-default': `${SITE_URL}/en/agent`,
      },
    },
  };
}

import { getAgents } from '@/lib/d1/agent-queries';
import categoriesData from '@/data/categories.json';
import Link from 'next/link';
import { AdBanner } from '@/components/ads/AdBanner';
import { TrackCardCover } from '@/components/TrackCardCover';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  const agents = await getAgents();
  
  const agentsByTrack: Record<string, any[]> = {};
  agents.forEach((agent: any) => {
    if (!agentsByTrack[agent.track_slug]) {
      agentsByTrack[agent.track_slug] = [];
    }
    agentsByTrack[agent.track_slug].push(agent);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Hero Banner */}
      <div className="relative h-64 mb-8 overflow-hidden">
        <img 
          src="/images/covers/agent-cover.svg" 
          alt={isZh ? 'AI 智能体' : 'AI Agents'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
          <div className="max-w-[1440px] mx-auto px-6 w-full">
            <h1 className="text-4xl font-bold text-white mb-2">
              {isZh ? 'AI 智能体' : 'AI Agents'}
            </h1>
            <p className="text-lg text-white/90">
              {isZh 
                ? '精选 AI 智能体，按赛道分类的自动化助手'
                : 'Featured AI agents, automated assistants categorized by track'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-6">
          <AdBanner slot="header" isZh={isZh} />
        </div>

        <div className="space-y-8">
          {categoriesData.categories.map((category, idx) => {
            const trackAgents = agentsByTrack[category.slug] || [];
            if (trackAgents.length === 0) return null;

            return (
              <div key={category.slug}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`/icons/tracks/${category.slug}.svg`} 
                      alt={category.name}
                      className="w-8 h-8"
                    />
                    <h2 className="text-xl font-bold" style={{ color: '#0E3A7A' }}>
                      {isZh ? category.name : (category.name_en || category.name)}
                    </h2>
                    <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--bg-surface)]" style={{ color: 'var(--text-muted)' }}>
                      {trackAgents.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {trackAgents.slice(0, 6).map((agent: any) => (
                    <Link
                      key={agent.agent_id}
                      href={`/agent/${agent.agent_id}`}
                      className="group block bg-white border border-[var(--border-color)] rounded-xl overflow-hidden hover:shadow-[var(--shadow-md)] transition-all duration-200"
                    >
                      <TrackCardCover 
                        trackSlug={agent.track_slug}
                        isZh={isZh}
                      />

                      <div className="p-5">
                        <h3 className="text-base font-semibold mb-2 group-hover:text-[var(--color-primary)] transition truncate" style={{ color: '#0E3A7A' }}>
                          {isZh ? agent.zh_title : agent.en_title}
                        </h3>
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                          {isZh ? agent.zh_short_desc : agent.en_short_desc}
                        </p>
                        {agent.official_url && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-primary)' }}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                            </svg>
                            <span>{isZh ? '访问官网' : 'Visit Website'}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  
                  {idx % 2 === 1 && <AdBanner slot="inline" isZh={isZh} />}
                </div>
              </div>
            );
          })}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="5"/>
              <path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
            </svg>
            <p className="text-base mb-2" style={{ color: 'var(--text-muted)' }}>
              {isZh ? '暂无智能体' : 'No agents yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
