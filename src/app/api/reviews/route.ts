import { NextRequest, NextResponse } from 'next/server';
import { getToolReviews, addReview } from '@/lib/d1/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const toolSlug = searchParams.get('slug');
  
  if (!toolSlug) {
    return NextResponse.json({ success: false, error: 'Missing tool slug' }, { status: 400 });
  }

  try {
    const reviews = await getToolReviews(toolSlug);
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ 
      success: true, 
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolSlug, rating, comment, author_name, author_email } = body;
    
    if (!toolSlug || !rating) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await addReview(toolSlug, rating, comment || '', author_name || 'Anonymous', author_email || '');

    return NextResponse.json({ success: true, message: 'Review submitted for moderation' });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
