
'use client';

import { useState, useEffect } from 'react';
import categoriesData from '@/data/categories.json';

export default function SubmitToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState<string>('zh');
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    url: '',
    description: '',
    description_en: '',
    category: '',
    sub_category: '',
    pricing: 'Free',
    tags: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  const isZh = locale === 'zh';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: isZh ? '提交成功！我们会尽快审核并收录。' : 'Submitted successfully! We will review and list it soon.' });
        setFormData({
          name: '',
          name_en: '',
          url: '',
          description: '',
          description_en: '',
          category: '',
          sub_category: '',
          pricing: 'Free',
          tags: '',
          email: '',
        });
      } else {
        setResult({ success: false, message: data.error || (isZh ? '提交失败，请重试。' : 'Submission failed, please try again.') });
      }
    } catch (error) {
      setResult({ success: false, message: isZh ? '网络错误，请重试。' : 'Network error, please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categoriesData.categories.find(c => c.slug === formData.category);

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border-color)] p-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#0E3A7A' }}>
            {isZh ? '提交 AI 工具' : 'Submit AI Tool'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {isZh ? '发现好用的 AI 工具？推荐给我们，审核后收录。' : 'Found a great AI tool? Recommend it to us, we will review and list it.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '工具名称' : 'Tool Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder={isZh ? '例如：即梦AI' : 'e.g., Jimeng AI'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '英文名称' : 'English Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="e.g., Jimeng AI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '官网链接' : 'Website URL'} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '一句话描述' : 'One-line Description'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder={isZh ? '简短描述这个工具的核心功能' : 'Briefly describe the core function of this tool'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '英文描述' : 'English Description'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description_en}
                onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder="Brief English description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '一级分类' : 'Category'} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value, sub_category: ''})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              >
                <option value="">{isZh ? '请选择分类' : 'Select category'}</option>
                {categoriesData.categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {isZh ? cat.name : cat.name_en || cat.name}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '定价模式' : 'Pricing Model'}
              </label>
              <select
                value={formData.pricing}
                onChange={(e) => setFormData({...formData, pricing: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
              >
                <option value="Free">{isZh ? '免费' : 'Free'}</option>
                <option value="Freemium">{isZh ? '免费增值' : 'Freemium'}</option>
                <option value="Paid">{isZh ? '付费' : 'Paid'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '技术标签' : 'Tags'}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder={isZh ? '多个标签用逗号分隔，如：图片生成,视频生成' : 'Comma separated, e.g., image generation,video'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-title)' }}>
                {isZh ? '联系邮箱' : 'Contact Email'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                placeholder={isZh ? '选填，用于通知审核结果' : 'Optional, for notification'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-md text-white font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0E3A7A' }}
            >
              {submitting ? (isZh ? '提交中...' : 'Submitting...') : (isZh ? '提交工具' : 'Submit Tool')}
            </button>

            {result && (
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {result.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
