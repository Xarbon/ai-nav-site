
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const SITE_URL = 'https://aiqury.com';
  const canonicalUrl = `${SITE_URL}/${locale}/workflow/${slug}`;
  return {
    title: slug,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'zh': `${SITE_URL}/zh/workflow/${slug}`,
        'en': `${SITE_URL}/en/workflow/${slug}`,
        'x-default': `${SITE_URL}/en/workflow/${slug}`,
      },
    },
  };
}

import { getWorkflowById } from '@/lib/d1/workflow-queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';
import { CopyButton, CopyPromptButton } from '@/components/workflow/CopyButton';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function WorkflowDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isZh = locale === 'zh';

  const workflow = await getWorkflowById(slug);

  if (!workflow) {
    notFound();
  }

  // 获取赛道名称
  const category = categoriesData.categories.find(c => c.slug === workflow.track_slug);
  const categoryName = isZh ? category?.name : category?.name_en || category?.name;

  // 难度标签
  const difficultyLabel = isZh
    ? ({ simple: '简单', medium: '中等', hard: '困难' } as Record<string, string>)[workflow.difficulty] || workflow.difficulty
    : ({ simple: 'Simple', medium: 'Medium', hard: 'Hard' } as Record<string, string>)[workflow.difficulty] || workflow.difficulty;

  const difficultyColor = ({
    simple: 'var(--color-free)',
    medium: 'var(--color-plugin)',
    hard: 'var(--color-paid)'
  } as Record<string, string>)[workflow.difficulty] || 'var(--text-muted)';

  // 生成 Markdown 文档
  const generateMarkdown = () => {
    let md = `# ${isZh ? workflow.zh_title : workflow.en_title}\n\n`;
    md += `**${isZh ? '赛道' : 'Track'}**: ${categoryName}  \n`;
    md += `**${isZh ? '难度' : 'Difficulty'}**: ${difficultyLabel}  \n`;
    md += `**${isZh ? '耗时' : 'Time Cost'}**: ${workflow.time_cost}  \n`;
    
    if (workflow.is_opc_selected) {
      md += `**${isZh ? 'OPC 精选' : 'OPC Pick'}**: ✅  \n`;
    }
    
    md += `\n## ${isZh ? '预期输出' : 'Expected Output'}\n\n`;
    md += `${isZh ? workflow.output_zh : workflow.output_en}\n\n`;
    
    if (workflow.prerequisite_zh) {
      md += `## ${isZh ? '前提条件' : 'Prerequisites'}\n\n`;
      md += `${isZh ? workflow.prerequisite_zh : workflow.prerequisite_en}\n\n`;
    }
    
    md += `## ${isZh ? '工作流步骤' : 'Workflow Steps'}\n\n`;
    
    workflow.steps.forEach((step: any) => {
      md += `### ${isZh ? '步骤' : 'Step'} ${step.step_no}\n\n`;
      md += `${isZh ? step.desc_zh : step.desc_en}\n\n`;
      
      if (step.prompt_template_zh) {
        md += `**${isZh ? 'Prompt 模板' : 'Prompt Template'}**:\n\n`;
        md += `\`\`\`\n${isZh ? step.prompt_template_zh : step.prompt_template_en}\n\`\`\`\n\n`;
      }
      
      if (step.expect_output_zh) {
        md += `**${isZh ? '预期输出' : 'Expected Output'}**: ${isZh ? step.expect_output_zh : step.expect_output_en}\n\n`;
      }
      
      if (step.tip_zh) {
        md += `💡 ${isZh ? step.tip_zh : step.tip_en}\n\n`;
      }
    });
    
    if (workflow.faq && workflow.faq.length > 0) {
      md += `## ${isZh ? '常见问题' : 'FAQ'}\n\n`;
      workflow.faq.forEach((item: any) => {
        md += `**Q**: ${isZh ? item.q_zh : item.q_en}\n\n`;
        md += `**A**: ${isZh ? item.a_zh : item.a_en}\n\n`;
      });
    }
    
    return md;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#9CA3AF' }} aria-label="Breadcrumb">
          <Link href={'/' + locale} className="hover:text-[#165DFF] transition">{isZh ? '首页' : 'Home'}</Link>
          <span>/</span>
          <Link href={'/' + locale + '/workflow'} className="hover:text-[#165DFF] transition">{isZh ? '工作流' : 'Workflows'}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: '#0E3A7A' }}>{isZh ? workflow.zh_title : workflow.en_title}</span>
        </nav>

        {/* Header */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#0E3A7A' }}>
                {isZh ? workflow.zh_title : workflow.en_title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* 赛道标签 */}
                <span className="px-3 py-1 rounded-full border" style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-body)',
                  background: 'var(--bg-surface)'
                }}>
                  {categoryName}
                </span>

                {/* 难度标签 */}
                <span className="px-3 py-1 rounded-full border" style={{
                  borderColor: difficultyColor,
                  color: difficultyColor
                }}>
                  {difficultyLabel}
                </span>

                {/* 耗时 */}
                <span style={{ color: 'var(--text-muted)' }}>
                  ⏱ {workflow.time_cost}
                </span>

                {/* OPC 精选 */}
                {workflow.is_opc_selected && (
                  <span className="px-3 py-1 rounded-full" style={{
                    background: 'var(--color-primary-bg)',
                    color: 'var(--color-primary)'
                  }}>
                    {isZh ? '🌟 OPC 精选' : '🌟 OPC Pick'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 输出描述 */}
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
              {isZh ? '📦 预期输出' : '📦 Expected Output'}
            </div>
            <div style={{ color: 'var(--text-body)' }}>
              {isZh ? workflow.output_zh : workflow.output_en}
            </div>
          </div>

          {/* 前提条件 */}
          {workflow.prerequisite_zh && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '✅ 前提条件' : '✅ Prerequisites'}
              </div>
              <div style={{ color: 'var(--text-body)' }}>
                {isZh ? workflow.prerequisite_zh : workflow.prerequisite_en}
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#0E3A7A' }}>
              {isZh ? `📋 工作流步骤 (${workflow.steps.length})` : `📋 Workflow Steps (${workflow.steps.length})`}
            </h2>
            
            {/* 导出按钮 */}
            <CopyButton text={generateMarkdown()} isZh={isZh} />
          </div>

          <div className="space-y-4">
            {workflow.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="bg-white border border-[var(--border-color)] rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  {/* 步骤编号 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-white"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {step.step_no}
                  </div>

                  <div className="flex-1">
                    {/* 步骤描述 */}
                    <div className="text-base mb-4" style={{ color: 'var(--text-body)' }}>
                      {isZh ? step.desc_zh : step.desc_en}
                    </div>

                    {/* Prompt 模板 */}
                    {step.prompt_template_zh && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                          {isZh ? '💬 Prompt 模板' : '💬 Prompt Template'}
                        </div>
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
                            {isZh ? step.prompt_template_zh : step.prompt_template_en}
                          </pre>
                          <CopyPromptButton
                            text={isZh ? step.prompt_template_zh : step.prompt_template_en}
                            isZh={isZh}
                          />
                        </div>
                      </div>
                    )}

                    {/* 预期输出 */}
                    {step.expect_output_zh && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                          {isZh ? '📦 预期输出' : '📦 Expected Output'}
                        </div>
                        <div className="p-3 rounded-lg text-sm" style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--text-body)'
                        }}>
                          {isZh ? step.expect_output_zh : step.expect_output_en}
                        </div>
                      </div>
                    )}

                    {/* 操作提示 */}
                    {step.tip_zh && (
                      <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span>💡</span>
                        <span>{isZh ? step.tip_zh : step.tip_en}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        {workflow.faq && workflow.faq.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#0E3A7A' }}>
              {isZh ? '❓ 常见问题' : '❓ FAQ'}
            </h2>
            <div className="space-y-4">
              {workflow.faq.map((item: any, index: number) => (
                <div
                  key={index}
                  className="bg-white border border-[var(--border-color)] rounded-xl p-6"
                >
                  <div className="font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                    Q: {isZh ? item.q_zh : item.q_en}
                  </div>
                  <div style={{ color: 'var(--text-body)' }}>
                    A: {isZh ? item.a_zh : item.a_en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center">
          <Link
            href="/workflow"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition"
            style={{
              background: 'var(--color-primary)',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {isZh ? '返回工作流列表' : 'Back to Workflows'}
          </Link>
        </div>
      </div>
    </div>
  );
}
