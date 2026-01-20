// src/lib/auth.ts
import { supabase } from './supabase';

// 註冊
export async function signUp(email: string, password: string, name: string) {
  // 1. Supabase Auth 註冊
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. 建立用戶資料
  if (authData.user) {
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      name,
    });
    if (userError) throw userError;
  }

  return authData;
}

// 登入
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// 登出
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 取得當前用戶
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData;
}

// 預設模組內容
export const DEFAULT_MODULES = [
  {
    id: 'hero',
    enabled: true,
    display_order: 1,
    content: {
      badge: '2025 年度評比',
      title: '找到最適合你的產品',
      subtitle: '我們測試了 50+ 款產品，為你精選 TOP 10',
      highlight: '🔬 專業實測 | ⭐ 真實評分 | 💰 最佳價格',
      ctaText: '查看完整評比 →',
      ctaLink: '#products',
      backgroundImage: '',
    },
  },
  {
    id: 'painPoints',
    enabled: true,
    display_order: 2,
    content: {
      title: '你是否也有這些困擾？',
      image: '',
      points: [
        { icon: '😫', text: '市面上選擇太多，不知道怎麼挑？' },
        { icon: '💸', text: '擔心花了錢卻買到不適合的產品？' },
        { icon: '🤔', text: '網路評價真真假假，不知道該相信誰？' },
      ],
    },
  },
  {
    id: 'story',
    enabled: true,
    display_order: 3,
    content: {
      title: '我們的故事',
      image: '',
      paragraphs: [
        '我們也曾經和你一樣迷惘...',
        '經過無數次的研究和測試，我們建立了這個評比網站。',
        '希望能幫助更多人找到真正適合自己的產品。',
      ],
    },
  },
  {
    id: 'method',
    enabled: true,
    display_order: 4,
    content: {
      title: '我們的評測方法',
      subtitle: '嚴謹、專業、客觀',
      features: [
        { icon: '🔬', title: '實際測試', description: '每款產品都經過實際使用測試' },
        { icon: '📊', title: '數據分析', description: '結合用戶評價和專業數據' },
        { icon: '💯', title: '客觀評分', description: '不收廠商費用，保持中立' },
      ],
    },
  },
  {
    id: 'comparison',
    enabled: true,
    display_order: 5,
    content: {
      title: '哪款產品適合你？',
      subtitle: '根據你的需求快速找到答案',
      rows: [],
    },
  },
  {
    id: 'products',
    enabled: true,
    display_order: 6,
    content: {
      title: 'TOP 10 產品評比',
      subtitle: '我們精選的最佳產品',
      showCount: 10,
    },
  },
  {
    id: 'testimonials',
    enabled: true,
    display_order: 7,
    content: {
      title: '用戶真實評價',
      subtitle: '看看其他人怎麼說',
      items: [],
    },
  },
  {
    id: 'faq',
    enabled: true,
    display_order: 8,
    content: {
      title: '常見問題',
      subtitle: '解答你的疑惑',
      items: [],
    },
  },
];

// 創建新站點
export async function createSite(
  userId: string,
  domainId: string,
  subdomain: string,
  name: string
) {
  // 取得主網域
  const { data: domain } = await supabase
    .from('domains')
    .select('domain')
    .eq('id', domainId)
    .single();

  if (!domain) throw new Error('找不到主網域');

  const fullDomain = `${subdomain}.${domain.domain}`;

  // 創建站點
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      domain_id: domainId,
      subdomain,
      full_domain: fullDomain,
      name,
      config: {
        name,
        tagline: '',
        logo: '',
        favicon: '',
        seo: { title: name, description: '', keywords: [], ogImage: '' },
        colors: {
          primary: '#1e3a5f',
          secondary: '#2d4a6f',
          accent: '#3b82f6',
          headerBg: '#1e3a5f',
          headerText: '#ffffff',
          footerBg: '#111827',
          footerText: '#9ca3af',
          buttonBg: '#22c55e',
          buttonText: '#ffffff',
          buttonHover: '#16a34a',
        },
        typography: {
          headingWeight: '700',
          bodyWeight: '400',
          headingItalic: false,
          bodyItalic: false,
        },
        tracking: { gaId: '', gtmId: '', fbPixelId: '', customHead: '' },
        ai: { openaiKey: '', model: 'gpt-4o-mini', language: 'en' },
        footer: { disclaimer: '', copyright: `© ${new Date().getFullYear()} ${name}` },
        adsense: { enabled: false, publisherId: '', slots: {} },
      },
    })
    .select()
    .single();

  if (siteError) throw siteError;

  // 創建預設模組
  const modulesToInsert = DEFAULT_MODULES.map((m) => ({
    ...m,
    site_id: site.id,
  }));

  await supabase.from('modules').insert(modulesToInsert);

  return site;
}
