'use client';

import { useState, useRef, useCallback } from 'react';

interface CopyPromptButtonProps {
  // 通用模式：直接传入要复制的文本
  promptText?: string;
  // 模板模式：自动拼接 prompt
  toolName?: string;
  shortIntro?: string;
  opcScenarios?: string[];
  customPrompt?: string; // 二期预留
  isZh?: boolean;
}

export function CopyPromptButton({ promptText, toolName, shortIntro, opcScenarios, customPrompt, isZh = true }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 降级：如果没有 promptText 且 opcScenarios 为空，不渲染
  const hasScenarios = opcScenarios && opcScenarios.length > 0;
  if (!promptText && !hasScenarios) return null;

  // 优先使用直接传入的 promptText，否则用模板拼接
  const text = promptText || (customPrompt || `【工具】${toolName || ''}\n用途：${shortIntro || ''}\n我的OPC业务任务：\n${(opcScenarios || []).slice(0, 3).join('\n')}\n请基于这个AI工具，帮我输出一套可以直接落地的完整操作步骤。`);

  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setShowToast(true);
    setTimeout(() => { setCopied(false); setShowToast(false); }, 2500);
  }, [text]);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowTooltip(true), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <>
      <div className="relative inline-block">
        {showTooltip && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-xl text-xs leading-relaxed shadow-lg border pointer-events-none"
            style={{ background: '#0E3A7A', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {isZh
              ? '复制OPC业务任务提示词，粘贴到任意大模型，获取落地操作步骤'
              : 'Copy OPC business prompt, paste into any LLM to get actionable steps'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent" style={{ borderTopColor: '#0E3A7A' }} />
          </div>
        )}

        <button
          onClick={doCopy}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-full border transition-all duration-200 hover:shadow-sm active:scale-95"
          style={{
            borderColor: copied ? '#36D399' : '#E5E7EB',
            color: copied ? '#36D399' : '#165DFF',
            background: copied ? 'rgba(54, 211, 153, 0.06)' : 'transparent',
          }}
        >
          {copied ? '✅ 已复制' : '📋 Copy Prompt'}
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-xl border"
          style={{ background: '#0E3A7A', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}>
          ✅ {isZh ? '已复制业务指令，粘贴到AI大模型即可使用' : 'Prompt copied! Paste into any AI model to use'}
        </div>
      )}
    </>
  );
}
