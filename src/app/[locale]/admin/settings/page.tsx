'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function AdminSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.success) {
        setSettings({
          site_name_zh: data.settings.site_name_zh || 'AIqury',
          site_name_en: data.settings.site_name_en || 'AIqury',
          copyright_zh: data.settings.copyright_zh || '© 2024 AIqury',
          copyright_en: data.settings.copyright_en || '© 2024 AIqury',
          icp: data.settings.icp || '',
          enable_reviews: data.settings.enable_reviews !== 'false',
          enable_scores: data.settings.enable_scores !== 'false',
          enable_ads: data.settings.enable_ads !== 'false',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setMessage(data.success ? (isZh ? '保存成功' : 'Saved') : (isZh ? '保存失败' : 'Failed'));
    setSaving(false);
  };

  const handleClearCache = async () => {
    if (!confirm(isZh ? '确认清除所有缓存？' : 'Clear all cache?')) return;
    setMessage(isZh ? '缓存已清除' : 'Cache cleared');
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isZh ? '站点设置' : 'Settings'}</h1>
        <p className="text-gray-600">{isZh ? '配置网站全局参数' : 'Global site configuration'}</p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-green-100 text-green-800">{message}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold">{isZh ? '基本信息' : 'Basic Info'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '网站名称（中文）' : 'Site Name (ZH)'}</label>
            <input value={settings.site_name_zh} onChange={e => setSettings({...settings, site_name_zh: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '网站名称（英文）' : 'Site Name (EN)'}</label>
            <input value={settings.site_name_en} onChange={e => setSettings({...settings, site_name_en: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '版权信息（中文）' : 'Copyright (ZH)'}</label>
            <input value={settings.copyright_zh} onChange={e => setSettings({...settings, copyright_zh: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '版权信息（英文）' : 'Copyright (EN)'}</label>
            <input value={settings.copyright_en} onChange={e => setSettings({...settings, copyright_en: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{isZh ? 'ICP备案号' : 'ICP Number'}</label>
          <input value={settings.icp} onChange={e => setSettings({...settings, icp: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">{isZh ? '功能开关' : 'Feature Toggles'}</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.enable_reviews} onChange={e => setSettings({...settings, enable_reviews: e.target.checked})} className="w-4 h-4" />
            <span>{isZh ? '启用评论功能' : 'Enable Reviews'}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.enable_scores} onChange={e => setSettings({...settings, enable_scores: e.target.checked})} className="w-4 h-4" />
            <span>{isZh ? '启用打分功能' : 'Enable Scoring'}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.enable_ads} onChange={e => setSettings({...settings, enable_ads: e.target.checked})} className="w-4 h-4" />
            <span>{isZh ? '启用广告展示' : 'Enable Ads'}</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">{isZh ? '缓存管理' : 'Cache Management'}</h2>
        <button onClick={handleClearCache} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
          🗑️ {isZh ? '清除所有缓存' : 'Clear All Cache'}
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存设置' : 'Save Settings')}
        </button>
      </div>
    </div>
  );
}
