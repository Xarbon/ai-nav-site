'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import categoriesData from '@/data/categories.json';

export default function AdminSkillsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<any>({
    skill_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
    zh_description: '', en_description: '', prompt_zh: '', prompt_en: '',
    usage_scene_zh: '', usage_scene_en: '', related_workflow_ids: '[]',
    copy_count: 0, cover_image: '', status: 'draft',
  });

  useEffect(() => { loadSkills(); }, []);

  const loadSkills = async () => {
    const res = await fetch('/api/admin/skills');
    const data = await res.json();
    if (data.success) setSkills(data.skills);
    setLoading(false);
  };

  const handleEdit = (sk: any) => {
    setForm({
      skill_id: sk.skill_id, zh_title: sk.zh_title || '', en_title: sk.en_title || '',
      track_slug: sk.track_slug || 'ecommerce',
      zh_description: sk.zh_description || '', en_description: sk.en_description || '',
      prompt_zh: sk.prompt_zh || '', prompt_en: sk.prompt_en || '',
      usage_scene_zh: sk.usage_scene_zh || '', usage_scene_en: sk.usage_scene_en || '',
      related_workflow_ids: typeof sk.related_workflow_ids === 'string' ? sk.related_workflow_ids : JSON.stringify(sk.related_workflow_ids || [], null, 2),
      copy_count: sk.copy_count || 0, cover_image: sk.cover_image || '',
      status: sk.status || 'draft',
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({
      skill_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
      zh_description: '', en_description: '', prompt_zh: '', prompt_en: '',
      usage_scene_zh: '', usage_scene_en: '', related_workflow_ids: '[]',
      copy_count: 0, cover_image: '', status: 'draft',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const method = skills.find(s => s.skill_id === form.skill_id) ? 'PUT' : 'POST';
    let relatedIds: string[] = [];
    try { relatedIds = JSON.parse(form.related_workflow_ids || '[]'); } catch {}
    const res = await fetch('/api/admin/skills', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, related_workflow_ids: relatedIds }),
    });
    const data = await res.json();
    if (data.success) { setShowForm(false); loadSkills(); }
    else alert(data.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isZh ? '确认删除？' : 'Delete?')) return;
    await fetch(`/api/admin/skills?id=${id}`, { method: 'DELETE' });
    loadSkills();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isZh ? '技能管理' : 'Skills'}</h1>
          <p className="text-gray-600">{isZh ? '管理所有 AI 技能数据' : 'Manage all AI skills'}</p>
        </div>
        <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + {isZh ? '新增' : 'New'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">{isZh ? '编辑技能' : 'Edit Skill'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input value={form.skill_id} onChange={e => setForm({...form, skill_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="sk-001" />
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
              <label className="block text-sm font-medium mb-1">{isZh ? '中文描述' : 'Description (ZH)'}</label>
              <textarea value={form.zh_description} onChange={e => setForm({...form, zh_description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文描述' : 'Description (EN)'}</label>
              <textarea value={form.en_description} onChange={e => setForm({...form, en_description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt (ZH)</label>
              <textarea value={form.prompt_zh} onChange={e => setForm({...form, prompt_zh: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt (EN)</label>
              <textarea value={form.prompt_en} onChange={e => setForm({...form, prompt_en: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '使用场景 (ZH)' : 'Usage Scene (ZH)'}</label>
              <textarea value={form.usage_scene_zh} onChange={e => setForm({...form, usage_scene_zh: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '使用场景 (EN)' : 'Usage Scene (EN)'}</label>
              <textarea value={form.usage_scene_en} onChange={e => setForm({...form, usage_scene_en: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '状态' : 'Status'}</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="draft">{isZh ? '草稿' : 'Draft'}</option>
                <option value="active">{isZh ? '发布' : 'Active'}</option>
                <option value="archived">{isZh ? '归档' : 'Archived'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '使用次数' : 'Copy Count'}</label>
              <input type="number" value={form.copy_count} onChange={e => setForm({...form, copy_count: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '封面图' : 'Cover Image'}</label>
              <input value={form.cover_image} onChange={e => setForm({...form, cover_image: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '使用次数' : 'Copies'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '状态' : 'Status'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {skills.map((sk: any) => (
              <tr key={sk.skill_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{sk.skill_id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{sk.zh_title}</div>
                  <div className="text-sm text-gray-500">{sk.en_title}</div>
                </td>
                <td className="px-6 py-4 text-sm">{sk.track_slug}</td>
                <td className="px-6 py-4 text-sm">{sk.copy_count || 0}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${sk.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{sk.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(sk)} className="text-blue-600 hover:text-blue-800 text-sm">{isZh ? '编辑' : 'Edit'}</button>
                    <button onClick={() => handleDelete(sk.skill_id)} className="text-red-600 hover:text-red-800 text-sm">{isZh ? '删除' : 'Delete'}</button>
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
