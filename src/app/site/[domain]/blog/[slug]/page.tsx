import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { domain: string; slug: string };
}

async function getPostData(domain: string, slug: string) {
  // 查詢站點
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return null;

  // 查詢文章
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) return null;

  // 查詢相關文章
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, slug, featured_image, published_at')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);

  return { site, post, relatedPosts: relatedPosts || [] };
}

export default async function PostPage({ params }: Props) {
  const data = await getPostData(params.domain, params.slug);

  if (!data) {
    notFound();
  }

  const { site, post, relatedPosts } = data;
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

      {/* Article */}
      <article className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">首頁</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-gray-700">部落格</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{post.title}</span>
          </nav>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Meta */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.seo_title || post.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span>👤 {post.author || '編輯部'}</span>
              <span>📅 {new Date(post.published_at).toLocaleDateString()}</span>
            </div>
          </header>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-sm
              prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-gray-700
            "
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Tags / Keywords */}
          {post.seo_keywords && (
            <div className="mt-8 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.seo_keywords.split(',').map((keyword: string, i: number) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-4 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">相關文章</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relPost: any) => (
                <Link
                  key={relPost.id}
                  href={`/blog/${relPost.slug}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group"
                >
                  {relPost.featured_image && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img 
                        src={relPost.featured_image} 
                        alt={relPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {relPost.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(relPost.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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

// SEO Metadata
export async function generateMetadata({ params }: Props) {
  const data = await getPostData(params.domain, params.slug);
  
  if (!data) {
    return { title: 'Not Found' };
  }

  const { post, site } = data;

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    keywords: post.seo_keywords,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author || site.name],
    },
  };
}
