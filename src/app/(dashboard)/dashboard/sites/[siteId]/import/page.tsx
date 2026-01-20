'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ImportType = 'products' | 'testimonials' | 'faq' | 'comparison' | 'method' | 'painPoints';

const IMPORT_TYPES: { id: ImportType; icon: string; label: string; description: string }[] = [
  { id: 'products', icon: '📦', label: 'TOP 10 產品', description: '批量匯入產品資料' },
  { id: 'method', icon: '🔬', label: '方法/特色', description: '匯入評測方法或特色' },
  { id: 'painPoints', icon: '😫', label: '痛點區', description: '匯入讀者痛點' },
  { id: 'comparison', icon: '📊', label: '比較表', description: '匯入快速比較資料' },
  { id: 'testimonials', icon: '💬', label: '客戶評價', description: '匯入用戶評價' },
  { id: 'faq', icon: '❓', label: 'FAQ 問答', description: '匯入常見問題' },
];

const CSV_TEMPLATES: Record<ImportType, { headers: string[]; example: string[][] }> = {
  products: {
    headers: ['rank', 'name', 'slug', 'badge', 'tagline', 'originalPrice', 'currentPrice', 'rating', 'imageUrl', 'briefReview', 'affiliateLink', 'ctaText'],
    example: [
      ['1', 'WinkBed', 'winkbed', 'Most Comfortable', 'Luxury hybrid mattress', '1799', '1299', '9.4', 'https://example.com/img.jpg', 'Great mattress for back sleepers...', 'https://affiliate.link/winkbed', 'Shop Now →'],
    ],
  },
  method: {
    headers: ['icon', 'title', 'description'],
    example: [
      ['🔬', '專業測試', '由專業團隊進行嚴格測試'],
      ['📊', '數據分析', '收集真實用戶回饋數據'],
    ],
  },
  painPoints: {
    headers: ['icon', 'text'],
    example: [
      ['😫', '試過很多方法都沒效果'],
      ['😰', '花了很多錢卻買到不適合的產品'],
    ],
  },
  testimonials: {
    headers: ['name', 'title', 'content'],
    example: [['王小明', '上班族', '用了之後效率提升很多！']],
  },
  faq: {
    headers: ['question', 'answer'],
    example: [['這個產品適合新手嗎？', '非常適合！我們有完整的新手教學']],
  },
  comparison: {
    headers: ['icon', 'type', 'recommendation', 'reason'],
    example: [['👶', '新手入門', 'A 產品', '操作簡單易上手']],
  },
};

