'use client';

import { useState, useEffect } from 'react';

interface Props {
  isZh: boolean;
}

const sections = [
  { id: 'overview', zh: '概览', en: 'Overview' },
  { id: 'capabilities', zh: '能力', en: 'Capabilities' },
  { id: 'details', zh: '详情', en: 'Details' },
  { id: 'related', zh: '同类', en: 'Related' },
  { id: 'reviews', zh: '评价', en: 'Reviews' },
];

export function AnchorNav({ isZh }: Props) {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-4 -mx-4 px-4 md:-mx-6 md:px-6">
      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
        {sections.map(({ id, zh, en }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all"
              style={{
                background: isActive ? '#165DFF' : 'transparent',
                color: isActive ? 'white' : '#6B7280',
              }}
            >
              {isZh ? zh : en}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
