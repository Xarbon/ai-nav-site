'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface AdConfig {
  enabled: boolean;
  label: string;
  contact: string;
}

const AD_SLOTS = [
  { slot: 'header', name: '首页顶部', nameEn: 'Homepage Header' },
  { slot: 'inline', name: '内容中间', nameEn: 'Inline Content' },
  { slot: 'sidebar', name: '侧边栏', nameEn: 'Sidebar' },
  { slot: 'footer', name: '页脚', nameEn: 'Footer' },
];

export default function AdminAdsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';

  const [configs, setConfigs] = useState<Record<string, AdConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/admin/ads');
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      console.error('Load configs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (slot: string, field: keyof AdConfig, value: any) => {
    const newConfigs = {
      ...configs,
      [slot]: {
        ...configs[slot],
        [field]: value
      }
    };
    setConfigs(newConfigs);
  };

  const saveConfig = async (slot: string) => {
    setSaving(slot);
    try {
      const token = sessionStorage.getItem('admin_token') || 'aiqury2024admin';
      const config = configs[slot] || { enabled: false, label: '', contact: '' };

      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ slot, ...config })
      });

      if (res.ok) {
        setMessage(isZh ? slot + ' 配置已保存' : slot + ' config saved');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(isZh ? '保存失败: ' + error.error : 'Save failed: ' + error.error);
      }
    } catch (error) {
      setMessage(isZh ? '保存失败' : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{isZh ? '加载中...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-title)' }}>
        {isZh ? '广告位管理' : 'Ad Slots Management'}
      </h1>

      {message && (
        <div className="mb-4 p-3 rounded-md bg-blue-50 text-blue-700 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {AD_SLOTS.map(({ slot, name, nameEn }) => {
          const config = configs[slot] || { enabled: false, label: '', contact: '' };

          return (
            <div
              key={slot}
              className="border rounded-lg p-4"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-title)' }}>
                  {isZh ? name : nameEn}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => updateConfig(slot, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-body)' }}>
                    {isZh ? '启用' : 'Enable'}
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {isZh ? '广告标签' : 'Ad Label'}
                  </label>
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => updateConfig(slot, 'label', e.target.value)}
                    placeholder={isZh ? '广告位招商' : 'Advertise Here'}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-body)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {isZh ? '联系方式' : 'Contact'}
                  </label>
                  <input
                    type="text"
                    value={config.contact}
                    onChange={(e) => updateConfig(slot, 'contact', e.target.value)}
                    placeholder="ads@aiqury.com"
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-body)'
                    }}
                  />
                </div>

                <button
                  onClick={() => saveConfig(slot)}
                  disabled={saving === slot}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                  style={{
                    background: saving === slot ? 'var(--text-muted)' : 'var(--color-primary)',
                    cursor: saving === slot ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving === slot
                    ? (isZh ? '保存中...' : 'Saving...')
                    : (isZh ? '保存配置' : 'Save Config')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
