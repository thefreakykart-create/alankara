-- Coupon / discount codes
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT        UNIQUE NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value           INTEGER     NOT NULL,          -- percent (0-100) or paise
  min_order_amount INTEGER    DEFAULT 0,         -- paise
  max_uses        INTEGER,                       -- NULL = unlimited
  used_count      INTEGER     DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON coupons USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Site-wide key/value settings
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT    PRIMARY KEY,
  value      JSONB   NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON site_settings USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Default settings rows
INSERT INTO site_settings (key, value) VALUES
  ('store', '{"name":"Alankara","tagline":"Where Heritage Meets Home","email":"","phone":"","address":"","instagram":"","facebook":"","twitter":""}'),
  ('announcement', '{"text":"","link":"","is_active":false,"bg_color":"#1a1a1a","text_color":"#ffffff"}')
ON CONFLICT (key) DO NOTHING;
