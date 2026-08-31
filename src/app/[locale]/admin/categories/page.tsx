import { getDB } from '@/lib/d1/client';
import categoriesData from '@/data/categories.json';

export default async function AdminCategoriesPage() {
  const db = getDB();

  // 获取每个赛道的工具数量
  const categoryStats = await db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM tools 
    WHERE status = 'active'
    GROUP BY category
  `).all();

  const statsMap = new Map((categoryStats.results as any[]).map(s => [s.category, s.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">赛道管理</h1>
          <p className="text-gray-600">管理 20 个固定赛道的分类信息</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">图标</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">中文名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">英文名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工具数量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categoriesData.categories.map((cat, idx) => (
              <tr key={cat.slug} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <img src={`/icons/tracks/${cat.slug}.svg`} alt={cat.name} className="w-8 h-8" />
                </td>
                <td className="px-6 py-4 font-medium">{cat.name}</td>
                <td className="px-6 py-4 text-gray-600">{cat.name_en}</td>
                <td className="px-6 py-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">{cat.slug}</code>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {statsMap.get(cat.slug) || 0} 个工具
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    启用
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>提示：</strong>赛道为固定 20 个，不可新增或删除。如需修改赛道信息，请联系系统管理员。
        </p>
      </div>
    </div>
  );
}
