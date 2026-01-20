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
  category: string;
  tags: string[];
  excerpt: string;
  content: string;
  featured_image: string;
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
  
  // 文章編輯
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [siteId]);

  async function loadData() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

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

  function openNewPost() {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      author: '',
      category: '',
      tags: [],
      featured_image: '',
      status: 'draft'
    });
    setShowPostModal(true);
  }

  function openEditPost(post: Post) {
    setEditingPost(post);
    setShowPostModal(true);
  }

  async function savePost() {
    if (!editingPost?.title || !editingPost?.slug) {
      alert('請填寫標題和網址代稱');
      return;
    }

    setSaving(true);

    try {
      if (editingPost.id) {
        // 更新
        const { error } = await supabase
          .from('posts')
          .update({
            title: editingPost.title,
            slug: editingPost.slug,
            excerpt: editingPost.excerpt,
            content: editingPost.content,
            author: editingPost.author,
            category: editingPost.category,
            tags: editingPost.tags,
            featured_image: editingPost.featured_image,
            status: editingPost.status,
            published_at: editingPost.status === 'published' ? new Date().toISOString() : null
          })
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        // 新增
        const { error } = await supabase
          .from('posts')
          .insert({
            site_id: siteId,
            title: editingPost.title,
            slug: editingPost.slug,
            excerpt: editingPost.excerpt,
            content: editingPost.content,
            author: editingPost.author,
            category: editingPost.category,
            tags: editingPost.tags,
            featured_image: editingPost.featured_image,
            status: editingPost.status,
            published_at: editingPost.status === 'published' ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      setShowPostModal(false);
      setEditingPost(null);
      loadData();
    } catch (err: any) {
      alert('儲存失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
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
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">📄 文章列表</h2>
            <span className="text-sm text-gray-500">共 {posts.length} 篇文章</span>
          </div>
          <button
            onClick={openNewPost}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            + 手動新增文章
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>尚未有任何文章</p>
            <p className="text-sm mt-1">使用 API 從 n8n 推送文章，或點擊上方按鈕手動新增</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    {post.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        {post.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {post.status === 'published' ? '已發布' : '草稿'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    /blog/{post.slug} • {post.author || '未知作者'} • {new Date(post.created_at).toLocaleDateString()}
                    {post.tags && post.tags.length > 0 && (
                      <span className="ml-2">
                        {post.tags.map((tag, i) => (
                          <span key={i} className="text-gray-400">#{tag} </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePostStatus(post)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {post.status === 'published' ? '改為草稿' : '發布'}
                  </button>
                  <button
                    onClick={() => openEditPost(post)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                  >
                    編輯
                  </button>
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

      {/* 文章編輯 Modal */}
      {showPostModal && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingPost.id ? '編輯文章' : '新增文章'}
              </h2>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setEditingPost(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文章標題 *</label>
                <input
                  type="text"
                  value={editingPost.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditingPost({
                      ...editingPost,
                      title,
                      slug: editingPost.slug || generateSlug(title)
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="輸入文章標題"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">網址代稱 (Slug) *</label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">/blog/</span>
                  <input
                    type="text"
                    value={editingPost.slug || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="my-article-slug"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                  <input
                    type="text"
                    value={editingPost.author || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="作者名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                  <select
                    value={editingPost.status || 'draft'}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發布</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <input
                    type="text"
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="例如：床墊評比、選購指南"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">標籤（逗號分隔）</label>
                  <input
                    type="text"
                    value={(editingPost.tags || []).join(', ')}
                    onChange={(e) => setEditingPost({ 
                      ...editingPost, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="床墊, 睡眠, 推薦"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">特色圖片網址</label>
                <input
                  type="text"
                  value={editingPost.featured_image || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, featured_image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                <textarea
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="文章摘要（會顯示在列表頁）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文章內容（支援 HTML）</label>
                <textarea
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  rows={12}
                  placeholder="<h2>標題</h2>&#10;<p>文章內容...</p>"
                />
                <p className="text-xs text-gray-500 mt-1">支援 HTML 格式，可直接貼上從 n8n 產生的 HTML 內容</p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setEditingPost(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={savePost}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存文章'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
