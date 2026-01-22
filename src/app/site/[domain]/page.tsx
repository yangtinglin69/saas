import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductCard from './ProductCard';

// 強制動態渲染，不要快取（解決問題 1 和 3）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // 查詢模組 - 修正：sort_order → display_order
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('site_id', site.id)
    .order('display_order', { ascending: true });

  return { site, products: products || [], modules: modules || [] };
}

// SEO Metadata
export async function generateMetadata({ params }: Props) {
  const data = await getSiteData(params.domain);
  if (!data) return { title: 'Not Found' };
  
  const { site } = data;
  const config = site.config || {};
  
  return {
    title: config.seo?.title || site.name,
    description: config.seo?.description || `${site.name} - 專業產品評比`,
    keywords: config.seo?.keywords,
    openGraph: {
      title: config.seo?.title || site.name,
      description: config.seo?.description,
      images: config.seo?.ogImage ? [config.seo.ogImage] : [],
    },
  };
}

export default async function SitePage({ params }: Props) {
  const data = await getSiteData(params.domain);

  if (!data) {
    notFound();
  }

  const { site, products, modules } = data;
  const config = site.config || {};
  const colors = config.colors || {};

  // 修正：is_enabled → enabled, sort_order → display_order
  const enabledModules = modules
    .filter((m: any) => m.enabled)
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

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
            <nav className="hidden md:flex items-center gap-6">
              <a href="#products" className="text-white/80 hover:text-white transition">產品評比</a>
              <a href="/blog" className="text-white/80 hover:text-white transition">部落格</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Modules */}
      {enabledModules.map((module: any) => {
        const content = module.content || {};

        switch (module.id) {
          // ===== Hero 首屏 =====
          case 'hero':
            return (
              <section key={module.id} className="py-16 px-4" style={{ backgroundColor: colors.headerBg || '#1e3a5f' }}>
                <div className="max-w-6xl mx-auto">
                  <div className={`flex flex-col ${content.youtubeUrl ? 'lg:flex-row lg:items-center lg:gap-12' : ''}`}>
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

          // ===== 痛點區 ===== 修正：items → points
          case 'painPoints':
            if (!content.points?.length) return null;
            return (
              <section key={module.id} className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    {content.image && (
                      <div className="order-2 md:order-1">
                        <img 
                          src={content.image} 
                          alt={content.title || '痛點'} 
                          className="rounded-2xl shadow-lg w-full"
                        />
                      </div>
                    )}
                    <div className={content.image ? 'order-1 md:order-2' : 'md:col-span-2 max-w-3xl mx-auto'}>
                      <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        {content.title || '你是不是也有這些困擾？'}
                      </h2>
                      <div className="space-y-4">
                        {content.points.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
                            <span className="text-2xl">{item.icon || '😫'}</span>
                            <p className="text-gray-700 text-lg">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          // ===== 故事區 =====
          case 'story':
            if (!content.paragraphs?.length && !content.text) return null;
            return (
              <section key={module.id} className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="max-w-6xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        {content.title || '我的故事'}
                      </h2>
                      <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                        {content.paragraphs ? (
                          content.paragraphs.map((p: string, i: number) => (
                            <p key={i}>{p}</p>
                          ))
                        ) : (
                          <p>{content.text}</p>
                        )}
                      </div>
                    </div>
                    {content.image && (
                      <div>
                        <img 
                          src={content.image} 
                          alt={content.title || '故事'} 
                          className="rounded-2xl shadow-lg w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );

          // ===== 方法/特色區 =====
          case 'method':
            if (!content.features?.length) return null;
            return (
              <section key={module.id} className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {content.title || '我們的方法'}
                    </h2>
                    {content.subtitle && (
                      <p className="text-gray-600 text-lg">{content.subtitle}</p>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {content.image && (
                      <div>
                        <img 
                          src={content.image} 
                          alt={content.title || '方法'} 
                          className="rounded-2xl shadow-lg w-full"
                        />
                      </div>
                    )}
                    <div className={content.image ? '' : 'md:col-span-2'}>
                      <div className="grid gap-6">
                        {content.features.map((feature: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
                            <span className="text-3xl">{feature.icon || '✨'}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">{feature.title}</h3>
                              <p className="text-gray-600">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          // ===== 快速比較表 =====
          case 'comparison':
            if (!content.items?.length) return null;
            return (
              <section key={module.id} className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {content.title || '哪一款適合你？'}
                    </h2>
                    {content.subtitle && (
                      <p className="text-gray-600 text-lg">{content.subtitle}</p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {content.items.map((item: any, i: number) => (
                        <div key={i} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition">
                          <span className="text-3xl">{item.icon || '👤'}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{item.type}</div>
                            <div className="text-gray-500 text-sm">{item.reason}</div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-4 py-2 rounded-lg font-semibold" 
                              style={{ backgroundColor: colors.accent || '#3b82f6', color: '#fff' }}>
                              {item.recommendation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );

          // ===== 產品列表 =====
          case 'products':
            return (
              <section key={module.id} id="products" className="py-8 md:py-16 px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {content.title || 'TOP 10 產品評比'}
                    </h2>
                    <p className="text-gray-600">{content.subtitle}</p>
                  </div>
                  <div className="space-y-6">
                    {products.slice(0, content.showCount || 10).map((product: any, index: number) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        index={index} 
                        colors={colors}
                        domain={params.domain}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );

          // ===== 客戶評價 =====
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
                            <div className="text-sm text-gray-500">{item.title || item.product}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600">&quot;{item.content || item.text}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          // ===== FAQ =====
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
