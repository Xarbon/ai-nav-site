import { getDB } from '@/lib/d1/client';
import { NewsCard } from './NewsCard';

interface NewsItem {
  id: number;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  url: string;
  source: string;
  source_url: string;
  cover_image: string;
  category: string;
  published_at: string;
}

export async function NewsSection({ isZh }: { isZh: boolean }) {
  let news: NewsItem[] = [];
  
  try {
    const db = getDB();
    
    // Ensure table exists
    await db.prepare(`CREATE TABLE IF NOT EXISTS ai_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_zh TEXT, title_en TEXT,
      summary_zh TEXT, summary_en TEXT,
      url TEXT, source TEXT, source_url TEXT,
      cover_image TEXT, category TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();

    // Get latest 12 news items
    const { results } = await db.prepare(
      'SELECT * FROM ai_news ORDER BY published_at DESC LIMIT 12'
    ).all();
    
    news = results as NewsItem[];
  } catch (error) {
    console.error('Failed to load news:', error);
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5" style={{ color: 'var(--text-title)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-title)' }}>
          {isZh ? 'AI 日报' : 'AI Daily News'}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          {isZh ? '每日更新' : 'Daily Update'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} isZh={isZh} />
        ))}
      </div>
    </section>
  );
}
