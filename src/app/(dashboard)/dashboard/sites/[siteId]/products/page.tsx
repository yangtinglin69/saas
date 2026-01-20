'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  rank: number;
  name: string;
  slug: string;
  badge: string;
  tagline: string;
  price: { original: number; current: number; currency: string };
  rating: number;
  images: { main: string; gallery: string[] };
  specs: { label: string; value: string }[];
  best_for: string[];
  not_best_for: string[];
  brief_review: string;
  full_review: string;
  materials: { layer: string; description: string }[];
  scores: { label: string; score: number; description?: string }[];
  pros: string[];
  cons: string[];
  faqs: { question: string; answer: string }[];
  affiliate_link: string;
  cta_text: string;
  is_active: boolean;
}

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  rank: 1,
  name: '',
  slug: '',
  badge: '',
  tagline: '',
  price: { original: 0, current: 0, currency: 'USD' },
  rating: 8.0,
  images: { main: '', gallery: [] },
  specs: [],
  best_for: [],
  not_best_for: [],
  brief_review: '',
  full_review: '',
  materials: [],
  scores: [],
  pros: [],
  cons: [],
  faqs: [],
  affiliate_link: '',
  cta_text: 'Shop Now →',
  is_active: true,
};

export default function ProductsPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProducts();
  }, [siteId]);

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('site_id', siteId)
      .order('rank', { ascending: true });

    setProducts(data || []);
    setLoading(false);
  }

  function openNewProduct() {
    const maxRank = products.length > 0 ? Math.max(...products.map(p => p.rank)) : 0;
    setEditingProduct({ ...EMPTY_PRODUCT, id: '', rank: maxRank + 1 } as Product);
    setIsNew(true);
    setActiveTab('basic');
  }

  function openEditProduct(product: Product) {
    setEditingProduct({ ...product });
    setIsNew(false);
    setActiveTab('basic');
  }

  async function saveProduct() {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const productData = {
        site_id: siteId,
        rank: editingProduct.rank,
        slug: editingProduct.slug || editingProduct.name.toLowerCase().replace(/\s+/g, '-'),
        badge: editingProduct.badge,
        name: editingProduct.name,
        tagline: editingProduct.tagline,
        price: editingProduct.price,
        rating: editingProduct.rating,
        images: editingProduct.images,
        specs: editingProduct.specs,
        best_for: editingProduct.best_for,
        not_best_for: editingProduct.not_best_for,
        brief_review: editingProduct.brief_review,
        full_review: editingProduct.full_review,
        materials: editingProduct.materials,
        scores: editingProduct.scores,
        pros: editingProduct.pros,
        cons: editingProduct.cons,
        faqs: editingProduct.faqs,
        affiliate_link: editingProduct.affiliate_link,
        cta_text: editingProduct.cta_text,
        is_active: editingProduct.is_active,
      };

      if (isNew) {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        showMsg('success', '✅ 產品已創建');
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        showMsg('success', '✅ 產品已更新');
      }

      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      showMsg('error', err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;

    await supabase.from('products').delete().eq('id', id);
    showMsg('success', '✅ 產品已刪除');
    loadProducts();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase.from('products').update({ is_active: !isActive }).eq('id', id);
    loadProducts();
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function updateProduct(field: string, value: any) {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [field]: value });
  }

  const tabs = [
    { id: 'basic', label: '📝 基本資訊' },
    { id: 'price', label: '💰 價格評分' },
    { id: 'images', label: '🖼️ 圖片' },
    { id: 'specs', label: '📋 規格' },
    { id: 'review', label: '✍️ 評測' },
    { id: 'materials', label: '🔧 材質' },
    { id: 'scores', label: '⭐ 評分' },
    { id: 'proscons', label: '👍 優缺點' },
    { id: 'faqs', label: '❓ FAQ' },
    { id: 'affiliate', label: '🔗 聯盟' },
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/dashboard/sites/${siteId}`} className="text-blue-600 hover:underline mb-2 inline-block">
            ← 返回站點
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">📦 產品管理</h1>
        </div>
        <button
          onClick={openNewProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ➕ 新增產品
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* 產品列表 */}
      {!editingProduct && (
        <div className="bg-white rounded-xl shadow-sm border">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">還沒有產品</p>
              <button
                onClick={openNewProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ 新增第一個產品
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">排名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">產品</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">價格</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">評分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">狀態</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-2xl font-bold text-gray-300">#{product.rank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.main ? (
                          <img src={product.images.main} alt="" className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">📦</div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.badge}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${product.price?.current}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-500">⭐</span> {product.rating}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {product.is_active ? '✅ 啟用' : '⏸️ 停用'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 編輯表單 */}
      {editingProduct && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isNew ? '新增產品' : `編輯：${editingProduct.name}`}</h2>
            <button
              onClick={() => setEditingProduct(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ 關閉
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b px-6 flex gap-1 overflow-x-auto">
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">產品名稱 *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => updateProduct('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="WinkBed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug（網址）</label>
                    <input
                      type="text"
                      value={editingProduct.slug}
                      onChange={(e) => updateProduct('slug', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="winkbed"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">排名</label>
                    <input
                      type="number"
                      value={editingProduct.rank}
                      onChange={(e) => updateProduct('rank', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標籤</label>
                    <input
                      type="text"
                      value={editingProduct.badge}
                      onChange={(e) => updateProduct('badge', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="🏆 最舒適"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">標語</label>
                  <input
                    type="text"
                    value={editingProduct.tagline}
                    onChange={(e) => updateProduct('tagline', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="高端混合床墊，支撐與舒適兼具"
                  />
                </div>
              </div>
            )}

            {/* 價格評分 */}
            {activeTab === 'price' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">原價</label>
                    <input
                      type="number"
                      value={editingProduct.price?.original || 0}
                      onChange={(e) => updateProduct('price', { ...editingProduct.price, original: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">現價</label>
                    <input
                      type="number"
                      value={editingProduct.price?.current || 0}
                      onChange={(e) => updateProduct('price', { ...editingProduct.price, current: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">幣別</label>
                    <select
                      value={editingProduct.price?.currency || 'USD'}
                      onChange={(e) => updateProduct('price', { ...editingProduct.price, currency: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="TWD">TWD</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">評分（1-10）</label>
                  <input
                    type="number"
                    value={editingProduct.rating}
                    onChange={(e) => updateProduct('rating', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>
            )}

            {/* 圖片 */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主圖網址</label>
                  <input
                    type="text"
                    value={editingProduct.images?.main || ''}
                    onChange={(e) => updateProduct('images', { ...editingProduct.images, main: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
                {editingProduct.images?.main && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">預覽：</p>
                    <img src={editingProduct.images.main} alt="Preview" className="w-48 h-36 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
            )}

            {/* 評測 */}
            {activeTab === 'review' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">簡短評測</label>
                  <textarea
                    value={editingProduct.brief_review}
                    onChange={(e) => updateProduct('brief_review', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="2-3 句話的簡短評測..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">完整評測</label>
                  <textarea
                    value={editingProduct.full_review}
                    onChange={(e) => updateProduct('full_review', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="詳細的產品評測..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">適合族群（每行一個）</label>
                  <textarea
                    value={(editingProduct.best_for || []).join('\n')}
                    onChange={(e) => updateProduct('best_for', e.target.value.split('\n').filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="背痛患者&#10;側睡者&#10;喜歡硬床的人"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">不適合族群（每行一個）</label>
                  <textarea
                    value={(editingProduct.not_best_for || []).join('\n')}
                    onChange={(e) => updateProduct('not_best_for', e.target.value.split('\n').filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="預算有限的人&#10;喜歡極軟床的人"
                  />
                </div>
              </div>
            )}

            {/* 優缺點 */}
            {activeTab === 'proscons' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">優點（每行一個）</label>
                  <textarea
                    value={(editingProduct.pros || []).join('\n')}
                    onChange={(e) => updateProduct('pros', e.target.value.split('\n').filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="優秀的支撐力&#10;透氣涼爽&#10;120 天試睡"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">缺點（每行一個）</label>
                  <textarea
                    value={(editingProduct.cons || []).join('\n')}
                    onChange={(e) => updateProduct('cons', e.target.value.split('\n').filter(Boolean))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="價格較高&#10;重量較重"
                  />
                </div>
              </div>
            )}

            {/* 聯盟 */}
            {activeTab === 'affiliate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">聯盟連結</label>
                  <input
                    type="text"
                    value={editingProduct.affiliate_link}
                    onChange={(e) => updateProduct('affiliate_link', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA 按鈕文字</label>
                  <input
                    type="text"
                    value={editingProduct.cta_text}
                    onChange={(e) => updateProduct('cta_text', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Shop Now →"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingProduct.is_active}
                    onChange={(e) => updateProduct('is_active', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">啟用此產品</label>
                </div>
              </div>
            )}

            {/* 其他 tabs 簡化處理 */}
            {activeTab === 'specs' && (
              <div className="text-gray-500 text-center py-8">
                規格編輯器（開發中）- 可用 JSON 格式編輯
                <textarea
                  value={JSON.stringify(editingProduct.specs || [], null, 2)}
                  onChange={(e) => {
                    try { updateProduct('specs', JSON.parse(e.target.value)); } catch {}
                  }}
                  className="w-full mt-4 px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={10}
                />
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="text-gray-500 text-center py-8">
                材質編輯器（開發中）- 可用 JSON 格式編輯
                <textarea
                  value={JSON.stringify(editingProduct.materials || [], null, 2)}
                  onChange={(e) => {
                    try { updateProduct('materials', JSON.parse(e.target.value)); } catch {}
                  }}
                  className="w-full mt-4 px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={10}
                />
              </div>
            )}

            {activeTab === 'scores' && (
              <div className="text-gray-500 text-center py-8">
                評分編輯器（開發中）- 可用 JSON 格式編輯
                <textarea
                  value={JSON.stringify(editingProduct.scores || [], null, 2)}
                  onChange={(e) => {
                    try { updateProduct('scores', JSON.parse(e.target.value)); } catch {}
                  }}
                  className="w-full mt-4 px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={10}
                />
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="text-gray-500 text-center py-8">
                FAQ 編輯器（開發中）- 可用 JSON 格式編輯
                <textarea
                  value={JSON.stringify(editingProduct.faqs || [], null, 2)}
                  onChange={(e) => {
                    try { updateProduct('faqs', JSON.parse(e.target.value)); } catch {}
                  }}
                  className="w-full mt-4 px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={10}
                />
              </div>
            )}
          </div>

          {/* 儲存按鈕 */}
          <div className="border-t px-6 py-4 flex justify-end gap-4">
            <button
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={saveProduct}
              disabled={saving || !editingProduct.name}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '儲存中...' : '💾 儲存'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
