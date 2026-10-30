UPDATE store_settings
SET
  tagline = CASE
    WHEN tagline = 'Handcrafted with Love. Designed to Shine.'
    THEN 'Modern & Traditional. Chosen to Shine.'
    ELSE tagline
  END,
  supporting_copy = CASE
    WHEN supporting_copy LIKE '%crafted to help you shine in your own way%'
    THEN 'Discover a carefully selected collection of modern and traditional jewellery. From everyday favourites to statement pieces, find styles that reflect you and help you shine.'
    ELSE supporting_copy
  END,
  about_us = CASE
    WHEN about_us LIKE '%beauty of handmade jewellery%'
    THEN 'MEEMS GEMS brings together modern and traditional jewellery, thoughtfully selected for women who love expressing their personal style. Explore everyday favourites, elegant occasion wear, and eye-catching statement pieces, all in one place. Whether you are choosing a little something for yourself or a thoughtful gift, find a style to make every moment shine.'
    ELSE about_us
  END,
  processing_time = CASE
    WHEN processing_time LIKE '%Custom handmade orders%'
    THEN '1-2 Business Days'
    ELSE processing_time
  END,
  announcement_text = CASE
    WHEN announcement_text LIKE '%Handcrafted with Love%'
    THEN '✨ Free Delivery on jewellery orders above PKR 3,000!'
    ELSE announcement_text
  END,
  policies = jsonb_set(
    COALESCE(policies, '{}'::jsonb),
    '{returns}',
    CASE
      WHEN policies ->> 'returns' LIKE 'Because each item is crafted with delicate care%'
      THEN to_jsonb('Returns are accepted within 3 days of delivery only if an item is received damaged or incorrect. Please inspect your order on arrival and contact our WhatsApp support with your unboxing video.'::text)
      ELSE COALESCE(policies -> 'returns', '""'::jsonb)
    END
  )
WHERE tagline = 'Handcrafted with Love. Designed to Shine.'
  OR supporting_copy LIKE '%crafted to help you shine in your own way%'
  OR about_us LIKE '%beauty of handmade jewellery%'
  OR processing_time LIKE '%Custom handmade orders%'
  OR announcement_text LIKE '%Handcrafted with Love%'
  OR policies ->> 'returns' LIKE 'Because each item is crafted with delicate care%';

UPDATE categories
SET
  name = 'Hair & Fashion Accessories',
  description = 'Browse stylish hair accessories, brooches, and everyday finishing touches.'
WHERE slug = 'handmade-accessories'
  AND name = 'Handmade Accessories';

UPDATE products
SET
  description = 'A teardrop resin pendant featuring dried miniature flowers and warm gold-tone accents, paired with a delicate chain for an elegant everyday look.',
  tags = COALESCE(
    (
      SELECT jsonb_agg(existing_tags.value)
      FROM jsonb_array_elements_text(products.tags) AS existing_tags(value)
      WHERE existing_tags.value !~* 'handmade|handcrafted'
    ),
    '[]'::jsonb
  )
WHERE slug = 'botanical-resin-wildflower-necklace'
  AND description LIKE 'Handcrafted with genuine dried miniature wildflowers%';

UPDATE products
SET
  name = 'Terrazzo Resin Hair Claw Clip',
  description = 'A coffee-and-cream terrazzo hair claw with a secure spring clasp, designed to hold thick, wavy, or long hair comfortably.'
WHERE slug = 'retro-terrazzo-pastel-hair-claw-clip'
  AND (
    name = 'Artisan Terrazzo Resin Hair Claw Clip'
    OR description LIKE '%artisan hair claws are crafted%'
  );
