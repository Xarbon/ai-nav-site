'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileMenu } from './MobileMenu';

interface NavbarProps {
  locale?: string;
}

export function Navbar({ locale: serverLocale }: NavbarProps = {}) {
  const pathname = usePathname();
  
  // 从路径中提取当前 locale
  const isZh = pathname.startsWith('/zh');
  const currentLocale = isZh ? 'zh' : 'en';
  
  // 移除 locale 前缀获取实际路径
  let pathWithoutLocale = pathname;
  if (pathname.startsWith('/en/')) pathWithoutLocale = pathname.slice(3);
  else if (pathname === '/en') pathWithoutLocale = '/';
  else if (pathname.startsWith('/zh/')) pathWithoutLocale = pathname.slice(3);
  else if (pathname === '/zh') pathWithoutLocale = '/';

  const handleLangSwitch = (e: React.MouseEvent) => {
    e.preventDefault();
    const newLocale = isZh ? 'en' : 'zh';
    const newPath = pathWithoutLocale === '/' ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`;
    window.location.href = newPath;
  };

  const isLatestActive = pathWithoutLocale === '/latest';
  const isSearchActive = pathWithoutLocale === '/search';

  return (
    <header className="h-16 border-b border-[var(--border-color)] bg-white flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        {/* Left: Logo + Navigation links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href={isZh ? '/zh' : '/en'} className="flex items-center shrink-0">
            <img src="/logo-full.svg" alt="aiqury.com" className="h-9 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={isZh ? '/zh/latest' : '/en/latest'}
              className={`px-3 py-1.5 rounded-full text-sm transition ${isLatestActive ? 'bg-blue-50 font-medium' : 'hover:bg-[var(--bg-hover)]'}`}
              style={{ color: isLatestActive ? '#165DFF' : 'var(--text-body)' }}
            >
              {isZh ? '最新收录' : 'Latest'}
            </Link>
            <Link
              href={isZh ? '/zh/search' : '/en/search'}
              className={`px-3 py-1.5 rounded-full text-sm transition ${isSearchActive ? 'bg-blue-50 font-medium' : 'hover:bg-[var(--bg-hover)]'}`}
              style={{ color: isSearchActive ? '#165DFF' : 'var(--text-body)' }}
            >
              {isZh ? 'AI搜索' : 'AI Search'}
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <a
            href="#"
            onClick={handleLangSwitch}
            className="flex items-center gap-1 px-3 py-1.5 border border-[var(--border-color)] rounded-full text-sm transition hover:bg-[var(--bg-hover)]"
            style={{color: 'var(--text-body)'}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {isZh ? 'EN' : '中文'}
          </a>

          <Link
            href={isZh ? '/zh/submit' : '/en/submit'}
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-full text-sm transition hover:bg-[var(--bg-hover)]"
            style={{color: 'var(--text-body)'}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            {isZh ? '提交工具' : 'Submit Tool'}
          </Link>

          <MobileMenu isZh={isZh} />
        </div>
      </div>
    </header>
  );
}
