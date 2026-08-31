
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/skillhub/${slug}`;
  return {
    title: slug,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/skillhub/${slug}`,
        'en': `${SITE_URL}/en/skillhub/${slug}`,
        'x-default': `${SITE_URL}/en/skillhub/${slug}`,
      },
    },
  };
}

import { getSkillById } from '@/lib/d1/skill-queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';
import { CopyButton, CopyPromptButton } from '@/components/workflow/CopyButton';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SkillDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';

  const skill = await getSkillById(slug);

  if (!skill) {
    notFound();
  }

  const category = categoriesData.categories.find((c: any) => c.slug === skill.track_slug);
  const categoryName = isZh ? category?.name : category?.name_en || category?.name;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
          <Link href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</Link>
          <span>/</span>
          <Link href={'/' + locale + '/skillhub'} className="hover:text-[#165DFF] transition">{isZh ? 'AI技能' : 'AI Skills'}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: '#0E3A7A' }}>{isZh ? skill.zh_title : skill.en_title}</span>
        </nav>

        {/* Header */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0E3A7A' }}>
            {isZh ? skill.zh_title : skill.en_title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
            <span className="px-3 py-1 rounded-full border" style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-body)',
              background: 'var(--bg-surface)'
            }}>
              {categoryName}
            </span>
            
            {skill.copy_count > 0 && (
              <span className="px-3 py-1 rounded-full border" style={{
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
              }}>
                {isZh ? `已使用 ${skill.copy_count} 次` : `Used ${skill.copy_count} times`}
              </span>
            )}
          </div>

          <p className="text-base" style={{ color: 'var(--text-body)' }}>
            {isZh ? skill.zh_description : skill.en_description}
          </p>
        </div>

        {/* Prompt 模板 */}
        {(skill.prompt_zh || skill.prompt_en) && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? 'Prompt 模板' : 'Prompt Template'}
            </h2>
            <div className="relative">
              <pre
                className="p-4 rounded-lg text-sm overflow-x-auto"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-body)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {isZh ? skill.prompt_zh : skill.prompt_en}
              </pre>
              <CopyPromptButton
                text={isZh ? skill.prompt_zh : skill.prompt_en}
                isZh={isZh}
              />
            </div>
          </div>
        )}

        {/* 使用场景 */}
        {(skill.usage_scene_zh || skill.usage_scene_en) && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? '使用场景' : 'Usage Scenarios'}
            </h2>
            <div className="text-base" style={{ color: 'var(--text-body)' }}>
              {isZh ? skill.usage_scene_zh : skill.usage_scene_en}
            </div>
          </div>
        )}

        {/* 关联工作流 */}
        {skill.related_workflow_ids && skill.related_workflow_ids.length > 0 && (
          <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#0E3A7A' }}>
              {isZh ? '关联工作流' : 'Related Workflows'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {skill.related_workflow_ids.map((wfId: string, i: number) => (
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
            href="/skillhub"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {isZh ? '返回技能列表' : 'Back to Skills'}
          </Link>
        </div>
      </div>
    </div>
  );
}
