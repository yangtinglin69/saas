// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 根據 hostname 取得站點資料
export async function getSiteByDomain(hostname: string) {
  // 移除 port（開發環境）
  const domain = hostname.split(':')[0];
  
  // 查詢站點
  const { data: site } = await supabase
    .from('sites')
    .select(`
      *,
      domain:domains(*)
    `)
    .eq('full_domain', domain)
    .eq('is_active', true)
    .single();
  
  return site;
}

// 取得站點的產品
export async function getProductsBySite(siteId: string) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('rank', { ascending: true });
  
  return data || [];
}

// 取得站點的模組
export async function getModulesBySite(siteId: string) {
  const { data } = await supabase
    .from('modules')
    .select('*')
    .eq('site_id', siteId)
    .order('display_order', { ascending: true });
  
  return data || [];
}

// 取得所有主網域
export async function getDomains() {
  const { data } = await supabase
    .from('domains')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  return data || [];
}

// 取得用戶的所有站點
export async function getUserSites(userId: string) {
  const { data } = await supabase
    .from('sites')
    .select(`
      *,
      domain:domains(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data || [];
}
