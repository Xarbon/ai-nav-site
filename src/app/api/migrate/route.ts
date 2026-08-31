import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('x-admin-token');
    const adminPassword = process.env.ADMIN_PASSWORD || 'aiqury2024admin';
    
    if (authHeader !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('tools')
      .select('description_en, detail_en')
      .limit(1);

    if (testError && testError.message.includes('column')) {
      return NextResponse.json({
        success: false,
        message: '需要手动在 Supabase Dashboard 执行 SQL',
        sql: `ALTER TABLE tools ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS detail_en text;`
      });
    }

    return NextResponse.json({
      success: true,
      message: '数据库字段已存在'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '迁移失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
