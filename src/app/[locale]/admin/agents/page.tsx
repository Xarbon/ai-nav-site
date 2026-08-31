'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import categoriesData from '@/data/categories.json';

export default function AdminAgentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<any>({
    agent_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
    zh_short_desc: '', en_short_desc: '', zh_capability: '', en_capability: '',
    zh_limit: '', en_limit: '', related_workflow_ids: '[]',
    official_url: '', tag_list_zh: '[]', tag_list_en: '[]',
    cover_image: '', status: 'draft',
  });

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    const res = await fetch('/api/admin/agents');
    const data = await res.json();
    if (data.success) setAgents(data.agents);
    setLoading(false);
  };

  const handleEdit = (ag: any) => {
    setForm({
      agent_id: ag.agent_id, zh_title: ag.zh_title || '', en_title: ag.en_title || '',
      track_slug: ag.track_slug || 'ecommerce',
      zh_short_desc: ag.zh_short_desc || '', en_short_desc: ag.en_short_desc || '',
      zh_capability: ag.zh_capability || '', en_capability: ag.en_capability || '',
      zh_limit: ag.zh_limit || '', en_limit: ag.en_limit || '',
      related_workflow_ids: typeof ag.related_workflow_ids === 'string' ? ag.related_workflow_ids : JSON.stringify(ag.related_workflow_ids || [], null, 2),
      official_url: ag.official_url || '',
      tag_list_zh: typeof ag.tag_list_zh === 'string' ? ag.tag_list_zh : JSON.stringify(ag.tag_list_zh || [], null, 2),
      tag_list_en: typeof ag.tag_list_en === 'string' ? ag.tag_list_en : JSON.stringify(ag.tag_list_en || [], null, 2),
      cover_image: ag.cover_image || '', status: ag.status || 'draft',
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({
      agent_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
      zh_short_desc: '', en_short_desc: '', zh_capability: '', en_capability: '',
      zh_limit: '', en_limit: '', related_workflow_ids: '[]',
      official_url: '', tag_list_zh: '[]', tag_list_en: '[]',
      cover_image: '', status: 'draft',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const method = agents.find(a => a.agent_id === form.agent_id) ? 'PUT' : 'POST';
    let relatedIds: string[] = [], tagsZh: string[] = [], tagsEn: string[] = [];
    try { relatedIds = JSON.parse(form.related_workflow_ids || '[]'); } catch {}
    try { tagsZh = JSON.parse(form.tag_list_zh || '[]'); } catch {}
    try { tagsEn = JSON.parse(form.tag_list_en || '[]'); } catch {}
    const res = await fetch('/api/admin/agents', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, related_workflow_ids: relatedIds, tag_list_zh: tagsZh, tag_list_en: tagsEn }),
    });
    const data = await res.json();
    if (data.success) { setShowForm(false); loadAgents(); }
    else alert(data.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isZh ? '确认删除？' : 'Delete?')) return;
    await fetch(`/api/admin/agents?id=${id}`, { method: 'DELETE' });
    loadAgents();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isZh ? '智能体管理' : 'Agents'}</h1>
          <p className="text-gray-600">{isZh ? '管理所有 AI 智能体数据' : 'Manage all AI agents'}</p>
        </div>
        <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + {isZh ? '新增' : 'New'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">{isZh ? '编辑智能体' : 'Edit Agent'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="ag-001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '赛道' : 'Track'}</label>
              <select value={form.track_slug} onChange={e => setForm({...form, track_slug: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                {categoriesData.categories.map((c: any) => <option key={c.slug} value={c.slug}>{isZh ? c.name : c.name_en}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '中文标题' : 'Chinese Title'}</label>
              <input value={form.zh_title} onChange={e => setForm({...form, zh_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文标题' : 'English Title'}</label>
              <input value={form.en_title} onChange={e => setForm({...form, en_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '中文简介' : 'Short Desc (ZH)'}</label>
              <textarea value={form.zh_short_desc} onChange={e => setForm({...form, zh_short_desc: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文简介' : 'Short Desc (EN)'}</label>
              <textarea value={form.en_short_desc} onChange={e => setForm({...form, en_short_desc: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '中文能力' : 'Capability (ZH)'}</label>
              <textarea value={form.zh_capability} onChange={e => setForm({...form, zh_capability: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文能力' : 'Capability (EN)'}</label>
              <textarea value={form.en_capability} onChange={e => setForm({...form, en_capability: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '中文局限' : 'Limitation (ZH)'}</label>
              <textarea value={form.zh_limit} onChange={e => setForm({...form, zh_limit: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文局限' : 'Limitation (EN)'}</label>
              <textarea value={form.en_limit} onChange={e => setForm({...form, en_limit: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '官网链接' : 'Official URL'}</label>
              <input value={form.official_url} onChange={e => setForm({...form, official_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '状态' : 'Status'}</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="draft">{isZh ? '草稿' : 'Draft'}</option>
                <option value="active">{isZh ? '发布' : 'Active'}</option>
                <option value="archived">{isZh ? '归档' : 'Archived'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">{isZh ? '取消' : 'Cancel'}</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isZh ? '保存' : 'Save'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '标题' : 'Title'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '赛道' : 'Track'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '状态' : 'Status'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {agents.map((ag: any) => (
              <tr key={ag.agent_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{ag.agent_id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{ag.zh_title}</div>
                  <div className="text-sm text-gray-500">{ag.en_title}</div>
                </td>
                <td className="px-6 py-4 text-sm">{ag.track_slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${ag.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{ag.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(ag)} className="text-blue-600 hover:text-blue-800 text-sm">{isZh ? '编辑' : 'Edit'}</button>
                    <button onClick={() => handleDelete(ag.agent_id)} className="text-red-600 hover:text-red-800 text-sm">{isZh ? '删除' : 'Delete'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
