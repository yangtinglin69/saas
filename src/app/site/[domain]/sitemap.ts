// src/app/site/[domain]/sitemap.ts
// 針對單一站點生成 sitemap.xml

import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

interface Props {
  params: { domain: string };
}

export default async function sitemap({ params }: Props): Promise<MetadataRoute.Sitemap> {
  const { domain } = params;
  const baseUrl = `https://${domain}`;
  const allUrls: MetadataRoute.Sitemap = [];

  // 取得站點資訊
  const { data: site } = await supabase
    .from('sites')
    .select('id, updated_at')
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();

  if (!site) return allUrls;

  // 1. 首頁
  allUrls.push({
    url: baseUrl,
    lastModified: new Date(site.updated_at),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. 所有啟用的產品頁（包含 show_in_ranking = false 的，因為頁面還在）
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('site_id', site.id)
    .eq('is_active', true);  // 只要 is_active = true 就收錄

  if (products) {
    for (const product of products) {
      allUrls.push({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // 3. 所有已發布的文章（如果有）
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('site_id', site.id)
    .eq('status', 'published');

  if (posts) {
    for (const post of posts) {
      allUrls.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return allUrls;
}
