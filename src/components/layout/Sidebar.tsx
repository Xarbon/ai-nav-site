import Link from 'next/link';
import categoriesData from '@/data/categories.json';

interface Props {
  currentCategory?: string;
}

export function Sidebar({currentCategory}: Props) {
  return (
    <aside className="sidebar min-h-[calc(100vh-64px)]">
      <nav className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-3" style={{color: 'var(--text-muted)'}}>
          20大赛道
        </div>
        {categoriesData.categories.map((category) => {
          const isActive = currentCategory === category.slug;
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={`sidebar-menu-item block ${isActive ? 'active' : ''}`}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
