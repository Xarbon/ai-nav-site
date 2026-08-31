import { getDB } from '@/lib/d1/client';
import Link from 'next/link';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string; status?: string; search?: string }>;
}

export default async function AdminToolsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page = '1', category, status, search } = await searchParams;
  const isZh = locale === 'zh';
  const db = getDB();

  const pageSize = 20;
  const offset = (parseInt(page) - 1) * pageSize;

  // 构建查询条件
  let whereClause = '1=1';
  const queryParams: any[] = [];

  if (category) {
    whereClause += ' AND category = ?';
    queryParams.push(category);
  }
  if (status) {
    whereClause += ' AND status = ?';
    queryParams.push(status);
  }
  if (search) {
    whereClause += ' AND (name LIKE ? OR name_en LIKE ?)';
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  // 获取总数
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM tools WHERE ${whereClause}`).bind(...queryParams).first();
  const total = (countResult as any)?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 获取工具列表
  const toolsResult = await db.prepare(`
    SELECT * FROM tools 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `).bind(...queryParams).all();

  const tools = toolsResult.results as any[];

  // 获取赛道列表用于筛选
  const categories = await import('@/data/categories.json').then(m => m.default.categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">工具管理</h1>
          <p className="text-gray-600">管理所有 AI 工具数据</p>
        </div>
        <Link
          href="/admin/tools/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 新增工具
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4">
        <form method="get" className="flex gap-4 flex-wrap">
          <select name="category" className="px-3 py-2 border rounded-lg">
            <option value="">所有赛道</option>
            {categories.map((cat: any) => (
              <option key={cat.slug} value={cat.slug} selected={category === cat.slug}>
                {isZh ? cat.name : cat.name_en}
              </option>
            ))}
          </select>
          <select name="status" className="px-3 py-2 border rounded-lg">
            <option value="">所有状态</option>
            <option value="active" selected={status === 'active'}>已发布</option>
            <option value="draft" selected={status === 'draft'}>草稿</option>
            <option value="archived" selected={status === 'archived'}>已归档</option>
          </select>
          <input
            type="text"
            name="search"
            placeholder="搜索工具名称..."
            defaultValue={search}
            className="px-3 py-2 border rounded-lg flex-1 min-w-[200px]"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            筛选
          </button>
        </form>
      </div>

      {/* 工具列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">图标</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">赛道</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">定价</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">热门</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tools.map((tool) => (
              <tr key={tool.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {tool.icon_url ? (
                    <img src={tool.icon_url} alt={tool.name} className="w-10 h-10 rounded" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                      ?
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-sm text-gray-500">{tool.name_en}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{tool.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tool.pricing === 'Free' ? 'bg-green-100 text-green-800' :
                    tool.pricing === 'Paid' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {tool.pricing}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tool.status === 'active' ? 'bg-green-100 text-green-800' :
                    tool.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tool.status === 'active' ? '已发布' : tool.status === 'draft' ? '草稿' : '已归档'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {tool.is_hot ? (
                    <span className="text-red-500">🔥</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tools/${tool.slug}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      编辑
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/admin/tools?page=${pageNum}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1 rounded ${
                pageNum === parseInt(page)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600">
        共 {total} 个工具，第 {page} / {totalPages} 页
      </div>
    </div>
  );
}
