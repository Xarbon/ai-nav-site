'use client';

import {useState} from 'react';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';

interface Props {
  isZh: boolean;
}

export function MobileMenu({isZh}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]"
        aria-label={isZh ? '菜单' : 'Menu'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold" style={{color: '#0E3A7A'}}>
            {isZh ? '菜单' : 'Menu'}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
            aria-label={isZh ? '关闭' : 'Close'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 80px)'}}>
          <div className="mb-6">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-4 rounded-lg hover:bg-[var(--bg-hover)] font-medium"
              style={{color: 'var(--text-title)'}}
            >
              {isZh ? '首页' : 'Home'}
            </Link>
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="block py-3 px-4 rounded-lg hover:bg-[var(--bg-hover)] font-medium"
              style={{color: 'var(--text-title)'}}
            >
              {isZh ? '搜索' : 'Search'}
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 px-4" style={{color: 'var(--text-muted)'}}>
              {isZh ? '分类' : 'Categories'}
            </h3>
            {categoriesData.categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 rounded-lg hover:bg-[var(--bg-hover)]"
                style={{color: 'var(--text-body)'}}
              >
                {isZh ? category.name : category.name_en}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
