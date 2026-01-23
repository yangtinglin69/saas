// src/app/(dashboard)/dashboard/sites/[siteId]/sitemap/page.tsx
// 後台 Sitemap 管理頁面 - 每 500 個 URL 分組，可收合展開

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SitemapEntry {
  url: string;
  type: 'home' | 'product' | 'post';
  title: string;
  lastModified: string;
  isActive: boolean;
  showInRanking: boolean;
}

const URLS_PER_GROUP = 500; // 每組 500 個 URL

export default function SitemapManagementPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<any>(null);
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, [siteId]);

  async function fetchData() {
    setLoading(true);

    // 取得站點資訊
    const { data: siteData } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (!siteData) {
      setLoading(false);
      return;
    }

    setSite(siteData);
    const baseUrl = `https://${siteData.full_domain}`;
    const allEntries: SitemapEntry[] = [];

    // 首頁
    allEntries.push({
      url: baseUrl,
      type: 'home',
      title: siteData.name,
      lastModified: siteData.updated_at,
      isActive: siteData.is_active,
      showInRanking: true,
    });

    // 產品頁
    const { data: products } = await supabase
      .from('products')
      .select('slug, name, updated_at, is_active, show_in_ranking')
      .eq('site_id', siteId)
      .order('rank', { ascending: true });

    products?.forEach((p) => {
      allEntries.push({
        url: `${baseUrl}/products/${p.slug}`,
        type: 'product',
        title: p.name,
        lastModified: p.updated_at,
        isActive: p.is_active,
        showInRanking: p.show_in_ranking !== false,
      });
    });

    // 文章頁（如果有）
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, title, updated_at, status')
      .eq('site_id', siteId);

    posts?.forEach((p) => {
      allEntries.push({
        url: `${baseUrl}/blog/${p.slug}`,
        type: 'post',
        title: p.title,
        lastModified: p.updated_at,
        isActive: p.status === 'published',
        showInRanking: true,
      });
    });

    setEntries(allEntries);
    setLoading(false);
  }

  // 只取啟用的 entries（會出現在 sitemap 中的）
  const activeEntries = entries.filter((e) => e.isActive);

  // 將 entries 分組，每 500 個一組
  const groupedEntries: SitemapEntry[][] = [];
  for (let i = 0; i < activeEntries.length; i += URLS_PER_GROUP) {
    groupedEntries.push(activeEntries.slice(i, i + URLS_PER_GROUP));
  }

  // 複製文字到剪貼簿
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  // 複製單一分組的所有 URL
  function copyGroupUrls(groupIndex: number) {
    const urls = groupedEntries[groupIndex].map((e) => e.url).join('\n');
    copyToClipboard(urls, `group-${groupIndex}`);
  }

  // 複製所有啟用的 URL
  function copyAllActiveUrls() {
    const activeUrls = activeEntries.map((e) => e.url).join('\n');
    copyToClipboard(activeUrls, 'all');
  }

  // 切換分組展開/收合
  function toggleGroup(groupIndex: number) {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    setExpandedGroups(newExpanded);
  }

  // 全部展開
  function expandAll() {
    const allIndexes = new Set(groupedEntries.map((_, i) => i));
    setExpandedGroups(allIndexes);
  }

  // 全部收合
  function collapseAll() {
    setExpandedGroups(new Set());
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">載入中...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-6">
        <div className="text-red-500">找不到站點</div>
      </div>
    );
  }

  const sitemapUrl = `https://${site.full_domain}/sitemap.xml`;
  const totalGroups = groupedEntries.length;
  const hiddenFromRanking = entries.filter(e => e.isActive && !e.showInRanking).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 標題 */}
      <div className="mb-6">
        <Link href={`/dashboard/sites/${siteId}`} className="text-blue-600 hover:underline text-sm">
          ← 返回站點設定
        </Link>
        <h1 className="text-2xl font-bold mt-2">🗺️ Sitemap 管理</h1>
        <p className="text-gray-600">{site.name} ({site.full_domain})</p>
      </div>

      {/* GSC 提交區塊 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
        <h2 className="font-bold text-lg mb-3 text-blue-900">🚀 提交到 Google Search Console</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sitemapUrl}
              readOnly
              className="flex-1 px-4 py-2 border rounded-lg bg-white font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(sitemapUrl, 'sitemap')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
            >
              {copied === 'sitemap' ? '✓ 已複製' : '複製'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>📌 步驟：</p>
          <ol className="list-decimal list-inside ml-2 space-y-1">
            <li>複製上方的 Sitemap URL</li>
            <li>前往 <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Search Console</a></li>
            <li>選擇你的網站資源</li>
            <li>左側選單點擊「Sitemap」</li>
            <li>貼上 URL 並點擊「提交」</li>
          </ol>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-3xl font-bold text-gray-900">{entries.length}</div>
          <div className="text-sm text-gray-500">總頁面數</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-3xl font-bold text-green-600">{activeEntries.length}</div>
          <div className="text-sm text-gray-500">Sitemap 收錄</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-3xl font-bold text-blue-600">{totalGroups}</div>
          <div className="text-sm text-gray-500">分組數</div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-3xl font-bold text-orange-500">{hiddenFromRanking}</div>
          <div className="text-sm text-gray-500">隱藏排行（但收錄）</div>
        </div>
      </div>

      {/* 操作列 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            📂 全部展開
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            📁 全部收合
          </button>
        </div>

        <button
          onClick={copyAllActiveUrls}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          {copied === 'all' ? '✓ 已複製全部' : `📋 複製全部 URL (${activeEntries.length})`}
        </button>
      </div>

      {/* 分組列表 */}
      <div className="space-y-4">
        {groupedEntries.map((group, groupIndex) => {
          const isExpanded = expandedGroups.has(groupIndex);
          const startNum = groupIndex * URLS_PER_GROUP + 1;
          const endNum = Math.min((groupIndex + 1) * URLS_PER_GROUP, activeEntries.length);

          return (
            <div key={groupIndex} className="bg-white rounded-xl border overflow-hidden">
              {/* 分組標題（可點擊收合） */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
                onClick={() => toggleGroup(groupIndex)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{isExpanded ? '📂' : '📁'}</span>
                  <div>
                    <span className="font-bold text-gray-900">
                      Site {groupIndex + 1}
                    </span>
                    <span className="text-gray-500 ml-2 text-sm">
                      ({group.length} 個 URL，第 {startNum} - {endNum} 項)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyGroupUrls(groupIndex);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    {copied === `group-${groupIndex}` ? '✓ 已複製' : '複製此組'}
                  </button>
                  <span className="text-gray-400 text-xl">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* 展開的 URL 列表 */}
              {isExpanded && (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-12">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">頁面</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-20">類型</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">排行榜</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-400">
                            {groupIndex * URLS_PER_GROUP + idx + 1}
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 text-sm">{entry.title}</div>
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline break-all"
                            >
                              {entry.url}
                            </a>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                entry.type === 'home'
                                  ? 'bg-purple-100 text-purple-700'
                                  : entry.type === 'product'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {entry.type === 'home' ? '首頁' : entry.type === 'product' ? '產品' : '文章'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {entry.type === 'product' && (
                              <span className={`text-xs ${entry.showInRanking ? 'text-green-600' : 'text-orange-500'}`}>
                                {entry.showInRanking ? '✓ 顯示' : '🙈 隱藏'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 沒有資料時 */}
      {groupedEntries.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          沒有啟用的頁面
        </div>
      )}

      {/* 說明區 */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 使用說明</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 每 {URLS_PER_GROUP} 個 URL 自動分為一組（Site 1, Site 2...）</li>
          <li>• 點擊「複製此組」可複製該組的所有 URL</li>
          <li>• 複製後貼到 GSC 的「網址檢查」批次提交</li>
          <li>• 「隱藏排行」的產品：不出現在首頁列表，但產品頁可訪問且會被 Sitemap 收錄</li>
        </ul>
      </div>
    </div>
  );
}
