import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Server-side password check
    const adminPassword = process.env.ADMIN_PASSWORD || 'aiqury2024admin';

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
