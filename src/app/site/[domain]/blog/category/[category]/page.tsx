import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { domain: string; category: string };
}

async function getCategoryData(domain: string, category: string) {
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return null;

  const decodedCategory = decodeURIComponent(category);

  // 查詢該分類的文章
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .eq('category', decodedCategory)
    .order('published_at', { ascending: false });

  // 取得所有分類
  const { data: allPosts } = await supabase
    .from('posts')
    .select('category')
    .eq('site_id', site.id)
    .eq('status', 'published');

  const categories = [...new Set((allPosts || []).map((p: any) => p.category).filter(Boolean))];

  return { site, posts: posts || [], categories, currentCategory: decodedCategory };
}

export default async function CategoryPage({ params }: Props) {
  const data = await getCategoryData(params.domain, params.category);

  if (!data) {
    notFound();
  }

  const { site, posts, categories, currentCategory } = data;
  const config = site.config || {};
  const colors = config.colors || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {config.logo && <img src={config.logo} alt="Logo" className="h-10" />}
              <span className="text-xl font-bold" style={{ color: colors.headerText || '#fff' }}>
                {config.name || site.name}
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-sm font-medium opacity-80 hover:opacity-100 transition"
                style={{ color: colors.headerText || '#fff' }}
              >
                首頁
              </Link>
              <Link 
                href="/blog" 
                className="text-sm font-medium"
                style={{ color: colors.headerText || '#fff' }}
              >
                部落格
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Category Header */}
      <section className="py-12 px-4" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm opacity-70 mb-2" style={{ color: colors.headerText || '#fff' }}>
            分類
          </p>
          <h1 className="text-4xl font-bold mb-4" style={{ color: colors.headerText || '#fff' }}>
            {currentCategory}
          </h1>
          <p className="text-lg opacity-80" style={{ color: colors.headerText || '#fff' }}>
            共 {posts.length} 篇文章
          </p>
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="py-6 px-4 border-b bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-500 text-sm">分類：</span>
            <Link 
              href="/blog"
              className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              全部
            </Link>
            {categories.map((cat: string) => (
              <Link 
                key={cat}
                href={`/blog/category/${encodeURIComponent(cat)}`}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  cat === currentCategory 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-gray-500">此分類尚無文章</p>
              <Link href="/blog" className="text-blue-600 hover:underline mt-2 inline-block">
                ← 返回全部文章
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group"
                >
                  {post.featured_image && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 mb-2">
                      {post.category}
                    </span>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.author || '編輯部'}</span>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="text-xs text-gray-400">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.footerBg || '#111827' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center" style={{ color: colors.footerText || '#9ca3af' }}>
            <p className="text-sm">{config.footer?.copyright || `© ${new Date().getFullYear()} ${site.name}`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
