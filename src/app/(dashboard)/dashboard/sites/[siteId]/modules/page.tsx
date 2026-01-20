'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Module {
  id: string;
  site_id: string;
  enabled: boolean;
  display_order: number;
  content: any;
}

const MODULE_INFO: Record<string, { icon: string; label: string; description: string }> = {
  hero: { icon: '🏠', label: '首屏 Hero', description: '標題、副標題、CTA 按鈕' },
  painPoints: { icon: '😫', label: '痛點區', description: '列出讀者的困擾與痛點' },
  story: { icon: '📖', label: '故事區', description: '品牌故事或創辦人故事' },
  method: { icon: '🔬', label: '方法/特色區', description: '評測方法或產品特色' },
  comparison: { icon: '📊', label: '快速比較表', description: '幫讀者快速找到適合的產品' },
  products: { icon: '📦', label: '產品列表', description: 'TOP 10 產品展示' },
  testimonials: { icon: '💬', label: '客戶評價', description: '真實用戶評價' },
  faq: { icon: '❓', label: 'FAQ', description: '常見問題解答' },
};

export default function ModulesPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadModules();
  }, [siteId]);

  async function loadModules() {
    const { data } = await supabase
      .from('modules')
      .select('*')
      .eq('site_id', siteId)
      .order('display_order', { ascending: true });

    setModules(data || []);
    setLoading(false);
  }

  async function toggleModule(moduleId: string, enabled: boolean) {
    await supabase
      .from('modules')
      .update({ enabled: !enabled })
      .eq('id', moduleId)
      .eq('site_id', siteId);
    loadModules();
  }

  async function saveModule() {
    if (!editingModule) return;
    setSaving(true);

    try {
      await supabase
        .from('modules')
        .update({ content: editingModule.content })
        .eq('id', editingModule.id)
        .eq('site_id', siteId);

      setEditingModule(null);
      loadModules();
    } catch (err) {
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  function updateContent(field: string, value: any) {
    if (!editingModule) return;
    setEditingModule({
      ...editingModule,
      content: { ...editingModule.content, [field]: value },
    });
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
      <div className="mb-6">
        <Link href={`/dashboard/sites/${siteId}`} className="text-blue-600 hover:underline mb-2 inline-block">
          ← 返回站點
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">🧩 模組管理</h1>
        <p className="text-gray-600 mt-1">開關、排序、編輯各個頁面區塊</p>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const info = MODULE_INFO[module.id] || { icon: '📄', label: module.id, description: '' };

          return (
            <div key={module.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{info.label}</h3>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleModule(module.id, module.enabled)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      module.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {module.enabled ? '✅ 啟用' : '⏸️ 停用'}
                  </button>
                  <button
                    onClick={() => setEditingModule({ ...module })}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    編輯內容
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {MODULE_INFO[editingModule.id]?.icon} 編輯 {MODULE_INFO[editingModule.id]?.label}
              </h2>
              <button
                onClick={() => setEditingModule(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {editingModule.id === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標籤</label>
                    <input
                      type="text"
                      value={editingModule.content?.badge || ''}
                      onChange={(e) => updateContent('badge', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="2025 年度評比"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">主標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="找到最適合你的產品"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube 影片網址</label>
                    <input
                      type="text"
                      value={editingModule.content?.youtubeUrl || ''}
                      onChange={(e) => updateContent('youtubeUrl', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://www.youtube.com/watch?v=xxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">填入後會在首屏右側顯示影片</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA 按鈕文字</label>
                    <input
                      type="text"
                      value={editingModule.content?.ctaText || ''}
                      onChange={(e) => updateContent('ctaText', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="查看評比結果"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA 連結</label>
                    <input
                      type="text"
                      value={editingModule.content?.ctaLink || ''}
                      onChange={(e) => updateContent('ctaLink', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="#products"
                    />
                  </div>
                </div>
              )}

              {editingModule.id === 'painPoints' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="你是不是也有這些困擾？"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址</label>
                    <input
                      type="text"
                      value={editingModule.content?.image || ''}
                      onChange={(e) => updateContent('image', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">痛點列表</label>
                    {(editingModule.content?.points || []).map((point: any, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={point.icon || ''}
                          onChange={(e) => {
                            const points = [...(editingModule.content?.points || [])];
                            points[index] = { ...points[index], icon: e.target.value };
                            updateContent('points', points);
                          }}
                          className="w-16 px-3 py-2 border rounded-lg text-center"
                          placeholder="😫"
                        />
                        <input
                          type="text"
                          value={point.text || ''}
                          onChange={(e) => {
                            const points = [...(editingModule.content?.points || [])];
                            points[index] = { ...points[index], text: e.target.value };
                            updateContent('points', points);
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="痛點內容..."
                        />
                        <button
                          onClick={() => {
                            const points = (editingModule.content?.points || []).filter((_: any, i: number) => i !== index);
                            updateContent('points', points);
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const points = [...(editingModule.content?.points || []), { icon: '😫', text: '' }];
                        updateContent('points', points);
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + 新增痛點
                    </button>
                  </div>
                </div>
              )}

              {editingModule.id === 'story' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="我們的故事"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址</label>
                    <input
                      type="text"
                      value={editingModule.content?.image || ''}
                      onChange={(e) => updateContent('image', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">故事段落（每行一段）</label>
                    <textarea
                      value={(editingModule.content?.paragraphs || []).join('\n')}
                      onChange={(e) => updateContent('paragraphs', e.target.value.split('\n').filter(Boolean))}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={6}
                      placeholder="我們也曾經和你一樣迷惘..."
                    />
                  </div>
                </div>
              )}

              {editingModule.id === 'method' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="我們的評測方法"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="嚴謹、公正、專業"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址</label>
                    <input
                      type="text"
                      value={editingModule.content?.image || ''}
                      onChange={(e) => updateContent('image', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">特色/方法列表</label>
                    {(editingModule.content?.features || []).map((feature: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={feature.icon || ''}
                            onChange={(e) => {
                              const features = [...(editingModule.content?.features || [])];
                              features[index] = { ...features[index], icon: e.target.value };
                              updateContent('features', features);
                            }}
                            className="w-16 px-3 py-2 border rounded-lg text-center bg-white"
                            placeholder="🔬"
                          />
                          <input
                            type="text"
                            value={feature.title || ''}
                            onChange={(e) => {
                              const features = [...(editingModule.content?.features || [])];
                              features[index] = { ...features[index], title: e.target.value };
                              updateContent('features', features);
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                            placeholder="特色標題"
                          />
                          <button
                            onClick={() => {
                              const features = (editingModule.content?.features || []).filter((_: any, i: number) => i !== index);
                              updateContent('features', features);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                        <textarea
                          value={feature.description || ''}
                          onChange={(e) => {
                            const features = [...(editingModule.content?.features || [])];
                            features[index] = { ...features[index], description: e.target.value };
                            updateContent('features', features);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          rows={2}
                          placeholder="特色說明..."
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const features = [...(editingModule.content?.features || []), { icon: '✨', title: '', description: '' }];
                        updateContent('features', features);
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + 新增特色
                    </button>
                  </div>
                </div>
              )}

              {editingModule.id === 'comparison' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="快速找到適合你的產品"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="根據你的需求選擇"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">比較項目</label>
                    <p className="text-xs text-gray-500 mb-2">設定不同類型的使用者適合哪款產品</p>
                    {(editingModule.content?.items || []).map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item.icon || ''}
                            onChange={(e) => {
                              const items = [...(editingModule.content?.items || [])];
                              items[index] = { ...items[index], icon: e.target.value };
                              updateContent('items', items);
                            }}
                            className="w-16 px-3 py-2 border rounded-lg text-center bg-white"
                            placeholder="👤"
                          />
                          <input
                            type="text"
                            value={item.type || ''}
                            onChange={(e) => {
                              const items = [...(editingModule.content?.items || [])];
                              items[index] = { ...items[index], type: e.target.value };
                              updateContent('items', items);
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                            placeholder="使用者類型（如：初學者、進階者）"
                          />
                          <button
                            onClick={() => {
                              const items = (editingModule.content?.items || []).filter((_: any, i: number) => i !== index);
                              updateContent('items', items);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.recommendation || ''}
                          onChange={(e) => {
                            const items = [...(editingModule.content?.items || [])];
                            items[index] = { ...items[index], recommendation: e.target.value };
                            updateContent('items', items);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white mb-2"
                          placeholder="推薦產品名稱"
                        />
                        <input
                          type="text"
                          value={item.reason || ''}
                          onChange={(e) => {
                            const items = [...(editingModule.content?.items || [])];
                            items[index] = { ...items[index], reason: e.target.value };
                            updateContent('items', items);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          placeholder="推薦原因"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const items = [...(editingModule.content?.items || []), { icon: '👤', type: '', recommendation: '', reason: '' }];
                        updateContent('items', items);
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + 新增比較項目
                    </button>
                  </div>
                </div>
              )}

              {editingModule.id === 'products' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="TOP 10 產品評比"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">顯示數量</label>
                    <select
                      value={editingModule.content?.showCount || 10}
                      onChange={(e) => updateContent('showCount', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value={5}>5 個</option>
                      <option value={10}>10 個</option>
                      <option value={15}>15 個</option>
                    </select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
                    產品資料請到「產品管理」頁面新增或編輯
                  </div>
                </div>
              )}

              {editingModule.id === 'testimonials' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="用戶真實評價"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">評價列表</label>
                    {(editingModule.content?.items || []).map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item.name || ''}
                            onChange={(e) => {
                              const items = [...(editingModule.content?.items || [])];
                              items[index] = { ...items[index], name: e.target.value };
                              updateContent('items', items);
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                            placeholder="評價者姓名"
                          />
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const items = [...(editingModule.content?.items || [])];
                              items[index] = { ...items[index], title: e.target.value };
                              updateContent('items', items);
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                            placeholder="身份/職稱"
                          />
                          <button
                            onClick={() => {
                              const items = (editingModule.content?.items || []).filter((_: any, i: number) => i !== index);
                              updateContent('items', items);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                        <textarea
                          value={item.content || ''}
                          onChange={(e) => {
                            const items = [...(editingModule.content?.items || [])];
                            items[index] = { ...items[index], content: e.target.value };
                            updateContent('items', items);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          rows={2}
                          placeholder="評價內容..."
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const items = [...(editingModule.content?.items || []), { name: '', title: '', content: '' }];
                        updateContent('items', items);
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + 新增評價
                    </button>
                  </div>
                </div>
              )}

              {editingModule.id === 'faq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.title || ''}
                      onChange={(e) => updateContent('title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="常見問題"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">副標題</label>
                    <input
                      type="text"
                      value={editingModule.content?.subtitle || ''}
                      onChange={(e) => updateContent('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">問答列表</label>
                    {(editingModule.content?.items || []).map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item.question || ''}
                            onChange={(e) => {
                              const items = [...(editingModule.content?.items || [])];
                              items[index] = { ...items[index], question: e.target.value };
                              updateContent('items', items);
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg bg-white"
                            placeholder="問題"
                          />
                          <button
                            onClick={() => {
                              const items = (editingModule.content?.items || []).filter((_: any, i: number) => i !== index);
                              updateContent('items', items);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                        <textarea
                          value={item.answer || ''}
                          onChange={(e) => {
                            const items = [...(editingModule.content?.items || [])];
                            items[index] = { ...items[index], answer: e.target.value };
                            updateContent('items', items);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          rows={2}
                          placeholder="回答..."
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const items = [...(editingModule.content?.items || []), { question: '', answer: '' }];
                        updateContent('items', items);
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      + 新增問答
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-4">
              <button
                onClick={() => setEditingModule(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={saveModule}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
