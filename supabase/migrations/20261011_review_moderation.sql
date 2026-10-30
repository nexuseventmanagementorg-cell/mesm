ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reviews_approved_product
  ON reviews(is_approved, product_id);

DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Public read approved reviews" ON reviews;

CREATE POLICY "Public read approved reviews" ON reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);
