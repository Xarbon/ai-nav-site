'use client';

import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { RadarChart } from './RadarChart';
import { ScoreResultModal } from './ScoreResultModal';

interface ScoreRateProps {
  toolSlug: string;
  toolName: string;
  category: string;
  isZh: boolean;
}

interface Scores {
  intelligence: number;
  easeOfUse: number;
  outputQuality: number;
  valueForMoney: number;
}

const DIMENSIONS = [
  { key: 'intelligence', color: '#165DFF' },
  { key: 'easeOfUse', color: '#36D399' },
  { key: 'outputQuality', color: '#FB923C' },
  { key: 'valueForMoney', color: '#A855F7' },
] as const;

const LABELS = {
  zh: {
    title: '为这个工具打分',
    subtitle: '你的评分将帮助其他用户做出更好的选择',
    intelligence: '智能能力',
    easeOfUse: '易用性',
    outputQuality: '产出质量',
    valueForMoney: '性价比',
    submit: '提交评分',
    submitted: '已评分',
    alreadyRated: '你已经在30天内评过分了',
    viewResult: '查看我的评分',
    categoryPrompts: {
      ecommerce: '电商工具的智能程度直接影响运营效率',
      content_creation: '内容创作工具的易用性决定了创作体验',
      design: '设计工具的产出质量是核心竞争力',
      dev_automation: '开发自动化工具的性价比至关重要',
      education: '教育工具的智能能力影响学习效果',
      marketing: '营销工具的产出质量决定ROI',
      default: '请根据你的实际使用体验为这个工具打分',
    },
  },
  en: {
    title: 'Rate This Tool',
    subtitle: 'Your rating helps other users make better choices',
    intelligence: 'Intelligence',
    easeOfUse: 'Ease of Use',
    outputQuality: 'Output Quality',
    valueForMoney: 'Value For Money',
    submit: 'Submit Score',
    submitted: 'Already Rated',
    alreadyRated: 'You have already rated within 30 days',
    viewResult: 'View My Score',
    categoryPrompts: {
      ecommerce: 'Intelligence of e-commerce tools directly impacts operational efficiency',
      content_creation: 'Ease of use of content creation tools determines the creative experience',
      design: 'Output quality is the core competitiveness of design tools',
      dev_automation: 'Value for money is crucial for development automation tools',
      education: 'Intelligence of education tools affects learning outcomes',
      marketing: 'Output quality of marketing tools determines ROI',
      default: 'Please rate this tool based on your actual usage experience',
    },
  },
};

// Weights for calculating total score
const WEIGHTS = {
  intelligence: 0.3,
  easeOfUse: 0.25,
  outputQuality: 0.25,
  valueForMoney: 0.2,
};

function calculateTotalScore(scores: Scores): number {
  return (
    scores.intelligence * WEIGHTS.intelligence +
    scores.easeOfUse * WEIGHTS.easeOfUse +
    scores.outputQuality * WEIGHTS.outputQuality +
    scores.valueForMoney * WEIGHTS.valueForMoney
  );
}

function getCategoryPrompt(category: string, isZh: boolean): string {
  const lang = isZh ? 'zh' : 'en';
  const prompts = LABELS[lang].categoryPrompts;
  return (prompts as any)[category] || prompts.default;
}

export function ScoreRate({ toolSlug, toolName, category, isZh }: ScoreRateProps) {
  const [scores, setScores] = useState<Scores>({
    intelligence: 3,
    easeOfUse: 3,
    outputQuality: 3,
    valueForMoney: 3,
  });
  const [hasRated, setHasRated] = useState(false);
  const [savedScore, setSavedScore] = useState<Scores | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');

  const lang = isZh ? 'zh' : 'en';
  const labels = LABELS[lang];

  // Initialize visitor ID and check if already rated
  useEffect(() => {
    const init = async () => {
      // Get or create visitor UUID
      let id = await localforage.getItem<string>('visitor_uuid');
      if (!id) {
        id = crypto.randomUUID();
        await localforage.setItem('visitor_uuid', id);
      }
      setVisitorId(id);

      // Check if already rated this tool within 30 days
      const ratingKey = `rating_${toolSlug}_${id}`;
      const ratingData = await localforage.getItem<{ scores: Scores; timestamp: number }>(ratingKey);
      
      if (ratingData && Date.now() - ratingData.timestamp < 30 * 24 * 60 * 60 * 1000) {
        setHasRated(true);
        setSavedScore(ratingData.scores);
        setScores(ratingData.scores);
      }
    };
    init();
  }, [toolSlug]);

  const handleScoreChange = (dimension: keyof Scores, value: number) => {
    setScores(prev => ({ ...prev, [dimension]: value }));
  };

  const handleSubmit = async () => {
    if (hasRated || submitting) return;
    setSubmitting(true);

    try {
      // Save to localforage
      const ratingKey = `rating_${toolSlug}_${visitorId}`;
      await localforage.setItem(ratingKey, {
        scores,
        timestamp: Date.now(),
      });

      // Submit to API (async, don't block)
      fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug,
          visitorId,
          scores,
          totalScore: calculateTotalScore(scores),
        }),
      }).catch(err => console.error('Score submit error:', err));

      setHasRated(true);
      setSavedScore(scores);
      setShowModal(true);
    } catch (error) {
      console.error('Save rating error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalScore = calculateTotalScore(scores);

  return (
    <>
      <div className="bg-white border border-[var(--border-color)] rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#0E3A7A' }}>
          {labels.title}
        </h3>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          {getCategoryPrompt(category, isZh)}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {labels.subtitle}
        </p>

        {/* Radar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <RadarChart scores={scores} isZh={isZh} />
        </div>

        {/* Score Sliders */}
        <div className="space-y-4 mb-6">
          {DIMENSIONS.map(({ key, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium" style={{ color }}>
                  {(labels as any)[key]}
                </label>
                <span className="text-sm font-bold" style={{ color }}>
                  {scores[key as keyof Scores]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scores[key as keyof Scores]}
                onChange={(e) => handleScoreChange(key as keyof Scores, Number(e.target.value))}
                disabled={hasRated}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, ${color} 0%, ${color} ${(scores[key as keyof Scores] - 1) * 25}%, #e5e7eb ${(scores[key as keyof Scores] - 1) * 25}%, #e5e7eb 100%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Total Score */}
        <div className="text-center mb-4 py-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            {isZh ? '综合评分' : 'Total Score'}
          </div>
          <div className="text-3xl font-bold" style={{ color: '#0E3A7A' }}>
            {totalScore.toFixed(1)}
          </div>
        </div>

        {/* Submit Button */}
        {hasRated ? (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 rounded-full text-sm font-medium transition hover:opacity-90"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-body)', border: '1px solid var(--border-color)' }}
          >
            {labels.viewResult}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-full text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#0E3A7A', color: '#FFFFFF' }}
          >
            {submitting ? (isZh ? '提交中...' : 'Submitting...') : labels.submit}
          </button>
        )}
      </div>

      <ScoreResultModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        totalScore={calculateTotalScore(savedScore || scores)}
        isZh={isZh}
      />
    </>
  );
}
