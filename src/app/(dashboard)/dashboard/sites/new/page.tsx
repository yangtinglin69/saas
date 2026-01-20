'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { DEFAULT_MODULES } from '@/lib/auth';

interface Domain {
  id: string;
  domain: string;
  name: string;
}

export default function NewSitePage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    const { data } = await supabase
      .from('domains')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setDomains(data || []);
    if (data && data.length > 0) {
      setSelectedDomain(data[0].id);
    }
  }

  async function checkSubdomain() {
    if (!subdomain || !selectedDomain) return;
    
    setCheckingSubdomain(true);
    
    const domain = domains.find(d => d.id === selectedDomain);
    if (!domain) return;
    
    const fullDomain = `${subdomain}.${domain.domain}`;
    
    const { data } = await supabase
      .from('sites')
      .select('id')
      .eq('full_domain', fullDomain)
      .single();
    
    setSubdomainAvailable(!data);
    setCheckingSubdomain(false);
  }

  useEffect(() => {
    if (subdomain && selectedDomain) {
      const timer = setTimeout(checkSubdomain, 500);
      return () => clearTimeout(timer);
    }
  }, [subdomain, selectedDomain]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('請先登入');

      const domain = domains.find(d => d.id === selectedDomain);
      if (!domain) throw new Error('請選擇主網域');

      const fullDomain = `${subdomain}.${domain.domain}`;

      // 創建站點
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          domain_id: selectedDomain,
          subdomain,
          full_domain: fullDomain,
          name,
          config: {
            name,
            tagline: '',
            logo: '',
            favicon: '',
            seo: { title: name, description: '', keywords: [], ogImage: '' },
            colors: {
              primary: '#1e3a5f',
              secondary: '#2d4a6f',
              accent: '#3b82f6',
              headerBg: '#1e3a5f',
              headerText: '#ffffff',
              footerBg: '#111827',
              footerText: '#9ca3af',
              buttonBg: '#22c55e',
              buttonText: '#ffffff',
              buttonHover: '#16a34a',
            },
            typography: {
              headingWeight: '700',
              bodyWeight: '400',
              headingItalic: false,
              bodyItalic: false,
            },
            tracking: { gaId: '', gtmId: '', fbPixelId: '', customHead: '' },
            ai: { openaiKey: '', model: 'gpt-4o-mini', language: 'en' },
            footer: { disclaimer: '', copyright: `© ${new Date().getFullYear()} ${name}` },
            adsense: { enabled: false, publisherId: '', slots: {} },
          },
        })
        .select()
        .single();

      if (siteError) throw siteError;

      // 創建預設模組
      const modulesToInsert = DEFAULT_MODULES.map((m) => ({
        ...m,
        site_id: site.id,
      }));

      await supabase.from('modules').insert(modulesToInsert);

      router.push(`/dashboard/sites/${site.id}`);
    } catch (err: any) {
      setError(err.message || '創建失敗');
    } finally {
      setLoading(false);
    }
  }

  const selectedDomainObj = domains.find(d => d.id === selectedDomain);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← 返回站點列表
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">創建新站點</h1>
        <p className="text-gray-600 mt-2">設定你的子網域和站點名稱</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 選擇主網域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇主網域
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name} ({domain.domain})
                </option>
              ))}
            </select>
          </div>

          {/* 子網域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              子網域
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => {
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  setSubdomainAvailable(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="mattress"
                pattern="[a-z0-9-]+"
                required
              />
              <span className="text-gray-500">
                .{selectedDomainObj?.domain || 'example.com'}
              </span>
            </div>
            {checkingSubdomain && (
              <p className="mt-2 text-sm text-gray-500">檢查中...</p>
            )}
            {subdomainAvailable === true && (
              <p className="mt-2 text-sm text-green-600">✅ 此子網域可用</p>
            )}
            {subdomainAvailable === false && (
              <p className="mt-2 text-sm text-red-600">❌ 此子網域已被使用</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              只能使用小寫英文、數字和連字號（-）
            </p>
          </div>

          {/* 站點名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              站點名稱
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="床墊評比站"
              required
            />
          </div>

          {/* 預覽 */}
          {subdomain && selectedDomainObj && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">網站網址預覽：</p>
              <p className="text-blue-600 font-mono">
                https://{subdomain}.{selectedDomainObj.domain}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 py-3 text-center text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || subdomainAvailable === false}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建站點'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
