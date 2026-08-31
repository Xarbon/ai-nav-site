'use client';

import { useState, useEffect } from 'react';

export default function ImportPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{success: number; failed: number; errors: string[]} | null>(null);
  const [adminToken, setAdminToken] = useState('');

  useEffect(() => {
    // Check if already authenticated and has token
    const auth = sessionStorage.getItem('admin_auth');
    const token = sessionStorage.getItem('admin_token');
    if (auth === 'true' && token) {
      setIsAuthenticated(true);
      setAdminToken(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_token', password);
        setAdminToken(password);
        setPasswordError('');
      } else {
        setPasswordError(data.error || '密码错误');
      }
    } catch (error) {
      setPasswordError('验证失败');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload error:', error);
      setResult({success: 0, failed: 0, errors: ['Upload failed']});
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setPassword('');
    setAdminToken('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入管理员密码"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Excel 导入工具</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          退出登录
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">上传 Excel 文件</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            选择 .xlsx 或 .xls 文件（共36列，带*为必填）
          </label>
          <p className="text-xs mb-3" style={{color: '#9CA3AF'}}>
            必填字段：工具名称*、官网链接*、一句话描述*、一级分类*。JSON数组字段格式：["值1","值2"]
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? '上传中...' : '上传'}
        </button>

        <a
          href="/ai-tools-template-v3.xlsx"
          download
          className="ml-4 text-blue-600 hover:underline"
        >
          下载模板文件（36列，含全部字段）
        </a>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">导入结果</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">{result.success}</div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">错误详情:</h3>
              <ul className="list-disc list-inside text-sm text-red-600 max-h-64 overflow-y-auto">
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
