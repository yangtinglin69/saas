import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { domain: string };
}

async function getBlogData(domain: string) {
  // 查詢站點
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return null;

  // 查詢已發布的文章
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return { site, posts: posts || [] };
}

export default async function BlogPage({ params }: Props) {
  const data = await getBlogData(params.domain);

  if (!data) {
    notFound();
  }

  const { site, posts } = data;
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

      {/* Blog Header */}
      <section className="py-12 px-4" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: colors.headerText || '#fff' }}>
            部落格
          </h1>
          <p className="text-lg opacity-80" style={{ color: colors.headerText || '#fff' }}>
            最新文章與資訊
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-gray-500">尚未有任何文章</p>
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
