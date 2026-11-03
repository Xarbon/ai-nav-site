import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1/client';

// Sitemap CDN 缓存 1 小时，避免每次爬虫访问都触发 D1
const SITEMAP_CACHE_KEY = 'sitemap-v1';

export const dynamic = 'force-dynamic';

async function buildSitemap(): Promise<string> {
  const db = getDB();
  const baseUrl = 'https://aiqury.com';
  
  // 只取 slug 和 category，最小化查询
  const { results: tools } = await db.prepare(
    "SELECT slug, category FROM tools WHERE status = 'active'"
  ).all();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '      xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  // 首页
  xml += '  <url><loc>' + baseUrl + '/zh</loc>';
  xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh"/>';
  xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en"/>';
  xml += '<xhtml:link rel="alternate" hreflang="x-default" href="' + baseUrl + '/en"/>';
  xml += '<changefreq>daily</changefreq><priority>1.0</priority></url>\n';
  
  xml += '  <url><loc>' + baseUrl + '/en</loc>';
  xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh"/>';
  xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en"/>';
  xml += '<xhtml:link rel="alternate" hreflang="x-default" href="' + baseUrl + '/en"/>';
  xml += '<changefreq>daily</changefreq><priority>1.0</priority></url>\n';
  
  // 搜索页 + 最新收录页
  for (const path of ['/search', '/latest']) {
    xml += '  <url><loc>' + baseUrl + '/zh' + path + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh' + path + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en' + path + '"/>';
    xml += '<changefreq>daily</changefreq><priority>0.8</priority></url>\n';
    xml += '  <url><loc>' + baseUrl + '/en' + path + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh' + path + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en' + path + '"/>';
    xml += '<changefreq>daily</changefreq><priority>0.8</priority></url>\n';
  }
  
  // 分类页
  const categories = [
    'ecommerce', 'content_creation', 'cross_border_opc', 'quant_trading',
    'ai_comic_drama', 'office_productivity', 'design', 'dev_automation',
    'education', 'local_business', 'audio_video', 'lifestyle',
    'legal_compliance', 'ai_customer_service', 'marketing', 'hr',
    'construction', 'industry', 'healthcare', 'research'
  ];
  for (const cat of categories) {
    xml += '  <url><loc>' + baseUrl + '/zh/category/' + cat + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/category/' + cat + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/category/' + cat + '"/>';
    xml += '<changefreq>weekly</changefreq><priority>0.7</priority></url>\n';
    xml += '  <url><loc>' + baseUrl + '/en/category/' + cat + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/category/' + cat + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/category/' + cat + '"/>';
    xml += '<changefreq>weekly</changefreq><priority>0.7</priority></url>\n';
  }
  
  // 工具详情页 + Alternatives 页面（只取前 500 个工具以减少 sitemap 体积）
  const limitedTools = tools.slice(0, 500);
  for (const tool of limitedTools) {
    // 工具详情页
    xml += '  <url><loc>' + baseUrl + '/zh/tool/' + tool.slug + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/tool/' + tool.slug + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/tool/' + tool.slug + '"/>';
    xml += '<changefreq>weekly</changefreq><priority>0.6</priority></url>\n';
    
    // Alternatives 页面
    xml += '  <url><loc>' + baseUrl + '/zh/alternatives/' + tool.slug + '</loc>';
    xml += '<xhtml:link rel="alternate" hreflang="zh" href="' + baseUrl + '/zh/alternatives/' + tool.slug + '"/>';
    xml += '<xhtml:link rel="alternate" hreflang="en" href="' + baseUrl + '/en/alternatives/' + tool.slug + '"/>';
    xml += '<changefreq>weekly</changefreq><priority>0.5</priority></url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

export async function GET() {
  // 优先从 CDN 缓存读取
  try {
    const cache = (caches as any).default;
    const cacheUrl = new URL(`https://internal.cache/sitemap/${SITEMAP_CACHE_KEY}`);
    const cached = await cache.match(cacheUrl);
    if (cached) {
      return new NextResponse(await cached.text(), {
        headers: { 'Content-Type': 'application/xml' },
      });
    }
    
    // 生成 sitemap
    const xml = await buildSitemap();
    
    // 缓存 1 小时
    await cache.put(cacheUrl, new Response(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
    }));
    
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch {
    // 降级：直接查 D1
    const xml = await buildSitemap();
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
