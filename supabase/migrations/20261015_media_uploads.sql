ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS video_url TEXT;

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
