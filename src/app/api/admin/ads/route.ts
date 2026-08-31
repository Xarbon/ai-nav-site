import { NextRequest, NextResponse } from 'next/server';
import { getAdConfig, updateAdConfig } from '@/lib/d1/queries';

// GET - 获取广告配置
export async function GET() {
  try {
    const configMap = await getAdConfig();
    return NextResponse.json(configMap);
  } catch (error) {
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 });
  }
}

// POST - 更新广告配置
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-admin-token');
    const adminPassword = process.env.ADMIN_PASSWORD || 'aiqury2024admin';
    
    if (token !== adminPassword) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { slot, enabled, label, contact } = body;

    if (!slot) {
      return NextResponse.json({ error: '缺少 slot 参数' }, { status: 400 });
    }

    await updateAdConfig(slot, !!enabled, label || '', contact || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update ad config error:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}
