'use client';

import { useState } from 'react';

interface Tool {
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  pricing: string;
  rating: number;
  category: string;
}

interface Props {
  currentTool: Tool;
  relatedTools: Tool[];
  isZh: boolean;
  locale: string;
}

interface Criterion {
  id: string;
  label: { zh: string; en: string };
  options: { value: string; label: { zh: string; en: string }; score: number }[];
}

const criteria: Criterion[] = [
  {
    id: 'budget',
    label: { zh: '💰 你的预算？', en: '💰 Your budget?' },
    options: [
      { value: 'free', label: { zh: '只要免费', en: 'Free only' }, score: 1 },
      { value: 'low', label: { zh: '月付 <$30', en: '< $30/mo' }, score: 2 },
      { value: 'mid', label: { zh: '月付 $30-100', en: '$30-100/mo' }, score: 3 },
      { value: 'high', label: { zh: '不限预算', en: 'No limit' }, score: 4 },
    ],
  },
  {
    id: 'experience',
    label: { zh: '🎯 你的技术水平？', en: '🎯 Your skill level?' },
    options: [
      { value: 'beginner', label: { zh: '完全新手', en: 'Beginner' }, score: 1 },
      { value: 'intermediate', label: { zh: '有一定基础', en: 'Some experience' }, score: 2 },
      { value: 'advanced', label: { zh: '专业人士', en: 'Professional' }, score: 3 },
    ],
  },
  {
    id: 'priority',
    label: { zh: '⚡ 你最看重什么？', en: '⚡ What matters most?' },
    options: [
      { value: 'ease', label: { zh: '简单易用', en: 'Easy to use' }, score: 1 },
      { value: 'power', label: { zh: '功能强大', en: 'Feature-rich' }, score: 2 },
      { value: 'value', label: { zh: '性价比高', en: 'Best value' }, score: 3 },
    ],
  },
];

function scoreTool(tool: Tool, answers: Record<string, string>): number {
  let score = 0;
  const budget = answers.budget;
  const exp = answers.experience;
  const priority = answers.priority;

  // Budget scoring
  if (budget === 'free' && tool.pricing === 'Free') score += 30;
  else if (budget === 'free' && tool.pricing === 'Freemium') score += 15;
  else if (budget === 'low' && (tool.pricing === 'Free' || tool.pricing === 'Freemium')) score += 25;
  else if (budget === 'mid') score += 20;
  else score += 10;

  // Experience scoring
  if (exp === 'beginner') score += (tool.rating || 0) * 3;
  else if (exp === 'intermediate') score += (tool.rating || 0) * 2.5;
  else score += (tool.rating || 0) * 2;

  // Priority scoring
  if (priority === 'ease') {
    if (tool.pricing === 'Free') score += 15;
    score += (tool.rating || 0) * 2;
  } else if (priority === 'power') {
    score += (tool.rating || 0) * 3;
    if (tool.pricing === 'Paid') score += 10;
  } else {
    if (tool.pricing === 'Free') score += 20;
    else if (tool.pricing === 'Freemium') score += 15;
  }

  return Math.round(score);
}

export function ToolSelector({ currentTool, relatedTools, isZh, locale }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Tool[] | null>(null);

  const allTools = [currentTool, ...relatedTools].filter((t, i, arr) => 
    arr.findIndex(x => x.slug === t.slug) === i
  );

  const handleSelect = (criterionId: string, value: string) => {
    const newAnswers = { ...answers, [criterionId]: value };
    setAnswers(newAnswers);

    if (step < criteria.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate scores for all tools
      const scored = allTools
        .map((tool) => ({ tool, score: scoreTool(tool, newAnswers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.tool);
      setResults(scored);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
  };

  const progress = results ? 100 : (step / criteria.length) * 100;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
      <h3 className="text-sm font-bold mb-1" style={{ color: '#0E3A7A' }}>
        🧭 {isZh ? '智能选型助手' : 'Smart Selector'}
      </h3>
      <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
        {isZh ? '回答 3 个问题，帮你找到最适合的工具' : 'Answer 3 questions to find your perfect tool'}
      </p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #165DFF, #A855F7)' }}
        />
      </div>

      {!results ? (
        <>
          {/* Current question */}
          <div className="mb-3">
            <p className="text-sm font-medium" style={{ color: '#0E3A7A' }}>
              {criteria[step].label[isZh ? 'zh' : 'en']}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {criteria[step].options.map((opt) => {
              const isSelected = answers[criteria[step].id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(criteria[step].id, opt.value)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium border transition-all hover:shadow-sm"
                  style={{
                    background: isSelected ? '#165DFF' : 'white',
                    color: isSelected ? 'white' : '#4E5969',
                    borderColor: isSelected ? '#165DFF' : '#E5E7EB',
                  }}
                >
                  {opt.label[isZh ? 'zh' : 'en']}
                </button>
              );
            })}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {criteria.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i <= step ? '#165DFF' : '#E5E7EB' }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-2">
            {results.map((tool, i) => (
              <a
                key={tool.slug}
                href={`/${locale}/tool/${tool.slug}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                  style={{
                    background: i === 0 ? '#165DFF' : i === 1 ? '#A855F7' : '#E5E7EB',
                    color: i < 2 ? 'white' : '#4E5969',
                  }}>
                  {i + 1}
                </div>
                <img src={tool.icon_url || '/logo-icon.svg'} alt={tool.name}
                  className="w-8 h-8 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: '#0E3A7A' }}>{tool.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                    {(tool.description || '').slice(0, 40)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-medium"
                    style={{
                      borderColor: (pricingColors[tool.pricing || ''] || '#6B7280') + '60',
                      color: pricingColors[tool.pricing || ''] || '#6B7280',
                    }}>
                    {tool.pricing || 'Free'}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <button
            onClick={reset}
            className="w-full mt-3 text-xs py-2 rounded-xl border border-[#E5E7EB] hover:border-[#165DFF] transition"
            style={{ color: '#6B7280' }}
          >
            🔄 {isZh ? '重新选择' : 'Try again'}
          </button>
        </>
      )}
    </div>
  );
}

const pricingColors: Record<string, string> = {
  'Free': '#36D399', 'Freemium': '#165DFF', 'Paid': '#FB923C',
};
