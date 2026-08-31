import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  
  // 不要缓存重定向响应（语言切换依赖重定向）
  if (response.status >= 300 && response.status < 400) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  }
  
  // 为页面添加缓存头
  const pathname = request.nextUrl.pathname;
  
  // 工具详情页缓存
  if (pathname.includes('/tool/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  }
  
  // 添加 Vary 头确保不同语言版本正确缓存
  response.headers.set('Vary', 'Accept-Encoding');
  
  return response;
}

export const config = {
  matcher: ['/', '/(zh|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
