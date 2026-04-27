-- Product Groups: link canvas / acrylic / wooden products under one design
CREATE TABLE IF NOT EXISTS product_groups (
  id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add group & frame_type to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS group_id   uuid REFERENCES product_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frame_type text CHECK (frame_type IN ('canvas', 'acrylic', 'wooden'));

CREATE INDEX IF NOT EXISTS products_group_id_idx ON products(group_id);

-- RLS: admins can do anything via service role (no client-side RLS needed)
