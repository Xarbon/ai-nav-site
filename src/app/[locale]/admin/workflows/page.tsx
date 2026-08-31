'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import categoriesData from '@/data/categories.json';

export default function AdminWorkflowsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<any>({
    workflow_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
    difficulty: 'simple', time_cost: '', output_zh: '', output_en: '',
    prerequisite_zh: '', prerequisite_en: '', is_opc_selected: false,
    steps: '[]', alternative_tools: '[]', faq: '[]',
    cover_image: '', status: 'draft',
  });

  useEffect(() => { loadWorkflows(); }, []);

  const loadWorkflows = async () => {
    const res = await fetch('/api/admin/workflows');
    const data = await res.json();
    if (data.success) setWorkflows(data.workflows);
    setLoading(false);
  };

  const handleEdit = (wf: any) => {
    setForm({
      workflow_id: wf.workflow_id, zh_title: wf.zh_title || '', en_title: wf.en_title || '',
      track_slug: wf.track_slug || 'ecommerce', difficulty: wf.difficulty || 'simple',
      time_cost: wf.time_cost || '', output_zh: wf.output_zh || '', output_en: wf.output_en || '',
      prerequisite_zh: wf.prerequisite_zh || '', prerequisite_en: wf.prerequisite_en || '',
      is_opc_selected: !!wf.is_opc_selected,
      steps: typeof wf.steps === 'string' ? wf.steps : JSON.stringify(wf.steps || [], null, 2),
      alternative_tools: typeof wf.alternative_tools === 'string' ? wf.alternative_tools : JSON.stringify(wf.alternative_tools || [], null, 2),
      faq: typeof wf.faq === 'string' ? wf.faq : JSON.stringify(wf.faq || [], null, 2),
      cover_image: wf.cover_image || '', status: wf.status || 'draft',
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({
      workflow_id: '', zh_title: '', en_title: '', track_slug: 'ecommerce',
      difficulty: 'simple', time_cost: '', output_zh: '', output_en: '',
      prerequisite_zh: '', prerequisite_en: '', is_opc_selected: false,
      steps: '[]', alternative_tools: '[]', faq: '[]',
      cover_image: '', status: 'draft',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/workflows', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        steps: JSON.parse(form.steps || '[]'),
        alternative_tools: JSON.parse(form.alternative_tools || '[]'),
        faq: JSON.parse(form.faq || '[]'),
      }),
    });
    const data = await res.json();
    if (data.success) { setShowForm(false); loadWorkflows(); }
    else alert(data.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isZh ? '确认删除？' : 'Delete?')) return;
    await fetch(`/api/admin/workflows?id=${id}`, { method: 'DELETE' });
    loadWorkflows();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isZh ? '工作流管理' : 'Workflows'}</h1>
          <p className="text-gray-600">{isZh ? '管理所有工作流数据' : 'Manage all workflows'}</p>
        </div>
        <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + {isZh ? '新增' : 'New'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">{isZh ? '编辑工作流' : 'Edit Workflow'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input value={form.workflow_id} onChange={e => setForm({...form, workflow_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg" placeholder="wf-001" />
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '难度' : 'Difficulty'}</label>
              <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '耗时' : 'Time Cost'}</label>
              <input value={form.time_cost} onChange={e => setForm({...form, time_cost: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '中文产出' : 'Output (ZH)'}</label>
              <textarea value={form.output_zh} onChange={e => setForm({...form, output_zh: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isZh ? '英文产出' : 'Output (EN)'}</label>
              <textarea value={form.output_en} onChange={e => setForm({...form, output_en: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Steps (JSON)</label>
            <textarea value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_opc_selected} onChange={e => setForm({...form, is_opc_selected: e.target.checked})} />
              <span className="text-sm">OPC {isZh ? '精选' : 'Selected'}</span>
            </label>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '难度' : 'Difficulty'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '状态' : 'Status'}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OPC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {workflows.map((wf: any) => (
              <tr key={wf.workflow_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{wf.workflow_id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{wf.zh_title}</div>
                  <div className="text-sm text-gray-500">{wf.en_title}</div>
                </td>
                <td className="px-6 py-4 text-sm">{wf.track_slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${wf.difficulty === 'hard' ? 'bg-red-100 text-red-800' : wf.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {wf.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${wf.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {wf.status}
                  </span>
                </td>
                <td className="px-6 py-4">{wf.is_opc_selected ? '✅' : '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(wf)} className="text-blue-600 hover:text-blue-800 text-sm">{isZh ? '编辑' : 'Edit'}</button>
                    <button onClick={() => handleDelete(wf.workflow_id)} className="text-red-600 hover:text-red-800 text-sm">{isZh ? '删除' : 'Delete'}</button>
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
