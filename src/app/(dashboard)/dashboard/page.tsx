'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Site {
  id: string;
  subdomain: string;
  full_domain: string;
  name: string;
  is_active: boolean;
  created_at: string;
  domain: {
    id: string;
    domain: string;
    name: string;
  };
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('sites')
      .select(`
        *,
        domain:domains(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setSites(data || []);
    setLoading(false);
  }

  async function toggleSiteStatus(siteId: string, isActive: boolean) {
    await supabase
      .from('sites')
      .update({ is_active: !isActive })
      .eq('id', siteId);
    loadSites();
  }

  async function deleteSite(siteId: string, name: string) {
    if (!confirm(`確定要刪除站點「${name}」嗎？此操作無法復原！`)) return;
    
    await supabase.from('sites').delete().eq('id', siteId);
    loadSites();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的站點</h1>
          <p className="text-gray-600 mt-1">管理你的聯盟行銷網站</p>
        </div>
        <Link
          href="/dashboard/sites/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> 創建新站點
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">還沒有站點</h2>
          <p className="text-gray-600 mb-6">創建你的第一個聯盟行銷站點吧！</p>
          <Link
            href="/dashboard/sites/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <span>➕</span> 創建新站點
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{site.name}</h2>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        site.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {site.is_active ? '✅ 啟用中' : '⏸️ 已停用'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    🌐 <a href={`https://${site.full_domain}`} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{site.full_domain}</a>
                  </p>
                  <p className="text-sm text-gray-500">
                    主網域：{site.domain?.name} ({site.domain?.domain})
                  </p>
                  <p className="text-sm text-gray-500">
                    創建時間：{new Date(site.created_at).toLocaleDateString('zh-TW')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    📝 管理
                  </Link>
                  <a
                    href={`https://${site.full_domain}`}
                    target="_blank"
                    rel="noopener"
                    className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    🔗 預覽
                  </a>
                  <button
                    onClick={() => toggleSiteStatus(site.id, site.is_active)}
                    className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                    title={site.is_active ? '停用站點' : '啟用站點'}
                  >
                    {site.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => deleteSite(site.id, site.name)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    title="刪除站點"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
