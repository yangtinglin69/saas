# 📖 Affiliate SaaS 完整使用說明

## 目錄
1. [系統架構說明](#系統架構說明)
2. [部署流程](#部署流程)
3. [網域設定說明](#網域設定說明)
4. [日常操作指南](#日常操作指南)
5. [n8n 文章推送設定](#n8n-文章推送設定)
6. [常見問題](#常見問題)

---

## 系統架構說明

### 這是什麼？
一個 **SaaS 多租戶聯盟行銷平台**，一套程式碼可以管理多個站點。

### 兩種網域
| 類型 | 用途 | 範例 |
|-----|------|------|
| **後台網域** | 你/團隊登入管理用 | `affiliate-saas-xxx.vercel.app` |
| **站點網域** | 給訪客看的前台 | `mattress.sleepgoodlab.com` |

### 架構圖
```
後台 (affiliate-saas-xxx.vercel.app)
├── /login        登入
├── /dashboard    站點列表
└── /dashboard/sites/[id]
    ├── 📊 總覽
    ├── 📦 產品管理
    ├── 🧩 模組管理（含 YouTube）
    ├── 📝 文章管理
    ├── 📥 匯入中心
    └── ⚙️ 設定

站點前台 (子網域)
├── mattress.sleepgoodlab.com
│   ├── /         首頁（產品評比）
│   ├── /blog     部落格列表
│   └── /blog/xxx 文章內頁
├── pillow.sleepgoodlab.com
└── ...更多站點
```

---

## 部署流程

### 順序
```
① Supabase → ② GitHub → ③ Vercel → ④ DNS
```

### ① Supabase（資料庫）

1. 前往 https://supabase.com 建立專案
2. 進入 SQL Editor，執行 `supabase/schema.sql` 全部內容
3. 複製 3 個金鑰（Settings → API）：
   - `Project URL`
   - `anon public key`
   - `service_role key`

### ② GitHub（程式碼）

1. 建立新 repo（建議 Private）
2. 上傳 ZIP 裡的所有檔案
3. **重要**：確認 `package.json` 在根目錄

### ③ Vercel（部署）

1. 前往 https://vercel.com
2. Import GitHub repo
3. 設定環境變數：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key |

4. Deploy 等待完成
5. 記下 Vercel 給的網址（例如 `affiliate-saas-xxx.vercel.app`）
6. **更新 middleware.ts**：把 `adminDomains` 改成你的網址

### ④ DNS（站點網域）

見下方「網域設定說明」。

---

## 網域設定說明

### 後台網域

#### 預設方式（推薦一開始用）
直接用 Vercel 給的 `affiliate-saas-xxx.vercel.app`，不用設定任何 DNS。

#### 自訂後台網域（之後想用再設定）
例如想用 `admin.sleepgoodlab.com`：

1. **GoDaddy DNS**：
   | Type | Host | Value |
   |------|------|-------|
   | CNAME | `admin` | `cname.vercel-dns.com` |

2. **Vercel Domains**：加入 `admin.sleepgoodlab.com`

3. **修改程式碼** `src/middleware.ts`：
   ```typescript
   const adminDomains = [
     'localhost', 
     'affiliate-saas-xxx.vercel.app',
     'admin.sleepgoodlab.com'  // ← 加這行
   ];
   ```

4. Push 到 GitHub，Vercel 會自動重新部署

---

### 站點網域（不用改程式碼）

新增站點網域只需 3 步：

#### 步驟 1：GoDaddy DNS
| Type | Host | Value |
|------|------|-------|
| CNAME | `*` | `cname.vercel-dns.com` |
| CNAME | `@` | `cname.vercel-dns.com` |

> ⚠️ 如果用 Cloudflare，Proxy 要設成 DNS only（灰色雲）

#### 步驟 2：Vercel Domains
Settings → Domains → Add：
- `*.sleepgoodlab.com`（Wildcard）
- `sleepgoodlab.com`（根網域）

#### 步驟 3：Supabase 新增主網域
到 SQL Editor 執行：
```sql
INSERT INTO domains (id, domain, name) VALUES
  ('sleepgoodlab', 'sleepgoodlab.com', 'Sleep Good Lab')
ON CONFLICT (id) DO NOTHING;
```

#### 完成！
現在可以在後台建立站點時選擇這個主網域了。

---

## 日常操作指南

### 建立新站點
1. 登入後台 → Dashboard
2. 點「創建新站點」
3. 選擇主網域（例如 sleepgoodlab.com）
4. 輸入子網域（例如 mattress）
5. 輸入站點名稱
6. 完成！訪問 `mattress.sleepgoodlab.com` 即可看到

### 新增產品
1. 進入站點 → 📦 產品管理
2. 可手動新增或使用 📥 匯入中心批量匯入

### 設定 YouTube 影片
1. 進入站點 → 🧩 模組管理
2. 編輯「首屏 Hero」
3. 填入 YouTube 網址
4. 儲存

### 管理部落格文章
1. 進入站點 → 📝 文章管理
2. 可查看、編輯、刪除文章
3. 產生 API Key 給 n8n 使用

---

## n8n 文章推送設定

### 產生 API Key
1. 後台 → 站點 → 📝 文章管理
2. 點「產生新金鑰」
3. 複製並保存（只會顯示一次！）

### n8n HTTP Request 設定

**Method**: POST

**URL**: 
```
https://你的後台網址/api/posts/publish
```

**Body (JSON)**:
```json
{
  "api_key": "ak_xxxxxxxxxxxxxx",
  "title": "{{$json.title}}",
  "slug": "{{$json.slug}}",
  "content": "{{$json.content}}",
  "excerpt": "{{$json.excerpt}}",
  "featured_image": "{{$json.featured_image}}",
  "seo_title": "{{$json.seo_title}}",
  "seo_description": "{{$json.seo_description}}",
  "seo_keywords": "{{$json.seo_keywords}}",
  "status": "published",
  "author": "{{$json.author}}"
}
```

### 回應範例
```json
{
  "success": true,
  "post_id": "uuid-xxx",
  "url": "https://mattress.sleepgoodlab.com/blog/article-slug",
  "action": "created"
}
```

### 欄位說明
| 欄位 | 必填 | 說明 |
|-----|------|------|
| `api_key` | ✅ | 後台產生的 API Key |
| `title` | ✅ | 文章標題 |
| `slug` | ✅ | 網址路徑（英文、數字、連字號） |
| `content` | ❌ | HTML 內容 |
| `excerpt` | ❌ | 摘要 |
| `featured_image` | ❌ | 特色圖片網址 |
| `seo_title` | ❌ | SEO 標題 |
| `seo_description` | ❌ | SEO 描述 |
| `seo_keywords` | ❌ | 關鍵字（逗號分隔） |
| `status` | ❌ | `published` 或 `draft`，預設 `draft` |
| `author` | ❌ | 作者名稱 |

---

## 常見問題

### Q: 部署後看到白屏或 500 錯誤
**A**: 檢查 Vercel 環境變數是否正確設定。

### Q: 站點顯示 404
**A**: 確認：
1. DNS 已設定並生效（用 dnschecker.org 檢查）
2. Vercel Domains 已加入
3. Supabase domains 表有這個主網域
4. middleware.ts 的 adminDomains 沒有包含這個網域

### Q: 自訂後台網域後無法登入
**A**: 確認 middleware.ts 的 `adminDomains` 有加入這個網域。

### Q: n8n 推送文章失敗
**A**: 檢查：
1. API Key 是否正確
2. API Key 是否還是 active 狀態
3. Vercel 環境變數有設定 `SUPABASE_SERVICE_ROLE_KEY`

### Q: 文章推送成功但前台看不到
**A**: 確認 `status` 是 `published`，不是 `draft`。

### Q: 如何新增更多主網域？
**A**: 重複「站點網域」的 3 個步驟即可，不用改程式碼。

---

## 檔案結構參考

```
affiliate-saas/
├── src/
│   ├── app/
│   │   ├── (auth)/           # 登入、註冊
│   │   ├── (dashboard)/      # 後台管理
│   │   ├── api/              # API 端點
│   │   └── site/[domain]/    # 前台站點
│   ├── lib/                  # 工具函式
│   └── middleware.ts         # 路由控制（重要！）
├── supabase/
│   ├── schema.sql            # 資料庫結構
│   └── seed.sql              # 預設資料
└── ...
```

---

## 需要更多幫助？

1. 查看 Vercel Deployment logs 了解錯誤詳情
2. 查看 Supabase Logs 了解資料庫問題
3. 瀏覽器 F12 開發者工具查看 Console 錯誤
