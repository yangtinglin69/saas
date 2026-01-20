'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SiteOverviewPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  
  const [productsCount, setProductsCount] = useState(0);
  const [modulesCount, setModulesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [siteId]);

  async function loadStats() {
    const [productsRes, modulesRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supabase.from('modules').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('enabled', true),
    ]);
    setProductsCount(productsRes.count || 0);
    setModulesCount(modulesRes.count || 0);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-3xl font-bold text-gray-900">{productsCount}</div>
          <div className="text-gray-600">產品數量</div>
          <Link href={`/dashboard/sites/${siteId}/products`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            管理產品 →
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl mb-2">🧩</div>
          <div className="text-3xl font-bold text-gray-900">{modulesCount}</div>
          <div className="text-gray-600">啟用模組</div>
          <Link href={`/dashboard/sites/${siteId}/modules`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            管理模組 →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl mb-2">🚀</div>
          <div className="text-lg font-medium text-green-600">已上線</div>
          <div className="text-gray-600">網站狀態</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href={`/dashboard/sites/${siteId}/products`} className="p-4 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium text-sm">新增產品</div>
          </Link>
          <Link href={`/dashboard/sites/${siteId}/import`} className="p-4 rounded-lg border hover:bg-purple-50 hover:border-purple-300 transition text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium text-sm">AI 生成</div>
          </Link>
          <Link href={`/dashboard/sites/${siteId}/modules`} className="p-4 rounded-lg border hover:bg-green-50 hover:border-green-300 transition text-center">
            <div className="text-2xl mb-2">🧩</div>
            <div className="font-medium text-sm">調整模組</div>
          </Link>
          <Link href={`/dashboard/sites/${siteId}/settings`} className="p-4 rounded-lg border hover:bg-amber-50 hover:border-amber-300 transition text-center">
            <div className="text-2xl mb-2">🎨</div>
            <div className="font-medium text-sm">自訂風格</div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {productsCount === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 快速開始指南</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1️⃣ 到「網站設定」填入網站名稱和顏色</li>
            <li>2️⃣ 到「匯入中心」用 AI 快速生成產品資料</li>
            <li>3️⃣ 到「產品管理」微調內容和聯盟連結</li>
            <li>4️⃣ 到「模組管理」調整頁面區塊</li>
            <li>5️⃣ 預覽網站，開始推廣！</li>
          </ol>
        </div>
      )}
    </div>
  );
}
