'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  async function loadSite() {
    const { data } = await supabase.from('sites').select('*').eq('id', siteId).single();
    if (data) {
      setSite(data);
      setConfig(data.config || {});
    }
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await supabase
        .from('sites')
        .update({ config, name: config.name || site.name })
        .eq('id', siteId);
      showMsg('success', '✅ 設定已儲存！');
      loadSite();
    } catch (err) {
      showMsg('error', '❌ 儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function updateConfig(path: string, value: any) {
    const keys = path.split('.');
    const newConfig = { ...config };
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  }

  const tabs = [
    { id: 'basic', label: '📝 基本資訊' },
    { id: 'seo', label: '🔍 SEO' },
    { id: 'tracking', label: '📊 追蹤碼' },
    { id: 'colors', label: '🎨 顏色' },
    { id: 'typography', label: '✏️ 文字' },
    { id: 'ai', label: '🤖 AI 設定' },
    { id: 'footer', label: '📄 頁尾' },
    { id: 'adsense', label: '💰 AdSense' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/sites/${siteId}`} className="text-blue-600 hover:underline mb-2 inline-block">
          ← 返回站點
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ 網站設定</h1>
            <p className="text-gray-600 mt-1">設定網站外觀、SEO、追蹤碼等</p>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '💾 儲存設定'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Tabs */}
        <div className="border-b px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* 基本資訊 */}
          {activeTab === 'basic' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">網站名稱</label>
                <input
                  type="text"
                  value={config.name || ''}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">網站標語</label>
                <input
                  type="text"
                  value={config.tagline || ''}
                  onChange={(e) => updateConfig('tagline', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo 網址</label>
                <input
                  type="text"
                  value={config.logo || ''}
                  onChange={(e) => updateConfig('logo', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Favicon 網址</label>
                <input
                  type="text"
                  value={config.favicon || ''}
                  onChange={(e) => updateConfig('favicon', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  頁面標題 <span className="text-gray-400">({(config.seo?.title || '').length}/60)</span>
                </label>
                <input
                  type="text"
                  value={config.seo?.title || ''}
                  onChange={(e) => updateConfig('seo.title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta 描述 <span className="text-gray-400">({(config.seo?.description || '').length}/160)</span>
                </label>
                <textarea
                  value={config.seo?.description || ''}
                  onChange={(e) => updateConfig('seo.description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={160}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">關鍵字（逗號分隔）</label>
                <input
                  type="text"
                  value={(config.seo?.keywords || []).join(', ')}
                  onChange={(e) => updateConfig('seo.keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="床墊, 評比, 推薦"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OG Image 網址</label>
                <input
                  type="text"
                  value={config.seo?.ogImage || ''}
                  onChange={(e) => updateConfig('seo.ogImage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* 追蹤碼 */}
          {activeTab === 'tracking' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics 4 ID</label>
                <input
                  type="text"
                  value={config.tracking?.gaId || ''}
                  onChange={(e) => updateConfig('tracking.gaId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Tag Manager ID</label>
                <input
                  type="text"
                  value={config.tracking?.gtmId || ''}
                  onChange={(e) => updateConfig('tracking.gtmId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                <input
                  type="text"
                  value={config.tracking?.fbPixelId || ''}
                  onChange={(e) => updateConfig('tracking.fbPixelId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自訂 Head 程式碼</label>
                <textarea
                  value={config.tracking?.customHead || ''}
                  onChange={(e) => updateConfig('tracking.customHead', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={4}
                  placeholder="<script>...</script>"
                />
              </div>
            </div>
          )}

          {/* 顏色 */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">品牌色彩</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'primary', label: '主色' },
                    { key: 'secondary', label: '副色' },
                    { key: 'accent', label: '強調色' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1">{label}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.colors?.[key] || '#1e3a5f'}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="w-12 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.colors?.[key] || ''}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">頁首/頁尾</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'headerBg', label: '頁首背景' },
                    { key: 'headerText', label: '頁首文字' },
                    { key: 'footerBg', label: '頁尾背景' },
                    { key: 'footerText', label: '頁尾文字' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1">{label}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.colors?.[key] || '#1e3a5f'}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="w-12 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.colors?.[key] || ''}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">CTA 按鈕</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'buttonBg', label: '按鈕背景' },
                    { key: 'buttonText', label: '按鈕文字' },
                    { key: 'buttonHover', label: 'Hover 色' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1">{label}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.colors?.[key] || '#22c55e'}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="w-12 h-10 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.colors?.[key] || ''}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 文字 */}
          {activeTab === 'typography' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">標題字重</label>
                  <select
                    value={config.typography?.headingWeight || '700'}
                    onChange={(e) => updateConfig('typography.headingWeight', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">內文字重</label>
                  <select
                    value={config.typography?.bodyWeight || '400'}
                    onChange={(e) => updateConfig('typography.bodyWeight', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi Bold (600)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.typography?.headingItalic || false}
                    onChange={(e) => updateConfig('typography.headingItalic', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">標題斜體</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.typography?.bodyItalic || false}
                    onChange={(e) => updateConfig('typography.bodyItalic', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">內文斜體</span>
                </label>
              </div>
            </div>
          )}

          {/* AI 設定 */}
          {activeTab === 'ai' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.ai?.openaiKey || ''}
                    onChange={(e) => updateConfig('ai.openaiKey', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="sk-..."
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    {showApiKey ? '🙈 隱藏' : '👁️ 顯示'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">用於 AI 生成產品資料，從 platform.openai.com 取得</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
                <select
                  value={config.ai?.model || 'gpt-4o-mini'}
                  onChange={(e) => updateConfig('ai.model', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="gpt-4o-mini">GPT-4o-mini（推薦，便宜快速）</option>
                  <option value="gpt-4o">GPT-4o（較貴但更好）</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生成語言</label>
                <select
                  value={config.ai?.language || 'en'}
                  onChange={(e) => updateConfig('ai.language', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          )}

          {/* 頁尾 */}
          {activeTab === 'footer' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">免責聲明</label>
                <textarea
                  value={config.footer?.disclaimer || ''}
                  onChange={(e) => updateConfig('footer.disclaimer', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Affiliate disclosure: We may earn commissions from qualifying purchases..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版權宣告</label>
                <input
                  type="text"
                  value={config.footer?.copyright || ''}
                  onChange={(e) => updateConfig('footer.copyright', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="© 2025 Your Site Name"
                />
              </div>
            </div>
          )}

          {/* AdSense */}
          {activeTab === 'adsense' && (
            <div className="space-y-4 max-w-2xl">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.adsense?.enabled || false}
                  onChange={(e) => updateConfig('adsense.enabled', e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-700">啟用 Google AdSense</span>
              </label>
              {config.adsense?.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher ID</label>
                    <input
                      type="text"
                      value={config.adsense?.publisherId || ''}
                      onChange={(e) => updateConfig('adsense.publisherId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                    💡 廣告版位 ID 設定功能開發中...
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
