import { NextRequest, NextResponse } from 'next/server';
import { recordClick } from '@/lib/d1/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolSlug, affiliateUrl } = body;
    
    if (!toolSlug) {
      return NextResponse.json({ success: false, error: 'Missing tool slug' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    await recordClick(toolSlug, affiliateUrl || '', userAgent, referrer);

    return NextResponse.json({ success: true, tracked: true });
  } catch (error: any) {
    console.error('Track click error:', error);
    return NextResponse.json({ success: true, tracked: false });
  }
}
