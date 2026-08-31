'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
}

export function CopyButton({ text, label = '📋 复制业务指令', copiedLabel = '✅ 已复制' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 hover:shadow-sm"
      style={{
        borderColor: copied ? 'var(--color-free)' : 'var(--border-color)',
        color: copied ? 'var(--color-free)' : 'var(--color-primary)',
        background: copied ? 'rgba(54, 211, 153, 0.06)' : 'transparent',
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
