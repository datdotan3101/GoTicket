-- Phase 5: Enhancements for Phase 4 modules
-- Chạy migration này sau 004_phase4_core_modules.sql

-- 1. Thêm image_url cho stadiums (đã bỏ sót ở schema gốc)
ALTER TABLE stadiums
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Thêm scheduled_publish_at vào approvals
--    Dùng để lưu lịch publish khi editor/manager submit
--    Approval service sẽ đọc field này khi duyệt để quyết định publish ngay hay chờ cron
ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- 3. Thêm updated_at trigger cho clubs và leagues (clean code: không lặp logic timestamp)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho users (đã có updated_at column)
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Index tối ưu query phổ biến
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_sport_id ON news(sport_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_resource_type ON approvals(resource_type);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_leagues_sport_id ON leagues(sport_id);
CREATE INDEX IF NOT EXISTS idx_clubs_sport_id ON clubs(sport_id);
