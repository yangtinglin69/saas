import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

interface Props {
  params: { domain: string };
}

async function getSiteData(domain: string) {
  // 查詢站點
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return null;

  // 查詢產品
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('site_id', site.id)
    .eq('is_active', true)
    .order('rank', { ascending: true });

  // 查詢模組
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('site_id', site.id)
    .order('display_order', { ascending: true });

  return { site, products: products || [], modules: modules || [] };
}

export default async function SitePage({ params }: Props) {
  const data = await getSiteData(params.domain);

  if (!data) {
    notFound();
  }

  const { site, products, modules } = data;
  const config = site.config || {};
  const colors = config.colors || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.logo && <img src={config.logo} alt="Logo" className="h-10" />}
              <span className="text-xl font-bold" style={{ color: colors.headerText || '#fff' }}>
                {config.name || site.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modules */}
      {modules.filter(m => m.enabled).map((module) => {
        const content = module.content || {};

        switch (module.id) {
          case 'hero':
            return (
              <section key={module.id} className="py-16 px-4" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
                <div className="max-w-6xl mx-auto">
                  <div className={`flex flex-col ${content.youtubeUrl ? 'lg:flex-row lg:items-center lg:gap-12' : ''}`}>
                    {/* 左側文字內容 */}
                    <div className={`${content.youtubeUrl ? 'lg:w-1/2' : 'max-w-4xl mx-auto text-center'}`}>
                      {content.badge && (
                        <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: colors.accent || '#3b82f6', color: '#fff' }}>
                          {content.badge}
                        </span>
                      )}
                      <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: colors.headerText || '#fff' }}>
                        {content.title || '找到最適合你的產品'}
                      </h1>
                      <p className="text-xl opacity-90 mb-6" style={{ color: colors.headerText || '#fff' }}>
                        {content.subtitle}
                      </p>
                      {content.highlight && (
                        <p className="text-lg opacity-75 mb-8" style={{ color: colors.headerText || '#fff' }}>
                          {content.highlight}
                        </p>
                      )}
                      {content.ctaText && (
                        <a
                          href={content.ctaLink || '#products'}
                          className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90"
                          style={{ backgroundColor: colors.buttonBg || '#22c55e', color: colors.buttonText || '#fff' }}
                        >
                          {content.ctaText}
                        </a>
                      )}
                    </div>
                    
                    {/* 右側 YouTube 影片 */}
                    {content.youtubeUrl && (
                      <div className="lg:w-1/2 mt-8 lg:mt-0">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={content.youtubeUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                            title="Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );

          case 'products':
            return (
              <section key={module.id} id="products" className="py-8 md:py-16 px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{content.title || 'TOP 10 產品評比'}</h2>
                    <p className="text-gray-600">{content.subtitle}</p>
                  </div>
                  <div className="space-y-6">
                    {products.slice(0, content.showCount || 10).map((product: any, index: number) => (
                      <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        {/* Badge Header */}
                        {product.badge && (
                          <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: colors.accent || '#3b82f6' }}>
                            <span className="text-white font-medium text-sm">{product.badge}</span>
                            <span className="text-white text-sm">⭐ {product.rating}/10 Test Lab Score</span>
                          </div>
                        )}
                        
                        <div className="p-4 md:p-6">
                          {/* Mobile Layout */}
                          <div className="md:hidden">
                            {/* Product Image */}
                            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                              {product.images?.main && (
                                <img src={product.images.main} alt={product.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            
                            {/* CTA Button */}
                            {product.affiliate_link && (
                              <a
                                href={product.affiliate_link}
                                target="_blank"
                                rel="noopener sponsored"
                                className="block w-full text-center px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 mb-4"
                                style={{ backgroundColor: colors.buttonBg || '#22c55e', color: colors.buttonText || '#fff' }}
                              >
                                {product.cta_text || 'Shop Now →'}
                              </a>
                            )}
                            
                            {/* Product Info */}
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-gray-600 text-sm mb-4">{product.tagline}</p>
                            
                            {/* Specs Grid - 2x2 for mobile */}
                            <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-gray-100 mb-4">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Price</div>
                                <div className="flex flex-col items-center">
                                  {product.price?.original > product.price?.current && (
                                    <span className="text-gray-400 line-through text-sm">${product.price?.original}</span>
                                  )}
                                  <span className="font-bold" style={{ color: colors.primary || '#22c55e' }}>
                                    ${product.price?.current}
                                  </span>
                                </div>
                              </div>
                              {product.specs?.slice(0, 3).map((spec: any, i: number) => (
                                <div key={i} className="text-center">
                                  <div className="text-xs text-gray-500 mb-1">{spec.label}</div>
                                  <div className="text-sm font-medium text-gray-900">{spec.value}</div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Brief Review */}
                            {product.brief_review && (
                              <p className="text-gray-600 text-sm">{product.brief_review}</p>
                            )}
                          </div>
                          
                          {/* Desktop Layout */}
                          <div className="hidden md:flex items-start gap-6">
                            <div className="text-3xl font-bold text-gray-300">#{index + 1}</div>
                            <div className="w-48 h-36 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              {product.images?.main && (
                                <img src={product.images.main} alt={product.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                              <p className="text-gray-600 mb-2">{product.tagline}</p>
                              
                              {/* Specs Row */}
                              <div className="flex items-center gap-6 py-3 border-t border-b border-gray-100 my-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Price</div>
                                  <div className="flex items-center gap-2">
                                    {product.price?.original > product.price?.current && (
                                      <span className="text-gray-400 line-through text-sm">${product.price?.original}</span>
                                    )}
                                    <span className="font-bold" style={{ color: colors.primary || '#22c55e' }}>
                                      ${product.price?.current}
                                    </span>
                                  </div>
                                </div>
                                {product.specs?.slice(0, 3).map((spec: any, i: number) => (
                                  <div key={i}>
                                    <div className="text-xs text-gray-500 mb-1">{spec.label}</div>
                                    <div className="text-sm font-medium text-gray-900">{spec.value}</div>
                                  </div>
                                ))}
                              </div>
                              
                              <p className="text-gray-500 text-sm mb-4">{product.brief_review}</p>
                              
                              {product.affiliate_link && (
                                <a
                                  href={product.affiliate_link}
                                  target="_blank"
                                  rel="noopener sponsored"
                                  className="inline-block px-6 py-2 rounded-lg font-medium transition hover:opacity-90"
                                  style={{ backgroundColor: colors.buttonBg || '#22c55e', color: colors.buttonText || '#fff' }}
                                >
                                  {product.cta_text || 'Shop Now →'}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'testimonials':
            if (!content.items?.length) return null;
            return (
              <section key={module.id} className="py-16 px-4 bg-gray-100">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{content.title || '用戶評價'}</h2>
                    <p className="text-gray-600">{content.subtitle}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {content.items.map((item: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{item.avatar || '👤'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.product}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600">"{item.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'faq':
            if (!content.items?.length) return null;
            return (
              <section key={module.id} className="py-16 px-4">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{content.title || '常見問題'}</h2>
                    <p className="text-gray-600">{content.subtitle}</p>
                  </div>
                  <div className="space-y-4">
                    {content.items.map((item: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                        <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

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