export default function ImportPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [mode, setMode] = useState<'csv' | 'ai' | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [site, setSite] = useState<any>(null);

  useEffect(() => {
    loadSite();
  }, [siteId]);

  async function loadSite() {
    const { data } = await supabase.from('sites').select('*').eq('id', siteId).single();
    setSite(data);
  }

  function downloadTemplate(type: ImportType) {
    const { headers, example } = CSV_TEMPLATES[type];
    const csvContent = [headers.join(','), ...example.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const data = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || '';
        });
        return obj;
      });

      setCsvData(data);
    };
    reader.readAsText(file);
  }

  async function generateWithAI() {
    if (!selectedType || !aiPrompt) return;

    const aiSettings = site?.config?.ai;
    if (!aiSettings?.openaiKey) {
      showMsg('error', '請先到「網站設定」→「AI 設定」填入 OpenAI API Key');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const prompts: Record<ImportType, string> = {
        products: `Generate ${aiCount} product reviews for "${aiPrompt}" category. For each product include: rank (1-${aiCount}), name, slug (url-friendly), badge (like "Best Value", "Most Comfortable"), tagline, originalPrice, currentPrice (in USD), rating (1-10), imageUrl (use https://picsum.photos/400/300?random=N), briefReview (2-3 sentences), affiliateLink (use placeholder), ctaText. Return as JSON array only, no explanation.`,
        method: `Generate ${aiCount} testing methods or features for "${aiPrompt}" review website. For each include: icon (single emoji), title (short feature name), description (1-2 sentences explaining the method). Return as JSON array only.`,
        painPoints: `Generate ${aiCount} customer pain points for people looking for "${aiPrompt}". For each include: icon (single emoji expressing frustration), text (the pain point in first person). Return as JSON array only.`,
        testimonials: `Generate ${aiCount} realistic customer testimonials for "${aiPrompt}" products. For each include: name (Chinese name), title (job title), content (1-2 sentences review). Return as JSON array only.`,
        faq: `Generate ${aiCount} frequently asked questions about "${aiPrompt}". For each include: question, answer (detailed but concise). Return as JSON array only.`,
        comparison: `Generate ${aiCount} comparison rows for "${aiPrompt}" products. For each include: icon (emoji for user type), type (customer type like "新手入門"), recommendation (product name), reason (key benefit). Return as JSON array only.`,
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.openaiKey}`,
        },
        body: JSON.stringify({
          model: aiSettings.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates content for affiliate marketing websites. Always return valid JSON arrays only, no markdown or explanation.' },
            { role: 'user', content: prompts[selectedType] },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setCsvData(parsed);
        showMsg('success', `已生成 ${parsed.length} 筆資料！`);
      } else {
        throw new Error('無法解析 AI 回應');
      }
    } catch (err: any) {
      showMsg('error', err.message || 'AI 生成失敗');
    } finally {
      setLoading(false);
    }
  }

  async function importData() {
    if (!selectedType || csvData.length === 0) return;

    setLoading(true);

    try {
      if (selectedType === 'products') {
        const products = csvData.map((row, index) => ({
          site_id: siteId,
          rank: parseInt(row.rank) || index + 1,
          slug: row.slug || row.name?.toLowerCase().replace(/\s+/g, '-'),
          badge: row.badge || '',
          name: row.name,
          tagline: row.tagline || '',
          price: {
            original: parseFloat(row.originalPrice) || 0,
            current: parseFloat(row.currentPrice) || 0,
            currency: 'USD',
          },
          rating: parseFloat(row.rating) || 8.0,
          images: { main: row.imageUrl || '', gallery: [] },
          brief_review: row.briefReview || '',
          affiliate_link: row.affiliateLink || '',
          cta_text: row.ctaText || 'Shop Now →',
          is_active: true,
        }));

        const { error } = await supabase.from('products').insert(products);
        if (error) throw error;
      } else if (selectedType === 'method') {
        const { data: module } = await supabase
          .from('modules')
          .select('content')
          .eq('id', 'method')
          .eq('site_id', siteId)
          .single();

        const existingFeatures = module?.content?.features || [];
        const newFeatures = [...existingFeatures, ...csvData];

        await supabase
          .from('modules')
          .update({ content: { ...module?.content, features: newFeatures } })
          .eq('id', 'method')
          .eq('site_id', siteId);
      } else if (selectedType === 'painPoints') {
        const { data: module } = await supabase
          .from('modules')
          .select('content')
          .eq('id', 'painPoints')
          .eq('site_id', siteId)
          .single();

        const existingPoints = module?.content?.points || [];
        const newPoints = [...existingPoints, ...csvData];

        await supabase
          .from('modules')
          .update({ content: { ...module?.content, points: newPoints } })
          .eq('id', 'painPoints')
          .eq('site_id', siteId);
      } else if (selectedType === 'testimonials') {
        const { data: module } = await supabase
          .from('modules')
          .select('content')
          .eq('id', 'testimonials')
          .eq('site_id', siteId)
          .single();

        const existingItems = module?.content?.items || [];
        const newItems = [...existingItems, ...csvData];

        await supabase
          .from('modules')
          .update({ content: { ...module?.content, items: newItems } })
          .eq('id', 'testimonials')
          .eq('site_id', siteId);
      } else if (selectedType === 'faq') {
        const { data: module } = await supabase
          .from('modules')
          .select('content')
          .eq('id', 'faq')
          .eq('site_id', siteId)
          .single();

        const existingItems = module?.content?.items || [];
        const newItems = [...existingItems, ...csvData];

        await supabase
          .from('modules')
          .update({ content: { ...module?.content, items: newItems } })
          .eq('id', 'faq')
          .eq('site_id', siteId);
      } else if (selectedType === 'comparison') {
        const { data: module } = await supabase
          .from('modules')
          .select('content')
          .eq('id', 'comparison')
          .eq('site_id', siteId)
          .single();

        const existingItems = module?.content?.items || [];
        const newItems = [...existingItems, ...csvData];

        await supabase
          .from('modules')
          .update({ content: { ...module?.content, items: newItems } })
          .eq('id', 'comparison')
          .eq('site_id', siteId);
      }

      showMsg('success', `成功匯入 ${csvData.length} 筆資料！`);
      setCsvData([]);
      setSelectedType(null);
      setMode(null);
    } catch (err: any) {
      showMsg('error', err.message || '匯入失敗');
    } finally {
      setLoading(false);
    }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/sites/${siteId}`} className="text-blue-600 hover:underline mb-2 inline-block">
          ← 返回站點
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">📥 匯入中心</h1>
        <p className="text-gray-600 mt-1">批量匯入資料 - 支援 CSV 上傳或 AI 自動生成</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* 步驟 1: 選擇類型 */}
      {!selectedType && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">步驟 1：選擇要匯入的資料類型</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {IMPORT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-left"
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <div className="font-semibold text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 步驟 2: 選擇方式 */}
      {selectedType && !mode && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">步驟 2：選擇匯入方式</h2>
            <button onClick={() => setSelectedType(null)} className="text-gray-500 hover:text-gray-700">
              ← 返回
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setMode('csv')}
              className="p-8 rounded-lg border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-left"
            >
              <div className="text-4xl mb-3">📄</div>
              <div className="font-semibold text-xl text-gray-900">CSV 上傳</div>
              <div className="text-gray-500 mt-2">下載模板 → 填寫資料 → 上傳匯入</div>
            </button>
            <button
              onClick={() => setMode('ai')}
              className="p-8 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition text-left"
            >
              <div className="text-4xl mb-3">🤖</div>
              <div className="font-semibold text-xl text-gray-900">AI 自動生成</div>
              <div className="text-gray-500 mt-2">輸入產品類別 → AI 自動生成內容</div>
            </button>
          </div>
        </div>
      )}

      {/* CSV 上傳 */}
      {selectedType && mode === 'csv' && csvData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">CSV 上傳</h2>
            <button onClick={() => setMode(null)} className="text-gray-500 hover:text-gray-700">
              ← 返回
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. 下載模板</h3>
              <button
                onClick={() => downloadTemplate(selectedType)}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                📥 下載 {IMPORT_TYPES.find(t => t.id === selectedType)?.label} 模板
              </button>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. 上傳填好的 CSV</h3>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI 生成 */}
      {selectedType && mode === 'ai' && csvData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🤖 AI 自動生成</h2>
            <button onClick={() => setMode(null)} className="text-gray-500 hover:text-gray-700">
              ← 返回
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">產品/主題類別</label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="例如：床墊、保健食品、AI 工具、投資 App..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生成數量</label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(parseInt(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={5}>5 筆</option>
                <option value={10}>10 筆</option>
                <option value={15}>15 筆</option>
              </select>
            </div>
            <button
              onClick={generateWithAI}
              disabled={!aiPrompt || loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '🤖 生成中...' : '🤖 開始生成'}
            </button>
          </div>
        </div>
      )}

      {/* 預覽資料 */}
      {csvData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">預覽資料（{csvData.length} 筆）</h2>
            <button
              onClick={() => {
                setCsvData([]);
                setMode(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ 取消
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {Object.keys(csvData[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {csvData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="px-4 py-2 max-w-xs truncate">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setCsvData([])}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={importData}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '匯入中...' : `確認匯入 ${csvData.length} 筆資料`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
