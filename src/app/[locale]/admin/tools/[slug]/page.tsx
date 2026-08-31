'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';

export default function ToolEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  const isNew = slug === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<any>({
    slug: '', name: '', name_en: '', url: '', description: '', description_en: '',
    icon_url: '', category: 'ecommerce', sub_category: '', pricing: 'Free',
    rating: 0, is_hot: false, is_recommended: false, is_new: true, is_featured: false,
    affiliate_url: '', sort_order: 0, status: 'draft',
    audience_tags: '', tags: '', language_zh: true, language_en: false,
  });

  const categories = categoriesData.categories;

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/tools?slug=${slug}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.tool) {
            const t = data.tool;
            let audienceTags = t.audience_tags || '[]';
            let tags = t.tags || '[]';
            let langs = t.language || '["zh"]';
            try { audienceTags = JSON.parse(audienceTags); } catch {}
            try { tags = JSON.parse(tags); } catch {}
            try { langs = JSON.parse(langs); } catch {}
            setForm({
              slug: t.slug, name: t.name, name_en: t.name_en, url: t.url,
              description: t.description || '', description_en: t.description_en || '',
              icon_url: t.icon_url || '', category: t.category, sub_category: t.sub_category || '',
              pricing: t.pricing || 'Free', rating: t.rating || 0,
              is_hot: !!t.is_hot, is_recommended: !!t.is_recommended,
              is_new: !!t.is_new, is_featured: !!t.is_featured,
              affiliate_url: t.affiliate_url || '', sort_order: t.sort_order || 0,
              status: t.status || 'draft',
              audience_tags: Array.isArray(audienceTags) ? audienceTags.join(', ') : '',
              tags: Array.isArray(tags) ? tags.join(', ') : '',
              language_zh: langs.includes('zh'), language_en: langs.includes('en'),
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [slug, isNew]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const langs: string[] = [];
    if (form.language_zh) langs.push('zh');
    if (form.language_en) langs.push('en');

    const payload = {
      ...form,
      audience_tags: form.audience_tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      language: langs,
    };

    try {
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/admin/tools', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(isZh ? '保存成功！' : 'Saved successfully!');
        if (isNew) router.push(`/admin/tools`);
      } else {
        setMessage(data.error || 'Save failed');
      }
    } catch (e) {
      setMessage('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(isZh ? '确认删除此工具？' : 'Delete this tool?')) return;
    const res = await fetch(`/api/admin/tools?slug=${slug}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) router.push('/admin/tools');
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  const currentCat = categories.find((c: any) => c.slug === form.category);
  const subCategories = (currentCat as any)?.sub_categories || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? (isZh ? '新增工具' : 'New Tool') : (isZh ? '编辑工具' : 'Edit Tool')}</h1>
          <p className="text-gray-500 text-sm mt-1">{slug}</p>
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <button onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
              {isZh ? '删除' : 'Delete'}
            </button>
          )}
          <Link href="/admin/tools" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            {isZh ? '返回' : 'Back'}
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.includes('成功') || message.includes('Saved') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? 'Slug (URL标识)' : 'Slug'}</label>
            <input value={form.slug} onChange={e => handleChange('slug', e.target.value)} disabled={!isNew}
              className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100" placeholder="e.g. chatgpt" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '状态' : 'Status'}</label>
            <select value={form.status} onChange={e => handleChange('status', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="draft">{isZh ? '草稿' : 'Draft'}</option>
              <option value="active">{isZh ? '已发布' : 'Active'}</option>
              <option value="archived">{isZh ? '已归档' : 'Archived'}</option>
            </select>
          </div>
        </div>

        {/* 双语名称 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '中文名称' : 'Chinese Name'}</label>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '英文名称' : 'English Name'}</label>
            <input value={form.name_en} onChange={e => handleChange('name_en', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        {/* 网址 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '工具网址' : 'Tool URL'}</label>
            <input value={form.url} onChange={e => handleChange('url', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '图标URL' : 'Icon URL'}</label>
            <input value={form.icon_url} onChange={e => handleChange('icon_url', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
          </div>
        </div>

        {/* 双语描述 */}
        <div>
          <label className="block text-sm font-medium mb-1">{isZh ? '中文描述' : 'Chinese Description'}</label>
          <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{isZh ? '英文描述' : 'English Description'}</label>
          <textarea value={form.description_en} onChange={e => handleChange('description_en', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        {/* 分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '赛道' : 'Track'}</label>
            <select value={form.category} onChange={e => { handleChange('category', e.target.value); handleChange('sub_category', ''); }} className="w-full px-3 py-2 border rounded-lg">
              {categories.map((cat: any) => (
                <option key={cat.slug} value={cat.slug}>{isZh ? cat.name : cat.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '子分类' : 'Sub Category'}</label>
            <select value={form.sub_category} onChange={e => handleChange('sub_category', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">{isZh ? '无' : 'None'}</option>
              {subCategories.map((sc: any) => (
                <option key={sc.slug} value={sc.slug}>{isZh ? sc.name : sc.name_en || sc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 定价和评分 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '定价模式' : 'Pricing'}</label>
            <select value={form.pricing} onChange={e => handleChange('pricing', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="Free">Free</option>
              <option value="Freemium">Freemium</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '评分' : 'Rating'}</label>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => handleChange('rating', parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '排序权重' : 'Sort Order'}</label>
            <input type="number" value={form.sort_order} onChange={e => handleChange('sort_order', parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        {/* 标记 */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_hot} onChange={e => handleChange('is_hot', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">🔥 {isZh ? '热门' : 'Hot'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_recommended} onChange={e => handleChange('is_recommended', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">⭐ {isZh ? '推荐' : 'Recommended'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_new} onChange={e => handleChange('is_new', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">🆕 {isZh ? '最新' : 'New'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => handleChange('is_featured', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">✨ {isZh ? '精选' : 'Featured'}</span>
          </label>
        </div>

        {/* 语言支持 */}
        <div>
          <label className="block text-sm font-medium mb-2">{isZh ? '支持语言' : 'Languages'}</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.language_zh} onChange={e => handleChange('language_zh', e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">中文</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.language_en} onChange={e => handleChange('language_en', e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">English</span>
            </label>
          </div>
        </div>

        {/* 标签 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '受众标签（逗号分隔）' : 'Audience Tags (comma separated)'}</label>
            <input value={form.audience_tags} onChange={e => handleChange('audience_tags', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="beginner, professional, student" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isZh ? '技术标签（逗号分隔）' : 'Tech Tags (comma separated)'}</label>
            <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="GPT-4, LLM, NLP" />
          </div>
        </div>

        {/* 联盟链接 */}
        <div>
          <label className="block text-sm font-medium mb-1">{isZh ? '联盟链接' : 'Affiliate URL'}</label>
          <input value={form.affiliate_url} onChange={e => handleChange('affiliate_url', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href="/admin/tools" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            {isZh ? '取消' : 'Cancel'}
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
