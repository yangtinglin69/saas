import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service role key 來繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      api_key,
      title,
      slug,
      content,
      excerpt,
      featured_image,
      seo_title,
      seo_description,
      seo_keywords,
      status = 'published',
      author
    } = body;

    // 驗證必要欄位
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'Missing api_key' },
        { status: 400 }
      );
    }

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, slug' },
        { status: 400 }
      );
    }

    // 驗證 API Key（簡單比對，實際應用建議用 hash）
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('*, site:sites(*)')
      .eq('key_hash', api_key)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const siteId = apiKeyData.site_id;
    const site = apiKeyData.site;

    // 檢查 slug 是否已存在
    const { data: existingPost } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', slug)
      .single();

    let post;

    if (existingPost) {
      // 更新現有文章
      const { data, error } = await supabaseAdmin
        .from('posts')
        .update({
          title,
          content,
          excerpt,
          featured_image,
          seo_title,
          seo_description,
          seo_keywords,
          status,
          author,
          published_at: status === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPost.id)
        .select()
        .single();

      if (error) throw error;
      post = data;
    } else {
      // 建立新文章
      const { data, error } = await supabaseAdmin
        .from('posts')
        .insert({
          site_id: siteId,
          title,
          slug,
          content,
          excerpt,
          featured_image,
          seo_title,
          seo_description,
          seo_keywords,
          status,
          author,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      post = data;
    }

    // 更新 API Key 最後使用時間
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    return NextResponse.json({
      success: true,
      post_id: post.id,
      url: `https://${site.full_domain}/blog/${slug}`,
      action: existingPost ? 'updated' : 'created'
    });

  } catch (error: any) {
    console.error('Post publish error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// 取得文章列表（給外部系統查詢）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const api_key = searchParams.get('api_key');

    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'Missing api_key' },
        { status: 400 }
      );
    }

    // 驗證 API Key
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('site_id')
      .eq('key_hash', api_key)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    // 取得文章列表
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, slug, status, published_at, created_at, updated_at')
      .eq('site_id', apiKeyData.site_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      posts
    });

  } catch (error: any) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
