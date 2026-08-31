'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isZh = locale === 'zh';
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Set admin cookie
        document.cookie = 'admin_auth=verified; path=/; max-age=86400; samesite=strict';
        router.push('/' + locale + '/admin');
      } else {
        setError(isZh ? '密码错误' : 'Wrong password');
      }
    } catch (err) {
      setError(isZh ? '网络错误' : 'Network error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AIqury</h1>
          <p className="text-gray-600 mt-2">{isZh ? '管理后台登录' : 'Admin Login'}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isZh ? '管理密码' : 'Admin Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isZh ? '请输入管理密码' : 'Enter admin password'}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? (isZh ? '登录中...' : 'Logging in...') : (isZh ? '登录' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isZh ? '请联系管理员获取登录密码' : 'Contact admin for password'}
        </div>
      </div>
    </div>
  );
}
