-- ============================================
-- 預設主網域（你們控制的網域）
-- ============================================

INSERT INTO domains (id, domain, name) VALUES
  ('brand-a', 'affiliate-brand-a.com', '品牌 A'),
  ('brand-b', 'affiliate-brand-b.com', '品牌 B'),
  ('brand-c', 'affiliate-brand-c.com', '品牌 C')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 預設 Admin 用戶（用 Supabase Auth 創建後更新）
-- 這裡只是示範，實際上用戶會透過註冊創建
-- ============================================

-- 預設模組模板（創建新站點時複製）
-- 這些會在 API 中處理
