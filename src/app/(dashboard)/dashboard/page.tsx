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
    name: string;
  };
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    loadSites();
    const guideHidden = localStorage.getItem('hideGuide');
    if (guideHidden) setShowGuide(false);
  }, []);

  async function loadSites() {
    const { data } = await supabase
      .from('sites')
      .select('*, domain:domains(*)')
      .order('created_at', { ascending: false });

    setSites(data || []);
    setLoading(false);
  }

  function hideGuide() {
    setShowGuide(false);
    localStorage.setItem('hideGuide', 'true');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的站點</h1>
          <p className="text-gray-600 mt-1">管理你的聯盟行銷網站</p>
        </div>
        <Link
          href="/dashboard/sites/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + 創建新站點
        </Link>
      </div>

      {showGuide && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">歡迎使用聯盟行銷系統！</h2>
              <p className="text-gray-600 mb-4">依照以下步驟開始建立你的第一個站點：</p>
            </div>
            <button
              onClick={hideGuide}
              className="text-gray-400 hover:text-gray-600"
            >
              X
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">1</div>
              <h3 className="font-semibold text-gray-900 mb-1">創建站點</h3>
              <p className="text-sm text-gray-600">點擊創建新站點，選擇主網域並設定子網域名稱</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">2</div>
              <h3 className="font-semibold text-gray-900 mb-1">新增產品</h3>
              <p className="text-sm text-gray-600">進入站點，在產品管理新增你要推廣的產品</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">3</div>
              <h3 className="font-semibold text-gray-900 mb-1">設定模組</h3>
              <p className="text-sm text-gray-600">在模組管理編輯首屏、痛點、故事等區塊</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">4</div>
              <h3 className="font-semibold text-gray-900 mb-1">查看網站</h3>
              <p className="text-sm text-gray-600">點擊查看網站預覽你的聯盟行銷頁面</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              提示：你也可以使用文章管理發布部落格文章，或透過匯入中心批量匯入產品資料。
            </p>
          </div>
        </div>
      )}

      {sites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">還沒有站點</h2>
          <p className="text-gray-600 mb-6">點擊下方按鈕創建你的第一個聯盟行銷站點</p>
          <Link
            href="/dashboard/sites/new"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + 創建第一個站點
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{site.name}</h3>
                    <p className="text-gray-500 text-sm">{site.full_domain}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    site.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {site.is_active ? '啟用中' : '已停用'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    管理站點
                  </Link>
                  
                    href={`https://${site.full_domain}`}
                    target="_blank"
                    rel="noopener"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    查看
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
