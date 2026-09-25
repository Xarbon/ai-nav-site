import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rewrite /sitemap.xml to the API route that generates XML sitemap
  if (pathname === '/sitemap.xml') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/sitemap';
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/sitemap.xml'],
};
