'use client';

import { useState } from 'react';

interface Props {
  toolSlug: string;
  toolName: string;
  isZh: boolean;
}

export function QuickVote({ toolSlug, toolName, isZh }: Props) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);

  const handleVote = async (type: 'up' | 'down') => {
    if (voted) return;
    setVoted(type);
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: toolSlug, type }),
      });
    } catch {}
    if (type === 'up') setUpCount(v => v + 1);
    else setDownCount(v => v + 1);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-4">
      <p className="text-sm font-medium mb-3" style={{ color: '#0E3A7A' }}>
        {isZh ? '这个工具对你有帮助吗？' : 'Was this tool helpful to you?'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote('up')}
          disabled={!!voted}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-default"
          style={{
            background: voted === 'up' ? '#36D399' : 'white',
            color: voted === 'up' ? 'white' : '#36D399',
            border: voted === 'up' ? '1px solid #36D399' : '1px solid #D1FAE5',
          }}
        >
          👍 {isZh ? '有帮助' : 'Helpful'}
          {voted === 'up' && upCount > 0 && <span className="ml-1">+{upCount}</span>}
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={!!voted}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-default"
          style={{
            background: voted === 'down' ? '#EF4444' : 'white',
            color: voted === 'down' ? 'white' : '#EF4444',
            border: voted === 'down' ? '1px solid #EF4444' : '1px solid #FEE2E2',
          }}
        >
          👎 {isZh ? '一般' : 'Not really'}
          {voted === 'down' && downCount > 0 && <span className="ml-1">+{downCount}</span>}
        </button>
        {voted && (
          <span className="text-xs ml-2" style={{ color: '#6B7280' }}>
            {isZh ? '感谢反馈！' : 'Thanks for your feedback!'}
          </span>
        )}
      </div>
    </div>
  );
}
