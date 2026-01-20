# 🚀 Affiliate SaaS 完整部署指南

## 📋 部署前準備

確保你有以下帳號：
- [ ] GitHub 帳號
- [ ] Vercel 帳號（可用 GitHub 登入）
- [ ] Supabase 帳號
- [ ] 至少一個網域（用於站點）
- [ ] DNS 管理權限（Porkbun / Cloudflare / GoDaddy 等）

---

## 第一步：Supabase 設定（約 10 分鐘）

### 1.1 建立 Supabase 專案

1. 前往 https://supabase.com
2. 點擊 **Start your project**
3. 登入（可用 GitHub）
4. 點擊 **New Project**
5. 填寫：
   - **Name**: `affiliate-saas`
   - **Database Password**: 設一個強密碼（記下來！）
   - **Region**: 選最近的（例如 Singapore）
6. 點擊 **Create new project**
7. 等待約 2 分鐘建立完成

### 1.2 執行資料庫 Schema

1. 在 Supabase Dashboard 左側選單點擊 **SQL Editor**
2. 點擊 **+ New query**
3. 複製 `supabase/schema.sql` 的**全部內容**貼上
4. 點擊 **Run** 執行
5. 確認顯示 `Success. No rows returned`

### 1.3 新增預設主網域

1. 在 SQL Editor 建立新 query
2. **修改以下內容為你的網域**，然後貼上執行：

```sql
-- ⚠️ 請修改為你自己的網域！
INSERT INTO domains (id, domain, name) VALUES
  ('freshblogs', 'freshblogs.cc', 'FreshBlogs'),
  ('quickhub', 'quickhub.cc', 'QuickHub'),
  ('freetoolkit', 'freetoolkit.cc', 'FreeToolkit')
ON CONFLICT (id) DO NOTHING;
```

3. 點擊 **Run** 執行

### 1.4 複製 API 金鑰

1. 點擊左側 **Project Settings**（齒輪圖示）
2. 點擊 **API**
3. 複製以下兩個值（稍後會用到）：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

---

## 第二步：GitHub 上傳（約 5 分鐘）

### 2.1 建立新 Repository

1. 前往 https://github.com/new
2. 填寫：
   - **Repository name**: `affiliate-saas`
   - 選擇 **Private**（建議）
3. 點擊 **Create repository**

### 2.2 上傳檔案

**方法 A：網頁上傳（簡單）**

1. 解壓縮 `affiliate-saas.zip`
2. 在 GitHub repo 頁面點擊 **uploading an existing file**
3. 把 `affiliate-saas` 資料夾**裡面的所有檔案**拖進去
4. 點擊 **Commit changes**

**方法 B：Git 命令（進階）**

```bash
cd affiliate-saas
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/affiliate-saas.git
git branch -M main
git push -u origin main
```

### 2.3 確認檔案結構

上傳後，GitHub 根目錄應該有：
```
├── package.json          ✅ 必須在根目錄
├── next.config.js
├── src/
├── supabase/
└── ...
```

⚠️ **常見錯誤**：如果 `package.json` 在子資料夾裡，Vercel 會部署失敗！

---

## 第三步：Vercel 部署（約 10 分鐘）

### 3.1 連接 GitHub

1. 前往 https://vercel.com
2. 點擊 **Add New** → **Project**
3. 點擊 **Import Git Repository**
4. 選擇 `affiliate-saas` repo
5. 點擊 **Import**

### 3.2 設定專案

在 **Configure Project** 頁面：

1. **Framework Preset**: 選擇 `Next.js`
2. **Root Directory**: 留空
3. 展開 **Environment Variables**，新增：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key |

4. 點擊 **Deploy**
5. 等待約 2-3 分鐘部署完成

### 3.3 確認部署成功

1. 部署完成後會給你網址，例如：`affiliate-saas-xxx.vercel.app`
2. 訪問該網址，應該會自動跳轉到登入頁面
3. 如果看到登入頁面 = ✅ 部署成功！

### 3.4 修改 Middleware（重要！）

1. 編輯 `src/middleware.ts`
2. 把 `adminDomains` 改成你的 Vercel 網址：
```typescript
const adminDomains = ['localhost', 'affiliate-saas-xxx.vercel.app'];
```
3. Commit 並 Push，Vercel 會自動重新部署

---

## 第四步：DNS 設定（約 15-30 分鐘）

### 4.1 設定 Wildcard CNAME

**以 Porkbun 為例：**

1. 登入 Porkbun → 選擇網域 → **DNS**
2. 新增以下記錄：

| Type | Host | Answer |
|------|------|--------|
| CNAME | `*` | `cname.vercel-dns.com` |
| CNAME | `@` | `cname.vercel-dns.com` |

3. 對每個主網域重複以上步驟

**Cloudflare 用戶：**
⚠️ 請把 Proxy 設為 **DNS only**（灰色雲），否則 SSL 會有問題

### 4.2 在 Vercel 加入網域

1. Vercel Dashboard → 專案 → **Settings** → **Domains**
2. 新增每個主網域：
   - `*.freshblogs.cc`（Wildcard）
   - `freshblogs.cc`（根網域）
3. 等待 DNS 驗證（5-15 分鐘，最多 48 小時）

### 4.3 驗證 DNS 設定

用 https://dnschecker.org 檢查：
- 輸入 `test.freshblogs.cc`
- 確認顯示 `cname.vercel-dns.com`

---

## 第五步：測試完整流程

### 5.1 註冊帳號
1. 訪問 `/register`
2. 填寫資料註冊
3. 驗證 Email

### 5.2 創建站點
1. 登入後點擊 **創建新站點**
2. 選擇主網域 → 輸入子網域 → 輸入名稱
3. 點擊創建

### 5.3 設定 OpenAI API Key
1. 站點 → **網站設定** → **AI 設定**
2. 貼上 OpenAI API Key
3. 儲存

### 5.4 AI 生成產品
1. **匯入中心** → **TOP 10 產品** → **AI 自動生成**
2. 輸入類別（如「床墊」）→ 生成 → 匯入

### 5.5 查看網站
訪問 `https://mattress.freshblogs.cc`，完成！🎉

---

## 🔧 常見問題

| 問題 | 解決方案 |
|------|----------|
| Vercel 部署失敗 | 確認 package.json 在根目錄 |
| 登入頁面白屏 | 檢查 Supabase 環境變數 |
| DNS 沒生效 | 等待最多 48 小時，或檢查 CNAME 設定 |
| 子網域 404 | 確認 middleware 的 adminDomains 設定 |
| AI 生成失敗 | 確認 OpenAI API Key 有效且有餘額 |

---

## 📊 部署清單

- [ ] Supabase 專案已建立
- [ ] 資料庫 Schema 已執行
- [ ] 主網域已新增到 domains 表
- [ ] GitHub Repo 已建立
- [ ] 檔案已上傳
- [ ] Vercel 部署成功
- [ ] 環境變數已設定
- [ ] DNS Wildcard 已設定
- [ ] Vercel 已加入所有網域
- [ ] 可以註冊/登入
- [ ] 可以創建站點
- [ ] 子網域可以訪問

🎉 全部打勾 = 部署完成！
