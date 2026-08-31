'use client';

interface CopyButtonProps {
  text: string;
  isZh: boolean;
  className?: string;
}

export function CopyButton({ text, isZh, className = '' }: CopyButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert(isZh ? '已复制到剪贴板' : 'Copied to clipboard');
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${className}`}
      style={{
        background: 'var(--color-primary)',
        color: 'white'
      }}
    >
      {isZh ? '📋 复制 Markdown' : '📋 Copy Markdown'}
    </button>
  );
}

export function CopyPromptButton({ text, isZh }: { text: string; isZh: boolean }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert(isZh ? '已复制' : 'Copied');
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-3 py-1 rounded text-xs transition"
      style={{
        background: 'var(--color-primary)',
        color: 'white'
      }}
    >
      {isZh ? '复制' : 'Copy'}
    </button>
  );
}
