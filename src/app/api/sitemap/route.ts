import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDB();
  const baseUrl = 'https://aiqury.com';
  
  // 只查询中文记录（locale='zh'），避免重复
  const { results: tools } = await db.prepare(
    "SELECT slug FROM tools WHERE status = 'active' AND locale = 'zh'"
  ).all();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '      xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  // 首页（中英文）
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + '/zh</loc>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="x-default" href="' + baseUrl + '/en"/>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + '/en</loc>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="x-default" href="' + baseUrl + '/en"/>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // 搜索页（中英文）
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + '/zh/search</loc>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/search"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/search"/>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += '  </url>\n';
  
  xml += '  <url>\n';
  xml += '    <loc>' + baseUrl + '/en/search</loc>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/search"/>\n';
  xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/search"/>\n';
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += '  </url>\n';
  
  // 分类页（中英文）
  const categories = [
    'ecommerce', 'content_creation', 'cross_border_opc', 'quant_trading',
    'ai_comic_drama', 'office_productivity', 'design', 'dev_automation',
    'education', 'local_business', 'audio_video', 'lifestyle',
    'legal_compliance', 'ai_customer_service', 'marketing', 'hr',
    'construction', 'industry', 'healthcare', 'research'
  ];
  
  for (const cat of categories) {
    xml += '  <url>\n';
    xml += '    <loc>' + baseUrl + '/zh/category/' + cat + '</loc>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/category/' + cat + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/category/' + cat + '"/>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
    
    xml += '  <url>\n';
    xml += '    <loc>' + baseUrl + '/en/category/' + cat + '</loc>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/category/' + cat + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/category/' + cat + '"/>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }
  
  // 工具详情页（中英文）
  for (const tool of tools) {
    xml += '  <url>\n';
    xml += '    <loc>' + baseUrl + '/zh/tool/' + tool.slug + '</loc>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/tool/' + tool.slug + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/tool/' + tool.slug + '"/>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
    
    xml += '  <url>\n';
    xml += '    <loc>' + baseUrl + '/en/tool/' + tool.slug + '</loc>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/tool/' + tool.slug + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/tool/' + tool.slug + '"/>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
