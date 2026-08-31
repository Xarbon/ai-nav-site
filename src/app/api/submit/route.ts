import { NextRequest, NextResponse } from 'next/server';
import { submitTool, toolExists } from '@/lib/d1/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const required = ['name', 'name_en', 'url', 'description', 'description_en', 'category', 'sub_category'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Generate slug from name_en
    const slug = body.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tool already exists
    const exists = await toolExists(slug);
    if (exists) {
      return NextResponse.json({ success: false, error: 'Tool already exists' }, { status: 409 });
    }

    // Insert new tool
    await submitTool({
      name: body.name,
      name_en: body.name_en,
      slug,
      url: body.url,
      description: body.description,
      description_en: body.description_en,
      category: body.category,
      sub_category: body.sub_category,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
