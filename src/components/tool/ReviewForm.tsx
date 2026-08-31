'use client';

import { useState } from 'react';

interface ReviewFormProps {
  toolSlug: string;
  isZh: boolean;
}

export function ReviewForm({ toolSlug, isZh }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug,
          rating,
          comment,
          author_name: authorName,
          author_email: authorEmail,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          message: isZh ? '评论已提交，等待审核后显示。' : 'Review submitted, pending moderation.' 
        });
        setRating(5);
        setComment('');
        setAuthorName('');
        setAuthorEmail('');
      } else {
        setResult({ success: false, message: data.error || (isZh ? '提交失败' : 'Submission failed') });
      }
    } catch (error) {
      setResult({ success: false, message: isZh ? '网络错误' : 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[var(--border-color)] rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0E3A7A' }}>
        {isZh ? '写下你的评价' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
            {isZh ? '评分' : 'Rating'} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-2xl transition"
                style={{ color: star <= rating ? '#FBBF24' : '#D1D5DB' }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
            {isZh ? '评论内容' : 'Comment'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            placeholder={isZh ? '分享你的使用体验...' : 'Share your experience...'}
          />
        </div>

        {/* Author Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
            {isZh ? '你的名字' : 'Your Name'}
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            placeholder={isZh ? '选填' : 'Optional'}
          />
        </div>

        {/* Author Email */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
            {isZh ? '邮箱' : 'Email'}
          </label>
          <input
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            placeholder={isZh ? '选填，不会公开显示' : 'Optional, will not be displayed'}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-md text-white font-medium transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#0E3A7A' }}
        >
          {submitting ? (isZh ? '提交中...' : 'Submitting...') : (isZh ? '提交评价' : 'Submit Review')}
        </button>

        {result && (
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}
