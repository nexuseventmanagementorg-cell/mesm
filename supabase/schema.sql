-- ============================================================================
-- MEEMS GEMS JEWELLERY DATABASE SCHEMA & POLICIES (SUPABASE / POSTGRESQL)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'MEEMS GEMS',
  tagline TEXT NOT NULL DEFAULT 'Handcrafted with Love. Designed to Shine.',
  supporting_copy TEXT NOT NULL,
  about_us TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '/images/meems-gems-logo.png',
  contact_email TEXT NOT NULL DEFAULT 'hello@meemsgems.com',
  whatsapp_number TEXT NOT NULL DEFAULT '03001234567',
  easypaisa_number TEXT NOT NULL DEFAULT '03001234567',
  easypaisa_title TEXT NOT NULL DEFAULT 'MEEMS GEMS',
  easypaisa_enabled BOOLEAN NOT NULL DEFAULT true,
  jazzcash_number TEXT NOT NULL DEFAULT '03001234567',
  jazzcash_title TEXT NOT NULL DEFAULT 'MEEMS GEMS',
  jazzcash_enabled BOOLEAN NOT NULL DEFAULT true,
  bank_details TEXT,
  bank_transfer_enabled BOOLEAN NOT NULL DEFAULT true,
  cash_on_delivery_enabled BOOLEAN DEFAULT true,
  default_currency TEXT DEFAULT 'PKR',
  flat_delivery_fee NUMERIC(10, 2) DEFAULT 250,
  free_delivery_threshold NUMERIC(10, 2) DEFAULT 3000,
  supported_cities JSONB DEFAULT '["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"]',
  business_hours TEXT DEFAULT 'Mon - Sat: 11:00 AM - 9:00 PM',
  processing_time TEXT DEFAULT '1-2 Business Days',
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  announcement_text TEXT DEFAULT '✨ Free Delivery on orders above PKR 3,000!',
  announcement_enabled BOOLEAN DEFAULT true,
  bestseller_min_orders INT DEFAULT 2,
  policies JSONB DEFAULT '{"returns": "", "shipping": "", "privacy": "", "terms": ""}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_published ON categories(is_published);

-- Public storefront media; uploads are performed server-side with the service role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meems-gems-media',
  'meems-gems-media',
  true,
  52428800,
  ARRAY['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read MEEMS GEMS media" ON storage.objects;
CREATE POLICY "Public read MEEMS GEMS media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'meems-gems-media');

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
  tags JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  video_url TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'PKR',
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 3,
  allow_backorders BOOLEAN DEFAULT false,
  variations JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '[]',
  order_count INT DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_order_count ON products(order_count DESC);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_city TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  gift_message TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'awaiting_verification', 'paid', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('easypaisa', 'jazzcash', 'cod', 'bank_transfer')),
  payment_proof_url TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_product ON reviews(is_approved, product_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read store settings
CREATE POLICY "Public read store settings" ON store_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Public can read published categories
CREATE POLICY "Public read published categories" ON categories
  FOR SELECT TO anon, authenticated USING (is_published = true);

-- Public can read published products only
CREATE POLICY "Public read published products" ON products
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "Public create orders" ON orders;

-- Public can read verified reviews
CREATE POLICY "Public read approved reviews" ON reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);

-- Full access for service role / administrators
CREATE POLICY "Service role full access settings" ON store_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access categories" ON categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access products" ON products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access reviews" ON reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
