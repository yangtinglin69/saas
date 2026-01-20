# 🚀 SaaS 版本更新說明

## 本次更新內容

### ✅ 1. YouTube 影片嵌入功能
- **後台**：在「模組管理」→「首屏 Hero」編輯器中新增 YouTube 網址輸入欄位
- **前台**：Hero 區塊會顯示 YouTube 影片（桌機版左文右影片，手機版上下排列）
- 支援格式：`youtube.com/watch?v=`、`youtu.be/`、`youtube.com/embed/`

### ✅ 2. 登出功能
- 已內建於 Dashboard 右上角，點擊即可登出

### 🆕 3. 部落格系統
- **後台**：新增「📝 文章」管理頁面
- **前台**：新增 `/blog` 文章列表頁和 `/blog/[slug]` 文章內頁
- **API**：新增 `/api/posts/publish` 端點，可從 n8n 推送 HTML 文章

### 🆕 4. API Key 管理
- 後台可產生 API Key
- 用於 n8n 或其他外部系統推送文章

---

## 部署步驟

### 步驟 1：更新資料庫 Schema

到 Supabase SQL Editor 執行以下 SQL（新增 posts 和 api_keys 表）：

```sql
-- 6. 文章表（部落格 / SEO 文章）
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- 7. API Keys 表
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT DEFAULT 'Default',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_own" ON posts
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (status = 'published' AND site_id IN (SELECT id FROM sites WHERE is_active = true));

CREATE POLICY "api_keys_own" ON api_keys
  FOR ALL USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_site_id ON posts(site_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON api_keys(site_id);

-- 觸發器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 步驟 2：設定環境變數

到 Vercel Dashboard → Settings → Environment Variables 新增：

| Key | Value | 說明 |
|-----|-------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 service role key | 在 Supabase → Settings → API 取得 |

### 步驟 3：上傳更新後的程式碼

把 `affiliate-saas-updated.zip` 的檔案覆蓋到 GitHub repo。

### 步驟 4：重新部署

Vercel 會自動部署，或手動 Redeploy。

---

## n8n 推送文章設定

### API 端點
```
POST https://你的網域/api/posts/publish
```

### 請求格式
```json
{
  "api_key": "ak_xxxxxx",
  "title": "文章標題",
  "slug": "article-slug",
  "content": "<p>HTML 內容...</p>",
  "excerpt": "摘要",
  "featured_image": "https://圖片網址",
  "seo_title": "SEO 標題",
  "seo_description": "SEO 描述",
  "seo_keywords": "關鍵字1,關鍵字2",
  "status": "published",
  "author": "作者"
}
```

### 回應
```json
{
  "success": true,
  "post_id": "uuid",
  "url": "https://站點網域/blog/article-slug",
  "action": "created"
}
```

---

## 檔案變更清單

### 修改的檔案
- `src/app/(dashboard)/dashboard/sites/[siteId]/modules/page.tsx` - 加入 YouTube URL 輸入
- `src/app/(dashboard)/dashboard/sites/[siteId]/layout.tsx` - 加入「文章」選項
- `src/app/site/[domain]/page.tsx` - Hero 區塊顯示 YouTube 影片
- `supabase/schema.sql` - 新增 posts 和 api_keys 表
- `.env.example` - 新增 SUPABASE_SERVICE_ROLE_KEY

### 新增的檔案
- `src/app/(dashboard)/dashboard/sites/[siteId]/posts/page.tsx` - 後台文章管理
- `src/app/api/posts/publish/route.ts` - 文章推送 API
- `src/app/site/[domain]/blog/page.tsx` - 前台部落格列表
- `src/app/site/[domain]/blog/[slug]/page.tsx` - 前台文章內頁
- `UPDATE_NOTES.md` - 本說明文件
