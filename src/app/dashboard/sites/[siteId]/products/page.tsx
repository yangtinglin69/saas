// src/app/dashboard/sites/[siteId]/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Product {
  id: string;
  site_id: string;
  rank: number;
  slug: string;
  badge: string;
  name: string;
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

const emptyProduct: Omit<Product, 'id' | 'site_id'> = {
  rank: 1, slug: '', badge: '', name: '', tagline: '',
  price: { original: 0, current: 0, currency: 'USD' },
  rating: 0, images: { main: '', gallery: [] },
  specs: [], best_for: [], not_best_for: [],
  brief_review: '', full_review: '',
  materials: [], scores: [], pros: [], cons: [], faqs: [],
  affiliate_link: '', cta_text: 'Shop Now →', is_active: true,
};

export default function ProductsPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const supabase = createClientComponentClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs = [
    { id: 'basic', label: '📝 基本資訊' },
    { id: 'price', label: '💰 價格評分' },
    { id: 'images', label: '🖼️ 圖片' },
    { id: 'specs', label: '📋 規格' },
    { id: 'review', label: '✍️ 評測' },
    { id: 'materials', label: '🔧 材質' },
    { id: 'scores', label: '⭐ 評分' },
    { id: 'proscons', label: '👍 優缺點' },
    { id: 'faq', label: '❓ FAQ' },
    { id: 'affiliate', label: '🔗 聯盟' },
  ];

  useEffect(() => { fetchProducts(); }, [siteId]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('site_id', siteId)
      .order('rank', { ascending: true });
    if (!error && data) setProducts(data);
    setLoading(false);
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveProduct() {
    if (!editingProduct) return;
    setSaving(true);
    try {
      if (editingProduct.id) {
        const { error } = await supabase.from('products').update({ ...editingProduct, updated_at: new Date().toISOString() }).eq('id', editingProduct.id);
        if (error) throw error;
        showMessage('success', '產品已更新！');
      } else {
        const { error } = await supabase.from('products').insert({ ...editingProduct, site_id: siteId });
        if (error) throw error;
        showMessage('success', '產品已新增！');
      }
      fetchProducts();
      setEditingProduct(null);
    } catch (error: any) {
      showMessage('error', error.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('確定要刪除此產品？')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { showMessage('success', '產品已刪除'); fetchProducts(); }
    else showMessage('error', '刪除失敗');
  }

  function createNewProduct() {
    setEditingProduct({ ...emptyProduct, id: '', site_id: siteId } as Product);
    setActiveTab('basic');
  }

  // ========== 表單元件 ==========
  function StringArrayEditor({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (arr: string[]) => void; placeholder?: string }) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item} onChange={(e) => { const newArr = [...arr]; newArr[i] = e.target.value; onChange(newArr); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder={placeholder} />
            <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, ''])} className="text-sm text-blue-600 hover:text-blue-800">+ 新增項目</button>
      </div>
    );
  }

  function SpecsEditor({ value, onChange }: { value: { label: string; value: string }[]; onChange: (arr: { label: string; value: string }[]) => void }) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">規格列表</label>
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input type="text" value={item.label} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], label: e.target.value }; onChange(newArr); }} className="px-3 py-2 border rounded-lg text-sm" placeholder="標籤 (如: Type)" />
              <input type="text" value={item.value} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], value: e.target.value }; onChange(newArr); }} className="px-3 py-2 border rounded-lg text-sm" placeholder="數值 (如: Innerspring Hybrid)" />
            </div>
            <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, { label: '', value: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600">+ 新增規格</button>
      </div>
    );
  }

  function MaterialsEditor({ value, onChange }: { value: { layer: string; description: string }[]; onChange: (arr: { layer: string; description: string }[]) => void }) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">材質層級</label>
        {arr.map((item, i) => (
          <div key={i} className="flex gap-2 items-start bg-blue-50 p-3 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">{i + 1}</div>
            <div className="flex-1 space-y-2">
              <input type="text" value={item.layer} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], layer: e.target.value }; onChange(newArr); }} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="層級名稱 (如: Euro-Top)" />
              <textarea value={item.description} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], description: e.target.value }; onChange(newArr); }} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="描述 (如: Gel-infused foam for cooling)" />
            </div>
            <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, { layer: '', description: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600">+ 新增材質層</button>
      </div>
    );
  }

  function ScoresEditor({ value, onChange }: { value: { label: string; score: number; description?: string }[]; onChange: (arr: { label: string; score: number; description?: string }[]) => void }) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">詳細評分</label>
        {arr.map((item, i) => (
          <div key={i} className="bg-yellow-50 p-3 rounded-lg space-y-2">
            <div className="flex gap-2 items-center">
              <input type="text" value={item.label} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], label: e.target.value }; onChange(newArr); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="評分項目 (如: Comfort)" />
              <input type="number" value={item.score} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], score: parseFloat(e.target.value) || 0 }; onChange(newArr); }} className="w-20 px-3 py-2 border rounded-lg text-sm text-center" min="0" max="10" step="0.1" />
              <span className="text-gray-500">/10</span>
              <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg">✕</button>
            </div>
            <input type="text" value={item.description || ''} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], description: e.target.value }; onChange(newArr); }} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="說明 (選填)" />
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(item.score / 10) * 100}%` }} /></div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, { label: '', score: 8, description: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-yellow-400 hover:text-yellow-600">+ 新增評分項目</button>
      </div>
    );
  }

  function FAQEditor({ value, onChange }: { value: { question: string; answer: string }[]; onChange: (arr: { question: string; answer: string }[]) => void }) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">常見問題</label>
        {arr.map((item, i) => (
          <div key={i} className="bg-purple-50 p-3 rounded-lg">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">Q{i + 1}:</span>
                  <input type="text" value={item.question} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], question: e.target.value }; onChange(newArr); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="問題" />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold mt-2">A:</span>
                  <textarea value={item.answer} onChange={(e) => { const newArr = [...arr]; newArr[i] = { ...newArr[i], answer: e.target.value }; onChange(newArr); }} className="flex-1 px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="答案" />
                </div>
              </div>
              <button type="button" onClick={() => onChange(arr.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg">✕</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, { question: '', answer: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600">+ 新增 FAQ</button>
      </div>
    );
  }

  // ========== 渲染 ==========
  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-500">載入中...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📦 產品管理</h1>
        <button onClick={createNewProduct} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ 新增產品</button>
      </div>

      {message && <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">排名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">產品</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">評分</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">價格</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">狀態</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className="font-bold text-gray-400">#{product.rank}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images?.main ? <img src={product.images.main} alt={product.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">📦</div>}
                    <div><div className="font-medium text-gray-900">{product.name}</div><div className="text-sm text-gray-500">{product.badge}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-yellow-500">⭐</span> {product.rating}/10</td>
                <td className="px-4 py-3">${product.price?.current}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{product.is_active ? '啟用' : '停用'}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditingProduct(product); setActiveTab('basic'); }} className="text-blue-600 hover:text-blue-800 mr-3">編輯</button>
                  <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800">刪除</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">尚無產品，點擊「新增產品」開始</td></tr>}
          </tbody>
        </table>
      </div>

      {/* 編輯 Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">{editingProduct.id ? `編輯：${editingProduct.name}` : '新增產品'}</h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="border-b px-4 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab.label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">產品名稱 *</label><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="WinkBed" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label><input type="text" value={editingProduct.slug} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="w-full px-3 py-2 border rounded-lg" placeholder="winkbed" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">排名</label><input type="number" value={editingProduct.rank} onChange={(e) => setEditingProduct({ ...editingProduct, rank: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg" min="1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">標籤 Badge</label><input type="text" value={editingProduct.badge} onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Most Comfortable" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label><input type="text" value={editingProduct.tagline} onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="High-end hybrid bed..." /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={editingProduct.is_active} onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })} className="rounded" /><label htmlFor="is_active" className="text-sm text-gray-700">啟用此產品</label></div>
                </div>
              )}

              {activeTab === 'price' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">原價</label><input type="number" value={editingProduct.price?.original || 0} onChange={(e) => setEditingProduct({ ...editingProduct, price: { ...editingProduct.price, original: parseFloat(e.target.value) || 0 } })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">現價 *</label><input type="number" value={editingProduct.price?.current || 0} onChange={(e) => setEditingProduct({ ...editingProduct, price: { ...editingProduct.price, current: parseFloat(e.target.value) || 0 } })} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">貨幣</label><select value={editingProduct.price?.currency || 'USD'} onChange={(e) => setEditingProduct({ ...editingProduct, price: { ...editingProduct.price, currency: e.target.value } })} className="w-full px-3 py-2 border rounded-lg"><option value="USD">USD</option><option value="TWD">TWD</option><option value="JPY">JPY</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">總評分 (0-10)</label><div className="flex items-center gap-4"><input type="range" value={editingProduct.rating || 0} onChange={(e) => setEditingProduct({ ...editingProduct, rating: parseFloat(e.target.value) })} className="flex-1" min="0" max="10" step="0.1" /><span className="text-2xl font-bold text-yellow-500">⭐ {editingProduct.rating || 0}</span></div></div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">主圖片 URL</label><input type="text" value={editingProduct.images?.main || ''} onChange={(e) => setEditingProduct({ ...editingProduct, images: { ...editingProduct.images, main: e.target.value } })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />{editingProduct.images?.main && <img src={editingProduct.images.main} alt="Preview" className="mt-2 max-w-xs rounded-lg" />}</div>
                </div>
              )}

              {activeTab === 'specs' && <SpecsEditor value={editingProduct.specs || []} onChange={(specs) => setEditingProduct({ ...editingProduct, specs })} />}

              {activeTab === 'review' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">簡短評測</label><textarea value={editingProduct.brief_review || ''} onChange={(e) => setEditingProduct({ ...editingProduct, brief_review: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="簡短的產品評測..." /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">完整評測</label><textarea value={editingProduct.full_review || ''} onChange={(e) => setEditingProduct({ ...editingProduct, full_review: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={8} placeholder="詳細的產品評測內容..." /></div>
                  <StringArrayEditor label="適合族群 (Best For)" value={editingProduct.best_for || []} onChange={(best_for) => setEditingProduct({ ...editingProduct, best_for })} placeholder="如: Side sleepers under 230 pounds" />
                  <StringArrayEditor label="不適合族群 (Not Best For)" value={editingProduct.not_best_for || []} onChange={(not_best_for) => setEditingProduct({ ...editingProduct, not_best_for })} placeholder="如: People who need firm support" />
                </div>
              )}

              {activeTab === 'materials' && <MaterialsEditor value={editingProduct.materials || []} onChange={(materials) => setEditingProduct({ ...editingProduct, materials })} />}
              {activeTab === 'scores' && <ScoresEditor value={editingProduct.scores || []} onChange={(scores) => setEditingProduct({ ...editingProduct, scores })} />}

              {activeTab === 'proscons' && (
                <div className="space-y-6">
                  <StringArrayEditor label="✅ 優點 (Pros)" value={editingProduct.pros || []} onChange={(pros) => setEditingProduct({ ...editingProduct, pros })} placeholder="優點..." />
                  <StringArrayEditor label="❌ 缺點 (Cons)" value={editingProduct.cons || []} onChange={(cons) => setEditingProduct({ ...editingProduct, cons })} placeholder="缺點..." />
                </div>
              )}

              {activeTab === 'faq' && <FAQEditor value={editingProduct.faqs || []} onChange={(faqs) => setEditingProduct({ ...editingProduct, faqs })} />}

              {activeTab === 'affiliate' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">聯盟連結 URL</label><input type="text" value={editingProduct.affiliate_link || ''} onChange={(e) => setEditingProduct({ ...editingProduct, affiliate_link: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">CTA 按鈕文字</label><input type="text" value={editingProduct.cta_text || ''} onChange={(e) => setEditingProduct({ ...editingProduct, cta_text: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Shop Now →" /></div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">取消</button>
              <button onClick={saveProduct} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '儲存中...' : '儲存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
