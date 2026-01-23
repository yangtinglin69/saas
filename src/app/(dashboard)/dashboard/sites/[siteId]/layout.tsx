'use client';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const siteId = params.siteId as string;
  const [site, setSite] = useState<any>(null);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  async function loadSite() {
    const { data } = await supabase
      .from('sites')
      .select('*, domain:domains(*)')
      .eq('id', siteId)
      .single();
    setSite(data);
  }

  const tabs = [
    { id: 'overview', label: '📊 總覽', href: `/dashboard/sites/${siteId}` },
    { id: 'products', label: '📦 產品', href: `/dashboard/sites/${siteId}/products` },
    { id: 'modules', label: '🧩 模組', href: `/dashboard/sites/${siteId}/modules` },
    { id: 'posts', label: '📝 文章', href: `/dashboard/sites/${siteId}/posts` },
    { id: 'import', label: '📥 匯入', href: `/dashboard/sites/${siteId}/import` },
    { id: 'sitemap', label: '🗺️ Sitemap', href: `/dashboard/sites/${siteId}/sitemap` },  // ← 新增這行
    { id: 'settings', label: '⚙️ 設定', href: `/dashboard/sites/${siteId}/settings` },
  ];

  const currentTab = tabs.find(t => pathname === t.href) || tabs[0];

  return (
    <div>
      {/* Site Header */}
      {site && (
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 inline-block text-sm">
            ← 返回站點列表
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
              <p className="text-gray-500 text-sm">
                🌐 <a href={`https://${site.full_domain}`} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{site.full_domain}</a>
              </p>
            </div>
            <a
              href={`https://${site.full_domain}`}
              target="_blank"
              rel="noopener"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              🔗 查看網站
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-3 font-medium text-sm border-b-2 -mb-px transition ${
                pathname === tab.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
