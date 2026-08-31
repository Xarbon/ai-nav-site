import { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  
  // Check if user is authenticated (skip for login page)
  if (!adminAuth || adminAuth.value !== 'verified') {
    redirect(`/${locale}/admin-login`);
  }

  const menuItems = [
    { href: '/admin', label: isZh ? '仪表盘' : 'Dashboard', icon: '📊' },
    { href: '/admin/categories', label: isZh ? '赛道管理' : 'Categories', icon: '🏷️' },
    { href: '/admin/tools', label: isZh ? '工具管理' : 'Tools', icon: '🔧' },
    { href: '/admin/import', label: isZh ? '批量导入' : 'Import', icon: '📥' },
    { href: '/admin/workflows', label: isZh ? '工作流' : 'Workflows', icon: '🔄' },
    { href: '/admin/skills', label: isZh ? '技能' : 'Skills', icon: '⚡' },
    { href: '/admin/agents', label: isZh ? '智能体' : 'Agents', icon: '🤖' },
    { href: '/admin/ads', label: isZh ? '广告位' : 'Ads', icon: '📢' },
    { href: '/admin/seo', label: isZh ? 'SEO' : 'SEO', icon: '🔍' },
    { href: '/admin/settings', label: isZh ? '设置' : 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold" style={{ color: '#0E3A7A' }}>AIqury</Link>
            <span className="text-gray-400">|</span>
            <h1 className="text-lg font-semibold">{isZh ? '管理后台' : 'Admin Panel'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="text-sm text-gray-600 hover:text-primary transition">
              {isZh ? '查看网站' : 'View Site'}
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-[1920px] mx-auto flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
