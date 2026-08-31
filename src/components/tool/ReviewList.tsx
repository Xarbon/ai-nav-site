'use client';

import { useEffect, useState } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
}

interface ReviewListProps {
  toolSlug: string;
  isZh: boolean;
}

export function ReviewList({ toolSlug, isZh }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [toolSlug]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?slug=${toolSlug}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  }

  return (
    <div className="bg-white border border-[var(--border-color)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: '#0E3A7A' }}>
          {isZh ? '用户评价' : 'User Reviews'}
        </h3>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: '#FBBF24' }}>
              {averageRating}
            </span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{ color: star <= Math.round(averageRating) ? '#FBBF24' : '#D1D5DB' }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {totalReviews} {isZh ? '条评价' : 'reviews'}
              </div>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          {isZh ? '暂无评价，成为第一个评价者吧！' : 'No reviews yet. Be the first to review!'}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-[var(--border-light)] pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="text-sm"
                        style={{ color: star <= review.rating ? '#FBBF24' : '#D1D5DB' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-title)' }}>
                    {review.author_name || (isZh ? '匿名用户' : 'Anonymous')}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString(isZh ? 'zh-CN' : 'en-US')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm" style={{ color: 'var(--text-body)', lineHeight: 'var(--line-height-normal)' }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
