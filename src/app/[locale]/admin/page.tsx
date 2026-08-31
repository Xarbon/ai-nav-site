import { getDB } from '@/lib/d1/client';

export default async function AdminDashboardPage() {
  const db = getDB();

  // 获取统计数据
  const [toolsCount, workflowsCount, skillsCount, agentsCount] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM tools').first(),
    db.prepare('SELECT COUNT(*) as count FROM workflows').first(),
    db.prepare('SELECT COUNT(*) as count FROM skills').first(),
    db.prepare('SELECT COUNT(*) as count FROM agents').first(),
  ]);

  // 获取最近7天的点击数据
  const recentClicks = await db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM tool_clicks 
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  // 获取热门工具（点击数最多的前10个）
  const topTools = await db.prepare(`
    SELECT t.name, t.name_en, COUNT(tc.id) as clicks
    FROM tools t
    LEFT JOIN tool_clicks tc ON t.id = tc.tool_id
    GROUP BY t.id
    ORDER BY clicks DESC
    LIMIT 10
  `).all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">仪表盘</h1>
        <p className="text-gray-600">网站数据概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">AI 工具</p>
              <p className="text-3xl font-bold">{(toolsCount as any)?.count || 0}</p>
            </div>
            <div className="text-4xl">🔧</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">工作流</p>
              <p className="text-3xl font-bold">{(workflowsCount as any)?.count || 0}</p>
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">技能</p>
              <p className="text-3xl font-bold">{(skillsCount as any)?.count || 0}</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">智能体</p>
              <p className="text-3xl font-bold">{(agentsCount as any)?.count || 0}</p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>
        </div>
      </div>

      {/* 最近7天点击趋势 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">最近7天点击趋势</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {(recentClicks.results as any[]).map((item, idx) => {
            const maxCount = Math.max(...(recentClicks.results as any[]).map(r => r.count));
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition" style={{ height: `${height}%` }}></div>
                <div className="text-xs text-gray-600">{item.date.slice(5)}</div>
                <div className="text-sm font-semibold">{item.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热门工具排行 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">热门工具 Top 10</h2>
        <div className="space-y-3">
          {(topTools.results as any[]).map((tool, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.name_en}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{tool.clicks}</p>
                <p className="text-xs text-gray-600">次点击</p>
              </div>
            </div>
          ))}
          {(topTools.results as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-8">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
