'use client';

import { useState } from 'react';

interface Tool {
  id: string;
  slug: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  pricing: string;
}

interface Props {
  isZh: boolean;
  hotTools: Tool[];
  newTools: Tool[];
  recommendedTools: Tool[];
  defaultTab: string;
}

export function RightSidebar({ isZh, hotTools, newTools, recommendedTools, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = [
    { key: 'hot', label: isZh ? '热门' : 'Hot' },
    { key: 'new', label: isZh ? '最新' : 'New' },
    { key: 'recommended', label: isZh ? '推荐' : 'Pick' },
  ];

  const currentTools = activeTab === 'new' ? newTools : activeTab === 'recommended' ? recommendedTools : hotTools;
  const sectionLabel = activeTab === 'new'
    ? (isZh ? '✨ 最新收录' : '✨ Latest')
    : activeTab === 'recommended'
    ? (isZh ? '⭐ 编辑推荐' : '⭐ Editor Picks')
    : (isZh ? '🔥 热门推荐' : '🔥 Popular');

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 px-1" style={{ color: 'var(--text-title)' }}>
        {isZh ? '工具榜单' : 'Tool Rankings'}
      </h3>

      {/* Clickable Tab buttons */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-surface)] rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-md transition cursor-pointer ${
              activeTab === t.key
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/50'
            }`}
            style={{
              color: activeTab === t.key ? '#0E3A7A' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tools List */}
      <div className="space-y-3">
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          {sectionLabel}
        </div>
        {currentTools.slice(0, 10).map((tool, i) => {
          const displayName = isZh ? tool.name : (tool.name_en || tool.name);
          const displayDescription = isZh ? tool.description : (tool.description_en || tool.description);
          
          return (
            <a
              key={tool.id}
              href={`/tool/${tool.slug}`}
              className="flex items-center gap-3 p-2 rounded-lg transition hover:bg-[var(--bg-hover)] group"
            >
              <span className="text-xs font-bold w-5 text-center" style={{
                color: i < 3 ? '#0E3A7A' : 'var(--text-muted)'
              }}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate group-hover:text-[var(--color-primary)] transition" style={{ color: 'var(--text-title)' }}>
                  {displayName}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {displayDescription}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border shrink-0" style={{
                borderColor: tool.pricing === 'Paid' ? 'var(--color-paid)' : 'var(--color-free)',
                color: tool.pricing === 'Paid' ? 'var(--color-paid-text)' : 'var(--color-free-text)',
              }}>
                {tool.pricing === 'Paid' ? (isZh ? '付费' : 'Paid') : (isZh ? '免费' : 'Free')}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
