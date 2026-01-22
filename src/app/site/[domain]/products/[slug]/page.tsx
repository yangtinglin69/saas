import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { domain: string; slug: string };
}

async function getProductData(domain: string, slug: string) {
  // 查詢站點
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return null;

  // 查詢產品
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) return null;

  return { site, product };
}

// SEO Metadata
export async function generateMetadata({ params }: Props) {
  const data = await getProductData(params.domain, params.slug);
  if (!data) return { title: 'Product Not Found' };
  
  const { site, product } = data;
  
  return {
    title: `${product.name} Review | ${site.name}`,
    description: product.tagline || product.brief_review,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const data = await getProductData(params.domain, params.slug);

  if (!data) {
    notFound();
  }

  const { site, product } = data;
  const config = site.config || {};
  const colors = config.colors || {};

  return (
    <div className="min-h-screen bg-gray-50">
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
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/#products" className="text-white/80 hover:text-white transition">
                ← Back to Reviews
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Product Hero */}
      <section className="py-12 px-4" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* 產品圖片 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {product.images?.main ? (
                <img 
                  src={product.images.main} 
                  alt={product.name} 
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
            
            {/* 產品資訊 */}
            <div className="text-white">
              {product.badge && (
                <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" 
                  style={{ backgroundColor: colors.accent || '#3b82f6' }}>
                  🏆 {product.badge}
                </span>
              )}
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl opacity-90 mb-4">{product.tagline}</p>
              
              {/* 評分 */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-bold text-yellow-400">{product.rating}</div>
                <div>
                  <div className="text-yellow-400 text-2xl">
                    {'★'.repeat(Math.floor(product.rating / 2))}
                    {'☆'.repeat(5 - Math.floor(product.rating / 2))}
                  </div>
                  <div className="text-sm opacity-75">Test Lab Score</div>
                </div>
              </div>
              
              {/* 價格 */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {product.price?.original > product.price?.current && (
                    <span className="text-2xl line-through opacity-50">
                      ${product.price.original}
                    </span>
                  )}
                  <span className="text-4xl font-bold" style={{ color: '#22c55e' }}>
                    ${product.price?.current}
                  </span>
                </div>
              </div>
              
              {/* CTA 按鈕 */}
              {product.affiliate_link && (
                <a
                  href={product.affiliate_link}
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
                  style={{ backgroundColor: colors.buttonBg || '#0ea5e9', color: colors.buttonText || '#fff' }}
                >
                  Shop {product.name} →
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 快速規格 */}
      {Array.isArray(product.specs) && product.specs.length > 0 && (
        <section className="py-6 px-4 bg-white border-b">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8">
              {product.specs.map((spec: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-sm text-gray-500 mb-1">{spec.label}</div>
                  <div className="font-semibold text-gray-900">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* 適合誰 */}
        {(Array.isArray(product.best_for) && product.best_for.length > 0 || Array.isArray(product.not_best_for) && product.not_best_for.length > 0) && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Who Is It Best For?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {Array.isArray(product.best_for) && product.best_for.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-700 mb-3">✅ Best For</h3>
                  <ul className="space-y-2">
                    {product.best_for.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(product.not_best_for) && product.not_best_for.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <h3 className="font-semibold text-red-700 mb-3">❌ Not Ideal For</h3>
                  <ul className="space-y-2">
                    {product.not_best_for.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-400 mt-1">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 完整評測 */}
        {product.full_review && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Full Review</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {product.full_review}
              </p>
            </div>
          </section>
        )}

        {/* 材質結構 */}
        {Array.isArray(product.materials) && product.materials.length > 0 && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Inside the {product.name}</h2>
            <div className="space-y-4">
              {product.materials.map((material: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{material.layer}</div>
                    <div className="text-gray-600">{material.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 詳細評分 */}
        {Array.isArray(product.scores) && product.scores.length > 0 && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⭐ Detailed Scores</h2>
            <div className="space-y-4">
              {product.scores.map((score: any, i: number) => (
                <div key={i} className="p-4 bg-yellow-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{score.label}</span>
                    <span className="text-xl font-bold text-yellow-600">{score.score}/10</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${(score.score / 10) * 100}%` }}
                    />
                  </div>
                  {score.description && (
                    <p className="text-sm text-gray-500 mt-2">{score.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 優缺點 */}
        {(Array.isArray(product.pros) && product.pros.length > 0 || Array.isArray(product.cons) && product.cons.length > 0) && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">👍 Pros & Cons</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {Array.isArray(product.pros) && product.pros.length > 0 && (
                <div className="p-6 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-700 mb-4 text-lg">✅ What We Like</h3>
                  <ul className="space-y-2">
                    {product.pros.map((pro: string, i: number) => (
                      <li key={i} className="text-gray-700">• {pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(product.cons) && product.cons.length > 0 && (
                <div className="p-6 bg-red-50 rounded-xl">
                  <h3 className="font-semibold text-red-700 mb-4 text-lg">❌ What We Don&apos;t Like</h3>
                  <ul className="space-y-2">
                    {product.cons.map((con: string, i: number) => (
                      <li key={i} className="text-gray-700">• {con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 產品 FAQ */}
        {Array.isArray(product.faqs) && product.faqs.length > 0 && (
          <section className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Frequently Asked Questions</h2>
            <div className="space-y-4">
              {product.faqs.map((faq: any, i: number) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                  <h3 className="font-semibold text-gray-900 mb-2">Q: {faq.question}</h3>
                  <p className="text-gray-600">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 底部 CTA */}
        <section className="text-center py-8">
          <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
            <h2 className="text-2xl font-bold mb-2">Ready to try {product.name}?</h2>
            <p className="opacity-90 mb-6">Get the best deal today</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-3xl font-bold">${product.price?.current}</span>
              {product.affiliate_link && (
                <a
                  href={product.affiliate_link}
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-block px-8 py-3 bg-white rounded-lg font-semibold transition hover:bg-gray-100"
                  style={{ color: colors.headerBg || '#1e3a5f' }}
                >
                  Shop {product.name} →
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.footerBg || '#111827' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center" style={{ color: colors.footerText || '#9ca3af' }}>
            {config.footer?.disclaimer && (
              <p className="text-sm mb-4 opacity-75">{config.footer.disclaimer}</p>
            )}
            <p className="text-sm">{config.footer?.copyright || `© ${new Date().getFullYear()} ${site.name}`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
