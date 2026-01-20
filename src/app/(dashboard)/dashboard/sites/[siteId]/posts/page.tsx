'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  author: string;
  published_at: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

export default function PostsPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    loadData();
  }, [siteId]);

  async function loadData() {
    // 載入文章
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    // 載入 API Keys
    const { data: keysData } = await supabase
      .from('api_keys')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    setPosts(postsData || []);
    setApiKeys(keysData || []);
    setLoading(false);
  }

  async function generateApiKey() {
    // 產生隨機 API Key
    const key = 'ak_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { error } = await supabase
      .from('api_keys')
      .insert({
        site_id: siteId,
        key_hash: key,
        name: newKeyName || 'Default'
      });

    if (!error) {
      setGeneratedKey(key);
      loadData();
    }
  }

  async function deleteApiKey(keyId: string) {
    if (!confirm('確定要刪除此 API Key？')) return;
    
    await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    loadData();
  }

  async function deletePost(postId: string) {
    if (!confirm('確定要刪除此文章？')) return;
    
    await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    loadData();
  }

  async function togglePostStatus(post: Post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    
    await supabase
      .from('posts')
      .update({ 
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null
      })
      .eq('id', post.id);
    
    loadData();
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
        <h1 className="text-2xl font-bold text-gray-900">📝 文章管理</h1>
        <p className="text-gray-600 mt-1">管理部落格文章和 API 金鑰</p>
      </div>

      {/* API Key 管理區塊 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🔑 API 金鑰</h2>
          <button
            onClick={() => {
              setShowApiKeyModal(true);
              setNewKeyName('');
              setGeneratedKey('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + 產生新金鑰
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-gray-500 text-sm">尚未建立任何 API 金鑰</p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{key.name}</div>
                  <div className="text-sm text-gray-500">
                    <code className="bg-gray-200 px-2 py-0.5 rounded">{key.key_hash.substring(0, 20)}...</code>
                    {key.last_used_at && (
                      <span className="ml-2">最後使用：{new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteApiKey(key.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">
            💡 <strong>如何使用：</strong>將 API 金鑰設定到你的 n8n 工作流程中，即可自動推送文章到此站點。
          </p>
          <p className="text-amber-700 text-xs mt-2">
            API 端點：<code className="bg-amber-100 px-1 rounded">POST /api/posts/publish</code>
          </p>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">📄 文章列表</h2>
          <span className="text-sm text-gray-500">共 {posts.length} 篇文章</span>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>尚未有任何文章</p>
            <p className="text-sm mt-1">使用 API 從 n8n 推送文章，或手動新增</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {post.status === 'published' ? '已發布' : '草稿'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    /{post.slug} • {post.author || '未知作者'} • {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePostStatus(post)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {post.status === 'published' ? '改為草稿' : '發布'}
                  </button>
                  <Link
                    href={`/dashboard/sites/${siteId}/posts/${post.id}`}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                  >
                    編輯
                  </Link>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">🔑 產生 API 金鑰</h2>
            
            {!generatedKey ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">名稱（備註用）</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="例如：n8n 自動發文"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 text-gray-600"
                  >
                    取消
                  </button>
                  <button
                    onClick={generateApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    產生金鑰
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">你的 API 金鑰</label>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                    {generatedKey}
                  </div>
                  <p className="text-red-600 text-sm mt-2">⚠️ 請立即複製並保存！關閉後將無法再次查看。</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedKey)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📋 複製
                  </button>
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    完成
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
