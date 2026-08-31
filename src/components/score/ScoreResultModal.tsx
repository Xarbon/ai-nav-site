'use client';

import { useEffect } from 'react';

interface ScoreResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalScore: number;
  isZh: boolean;
}

function HighScoreRobot() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="#E8F5E9" stroke="#36D399" strokeWidth="2"/>
      <circle cx="60" cy="55" r="30" fill="white" stroke="#36D399" strokeWidth="2"/>
      <circle cx="48" cy="50" r="4" fill="#36D399"/>
      <circle cx="72" cy="50" r="4" fill="#36D399"/>
      <path d="M 45 62 Q 60 72 75 62" stroke="#36D399" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 60 25 L 60 15" stroke="#36D399" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="60" cy="12" r="4" fill="#36D399"/>
      <path d="M 30 55 L 20 50" stroke="#36D399" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 90 55 L 100 50" stroke="#36D399" strokeWidth="2" strokeLinecap="round"/>
      <text x="60" y="100" textAnchor="middle" fontSize="12" fill="#36D399" fontWeight="bold">⭐</text>
    </svg>
  );
}

function LowScoreRobot() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="#FFF3E0" stroke="#FB923C" strokeWidth="2"/>
      <circle cx="60" cy="55" r="30" fill="white" stroke="#FB923C" strokeWidth="2"/>
      <circle cx="48" cy="50" r="4" fill="#FB923C"/>
      <circle cx="72" cy="50" r="4" fill="#FB923C"/>
      <path d="M 45 65 Q 60 58 75 65" stroke="#FB923C" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 60 25 L 60 15" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="60" cy="12" r="4" fill="#FB923C"/>
      <path d="M 30 55 L 20 60" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 90 55 L 100 60" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      <text x="60" y="100" textAnchor="middle" fontSize="12" fill="#FB923C" fontWeight="bold">💪</text>
    </svg>
  );
}

const MESSAGES = {
  zh: {
    high: [
      '哇！这个工具太棒了，你眼光真不错！',
      '满分推荐！这个工具绝对值得拥有！',
      '太厉害了！这个工具简直是神器！',
      '你的评分说明了一切，这个工具值得五星好评！',
    ],
    low: [
      '看来这个工具还有进步空间，我们会继续努力的！',
      '感谢你的反馈，我们会帮助这个工具变得更好！',
      '别灰心，每个伟大的工具都是从不完美开始的！',
      '你的意见很重要，期待这个工具的下次蜕变！',
    ],
    title: '评分提交成功！',
    close: '好的',
  },
  en: {
    high: [
      'Wow! This tool is amazing, you have great taste!',
      'Highly recommended! This tool is a must-have!',
      'Incredible! This tool is simply outstanding!',
      'Your rating speaks volumes, five stars well deserved!',
    ],
    low: [
      'Looks like this tool has room to grow, we\'ll keep working on it!',
      'Thanks for your feedback, we\'ll help make it better!',
      'Don\'t worry, every great tool starts with imperfection!',
      'Your opinion matters, looking forward to its next evolution!',
    ],
    title: 'Score Submitted!',
    close: 'OK',
  },
};

export function ScoreResultModal({ isOpen, onClose, totalScore, isZh }: ScoreResultModalProps) {
  const isHighScore = totalScore >= 3.5;
  const lang = isZh ? 'zh' : 'en';
  const messages = isHighScore ? MESSAGES[lang].high : MESSAGES[lang].low;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-8 max-w-sm w-full text-center"
        style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {isHighScore ? <HighScoreRobot /> : <LowScoreRobot />}
        
        <h3 className="text-xl font-bold mt-4 mb-2" style={{ color: '#0E3A7A' }}>
          {MESSAGES[lang].title}
        </h3>
        
        <div className="text-3xl font-bold mb-3" style={{ color: isHighScore ? '#36D399' : '#FB923C' }}>
          {totalScore.toFixed(1)} / 5
        </div>
        
        <p className="text-sm mb-6" style={{ color: 'var(--text-body)' }}>
          {randomMessage}
        </p>
        
        <button
          onClick={onClose}
          className="w-full py-3 rounded-full text-sm font-semibold transition hover:opacity-90"
          style={{ background: '#0E3A7A', color: '#FFFFFF' }}
        >
          {MESSAGES[lang].close}
        </button>
      </div>
    </div>
  );
}
