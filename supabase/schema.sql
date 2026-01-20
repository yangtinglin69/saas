-- ============================================
-- Affiliate SaaS 多租戶資料庫 Schema
-- ============================================

-- 1. 主網域表（你們預設的網域）
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,                    -- 例如 "brand-a"
  domain TEXT UNIQUE NOT NULL,            -- 例如 "affiliate-brand-a.com"
  name TEXT NOT NULL,                     -- 顯示名稱 "品牌 A"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用戶表（內部用戶）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',               -- admin / user
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 站點表（用戶創建的子網域站點）
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain_id TEXT REFERENCES domains(id),
  subdomain TEXT NOT NULL,                -- 例如 "mattress"
  full_domain TEXT UNIQUE NOT NULL,       -- 例如 "mattress.affiliate-brand-a.com"
  name TEXT NOT NULL,                     -- "床墊評比站"
  config JSONB DEFAULT '{
    "name": "",
    "tagline": "",
    "logo": "",
    "favicon": "",
    "seo": {
      "title": "",
      "description": "",
      "keywords": [],
      "ogImage": ""
    },
    "colors": {
      "primary": "#1e3a5f",
      "secondary": "#2d4a6f",
      "accent": "#3b82f6",
      "headerBg": "#1e3a5f",
      "headerText": "#ffffff",
      "footerBg": "#111827",
      "footerText": "#9ca3af",
      "buttonBg": "#22c55e",
      "buttonText": "#ffffff",
      "buttonHover": "#16a34a"
    },
    "typography": {
      "headingWeight": "700",
      "bodyWeight": "400",
      "headingItalic": false,
      "bodyItalic": false
    },
    "tracking": {
      "gaId": "",
      "gtmId": "",
      "fbPixelId": "",
      "customHead": ""
    },
    "ai": {
      "openaiKey": "",
      "model": "gpt-4o-mini",
      "language": "en"
    },
    "footer": {
      "disclaimer": "",
      "copyright": ""
    },
    "adsense": {
      "enabled": false,
      "publisherId": "",
      "slots": {}
    }
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id, subdomain)
);

-- 4. 產品表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  slug TEXT NOT NULL,
  badge TEXT,
  name TEXT NOT NULL,
  tagline TEXT,
  price JSONB DEFAULT '{"original": 0, "current": 0, "currency": "USD"}'::jsonb,
  rating DECIMAL(3,1) DEFAULT 0,
  images JSONB DEFAULT '{"main": "", "gallery": []}'::jsonb,
  specs JSONB DEFAULT '[]'::jsonb,
  best_for JSONB DEFAULT '[]'::jsonb,
  not_best_for JSONB DEFAULT '[]'::jsonb,
  brief_review TEXT,
  full_review TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  scores JSONB DEFAULT '[]'::jsonb,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  affiliate_link TEXT,
  cta_text TEXT DEFAULT 'Shop Now →',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- 5. 模組表
CREATE TABLE IF NOT EXISTS modules (
  id TEXT NOT NULL,                       -- hero, painPoints, story, etc.
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, site_id)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 主網域：所有登入用戶可讀
CREATE POLICY "domains_read" ON domains
  FOR SELECT USING (true);

-- 用戶：只能看自己
CREATE POLICY "users_own" ON users
  FOR ALL USING (id = auth.uid());

-- 站點：只能存取自己的
CREATE POLICY "sites_own" ON sites
  FOR ALL USING (user_id = auth.uid());

-- 產品：只能存取自己站點的
CREATE POLICY "products_own" ON products
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- 模組：只能存取自己站點的
CREATE POLICY "modules_own" ON modules
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- 公開讀取政策（前台需要）
CREATE POLICY "sites_public_read" ON sites
  FOR SELECT USING (is_active = true);

CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (
    is_active = true AND 
    site_id IN (SELECT id FROM sites WHERE is_active = true)
  );

CREATE POLICY "modules_public_read" ON modules
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE is_active = true)
  );

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sites_full_domain ON sites(full_domain);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_products_site_id ON products(site_id);
CREATE INDEX IF NOT EXISTS idx_modules_site_id ON modules(site_id);

-- ============================================
-- 觸發器：自動更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. 文章表（部落格 / SEO 文章）
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,                              -- HTML 內容
  excerpt TEXT,                              -- 摘要
  featured_image TEXT,                       -- 特色圖片
  status TEXT DEFAULT 'draft',               -- draft / published
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- 7. API Keys 表（讓外部系統推送文章）
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,                    -- API Key 的 hash
  name TEXT DEFAULT 'Default',               -- 名稱備註
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 文章：只能存取自己站點的
CREATE POLICY "posts_own" ON posts
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- 文章：公開讀取已發布的
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (
    status = 'published' AND
    site_id IN (SELECT id FROM sites WHERE is_active = true)
  );

-- API Keys：只能存取自己站點的
CREATE POLICY "api_keys_own" ON api_keys
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_site_id ON posts(site_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON api_keys(site_id);

-- 觸發器
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
