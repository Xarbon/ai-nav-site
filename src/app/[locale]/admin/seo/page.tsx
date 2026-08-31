'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const PAGES = [
  { key: 'home', label_zh: '首页', label_en: 'Home' },
  { key: 'workflow', label_zh: '工作流', label_en: 'Workflows' },
  { key: 'skillhub', label_zh: '技能中心', label_en: 'SkillHub' },
  { key: 'agent', label_zh: '智能体', label_en: 'Agents' },
  { key: 'tools', label_zh: '工具库', label_en: 'Tools' },
];

export default function AdminSEOPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const [seoData, setSeoData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/seo').then(r => r.json()).then(data => {
      if (data.success) {
        const map: Record<string, any> = {};
        for (const item of data.seo as any[]) {
          map[item.page_key] = item;
        }
        setSeoData(map);
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (pageKey: string, field: string, value: string) => {
    setSeoData(prev => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || { page_key: pageKey }), [field]: value, page_key: pageKey },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const pageKey of Object.keys(seoData)) {
      await fetch('/api/admin/seo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoData[pageKey]),
      });
    }
    setMessage(isZh ? '保存成功' : 'Saved');
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isZh ? 'SEO 管理' : 'SEO Management'}</h1>
          <p className="text-gray-600">{isZh ? '配置各页面搜索引擎优化信息' : 'Configure SEO for each page'}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存全部' : 'Save All')}
        </button>
      </div>

      {message && <div className="p-3 rounded-lg bg-green-100 text-green-800">{message}</div>}

      {PAGES.map(page => {
        const data = seoData[page.key] || { page_key: page.key };
        return (
          <div key={page.key} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">{isZh ? page.label_zh : page.label_en}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '标题（中文）' : 'Title (ZH)'}</label>
                <input value={data.title_zh || ''} onChange={e => handleChange(page.key, 'title_zh', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '标题（英文）' : 'Title (EN)'}</label>
                <input value={data.title_en || ''} onChange={e => handleChange(page.key, 'title_en', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '描述（中文）' : 'Description (ZH)'}</label>
                <textarea value={data.description_zh || ''} onChange={e => handleChange(page.key, 'description_zh', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '描述（英文）' : 'Description (EN)'}</label>
                <textarea value={data.description_en || ''} onChange={e => handleChange(page.key, 'description_en', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '关键词（中文，逗号分隔）' : 'Keywords (ZH, comma separated)'}</label>
                <input value={data.keywords_zh || ''} onChange={e => handleChange(page.key, 'keywords_zh', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isZh ? '关键词（英文，逗号分隔）' : 'Keywords (EN, comma separated)'}</label>
                <input value={data.keywords_en || ''} onChange={e => handleChange(page.key, 'keywords_en', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
