
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/workflow`;
  const isZh = locale === 'zh';
  const title = isZh ? 'AIqury - 用业务问题找AI工具 | 一人公司OPC创业必备AI工具导航' : 'AIqury - Find AI Tools By Your Questions | Solo OPC Founder Essential AI Tools Directory';
  const description = isZh ? 'AIqury是面向一人公司、跨境电商和自媒体的AI工具导航平台。' : 'AIqury is an AI tools navigation platform for solo OPC founders.';
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/workflow`,
        'en': `${SITE_URL}/en/workflow`,
        'x-default': `${SITE_URL}/en/workflow`,
      },
    },
  };
}

import { getWorkflows } from '@/lib/d1/workflow-queries';
import categoriesData from '@/data/categories.json';
import Link from 'next/link';
import { AdBanner } from '@/components/ads/AdBanner';
import { TrackCardCover } from '@/components/TrackCardCover';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function WorkflowListPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  const workflows = await getWorkflows();
  
  // 按赛道分组
  const workflowsByTrack: Record<string, any[]> = {};
  workflows.forEach((wf: any) => {
    if (!workflowsByTrack[wf.track_slug]) {
      workflowsByTrack[wf.track_slug] = [];
    }
    workflowsByTrack[wf.track_slug].push(wf);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Hero Banner */}
      <div className="relative h-64 mb-8 overflow-hidden">
        <img 
          src="/images/covers/workflow-cover.svg" 
          alt={isZh ? 'AI 工作流' : 'AI Workflows'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
          <div className="max-w-[1440px] mx-auto px-6 w-full">
            <h1 className="text-4xl font-bold text-white mb-2">
              {isZh ? 'AI 工作流' : 'AI Workflows'}
            </h1>
            <p className="text-lg text-white/90">
              {isZh 
                ? '完整的 AI 工具组合方案，按业务场景组合最优工具'
                : 'Complete AI tool combinations for business scenarios'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header Ad */}
        <div className="mb-6">
          <AdBanner slot="header" isZh={isZh} />
        </div>

        {/* 按赛道展示 */}
        <div className="space-y-8">
          {categoriesData.categories.map((category, idx) => {
            const trackWorkflows = workflowsByTrack[category.slug] || [];
            if (trackWorkflows.length === 0) return null;

            return (
              <div key={category.slug}>
                {/* 赛道标题 */}
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
                      {trackWorkflows.length}
                    </span>
                  </div>
                </div>

                {/* 工作流卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {trackWorkflows.slice(0, 3).map((workflow: any) => (
                    <Link
                      key={workflow.workflow_id}
                      href={`/workflow/${workflow.workflow_id}`}
                      className="group block bg-white border border-[var(--border-color)] rounded-xl overflow-hidden hover:shadow-[var(--shadow-md)] transition-all duration-200"
                    >
                      {/* 卡片封面 - 使用赛道专属样式 */}
                      <TrackCardCover 
                        trackSlug={workflow.track_slug} 
                        isOpcSelected={workflow.is_opc_selected}
                        isZh={isZh}
                      />

                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold mb-1 group-hover:text-[var(--color-primary)] transition truncate" style={{ color: '#0E3A7A' }}>
                              {isZh ? workflow.zh_title : workflow.en_title}
                            </h3>
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                              {isZh ? (workflow.output_zh || workflow.zh_title) : (workflow.output_en || workflow.en_title)}
                            </p>
                          </div>
                        </div>

                        {/* 难度和时间 */}
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="px-2 py-0.5 rounded-full border" style={{
                            borderColor: workflow.difficulty === 'hard' ? 'var(--color-paid)' : workflow.difficulty === 'medium' ? 'var(--color-plugin)' : 'var(--color-free)',
                            color: workflow.difficulty === 'hard' ? 'var(--color-paid-text)' : workflow.difficulty === 'medium' ? 'var(--color-plugin-text)' : 'var(--color-free-text)',
                          }}>
                            {isZh 
                              ? (workflow.difficulty === 'hard' ? '复杂' : workflow.difficulty === 'medium' ? '中等' : '简单')
                              : (workflow.difficulty === 'hard' ? 'Hard' : workflow.difficulty === 'medium' ? 'Medium' : 'Simple')}
                          </span>
                          <span>{workflow.time_cost}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {/* 广告卡片插入点 */}
                  {idx % 2 === 1 && <AdBanner slot="inline" isZh={isZh} />}
                </div>
              </div>
            );
          })}
        </div>

        {workflows.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-base mb-2" style={{ color: 'var(--text-muted)' }}>
              {isZh ? '暂无工作流' : 'No workflows yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
