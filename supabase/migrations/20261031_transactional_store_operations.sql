CREATE OR REPLACE FUNCTION public.create_order_with_inventory(
  p_order JSONB,
  p_inventory JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item JSONB;
  v_product_id TEXT;
  v_quantity INTEGER;
  v_expected_price NUMERIC(10, 2);
  v_order public.orders%ROWTYPE;
BEGIN
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_inventory)
    ORDER BY value ->> 'product_id'
  LOOP
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::INTEGER;
    v_expected_price := (v_item ->> 'expected_price')::NUMERIC(10, 2);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Order quantity must be positive';
    END IF;

    UPDATE public.products
    SET
      stock_quantity = CASE
        WHEN track_inventory AND NOT allow_backorders
        THEN stock_quantity - v_quantity
        ELSE stock_quantity
      END,
      order_count = CASE
        WHEN track_inventory AND NOT allow_backorders
        THEN order_count + v_quantity
        ELSE order_count
      END,
      updated_at = NOW()
    WHERE id = v_product_id
      AND status = 'published'
      AND price = v_expected_price
      AND (
        NOT track_inventory
        OR allow_backorders
        OR stock_quantity >= v_quantity
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Product % is unavailable, out of stock, or its price changed',
        v_product_id;
    END IF;
  END LOOP;

  INSERT INTO public.orders
  SELECT (jsonb_populate_record(NULL::public.orders, p_order)).*
  RETURNING * INTO v_order;

  RETURN to_jsonb(v_order);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_status_with_inventory(
  p_order_id TEXT,
  p_new_status TEXT,
  p_notes TEXT,
  p_event JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item JSONB;
  v_product_id TEXT;
  v_quantity INTEGER;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.order_status = p_new_status THEN
    RETURN to_jsonb(v_order);
  END IF;

  IF v_order.order_status = 'cancelled' AND p_new_status <> 'cancelled' THEN
    FOR v_item IN
      SELECT value
      FROM jsonb_array_elements(v_order.items)
      ORDER BY value ->> 'productId'
    LOOP
      v_product_id := v_item ->> 'productId';
      v_quantity := (v_item ->> 'quantity')::INTEGER;

      UPDATE public.products
      SET
        stock_quantity = stock_quantity - v_quantity,
        order_count = order_count + v_quantity,
        updated_at = NOW()
      WHERE id = v_product_id
        AND track_inventory
        AND NOT allow_backorders
        AND stock_quantity >= v_quantity;

      IF NOT FOUND AND EXISTS (
        SELECT 1 FROM public.products
        WHERE id = v_product_id AND track_inventory AND NOT allow_backorders
      ) THEN
        RAISE EXCEPTION 'Insufficient stock to reopen order %', p_order_id;
      END IF;
    END LOOP;
  ELSIF v_order.order_status <> 'cancelled' AND p_new_status = 'cancelled' THEN
    FOR v_item IN
      SELECT value
      FROM jsonb_array_elements(v_order.items)
      ORDER BY value ->> 'productId'
    LOOP
      v_product_id := v_item ->> 'productId';
      v_quantity := (v_item ->> 'quantity')::INTEGER;

      UPDATE public.products
      SET
        stock_quantity = stock_quantity + v_quantity,
        order_count = GREATEST(0, order_count - v_quantity),
        updated_at = NOW()
      WHERE id = v_product_id
        AND track_inventory
        AND NOT allow_backorders;
    END LOOP;
  END IF;

  UPDATE public.orders
  SET
    order_status = p_new_status,
    updated_at = NOW(),
    admin_notes = CASE
      WHEN p_notes IS NULL OR p_notes = '' THEN admin_notes
      WHEN admin_notes IS NULL OR admin_notes = '' THEN p_notes
      ELSE admin_notes || E'\n' || p_notes
    END,
    timeline = COALESCE(timeline, '[]'::JSONB) || jsonb_build_array(p_event)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN to_jsonb(v_order);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_payment_status(
  p_order_id TEXT,
  p_new_status TEXT,
  p_notes TEXT,
  p_event JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  UPDATE public.orders
  SET
    payment_status = p_new_status,
    updated_at = NOW(),
    admin_notes = CASE
      WHEN p_notes IS NULL OR p_notes = '' THEN admin_notes
      WHEN admin_notes IS NULL OR admin_notes = '' THEN p_notes
      ELSE admin_notes || E'\n' || p_notes
    END,
    timeline = COALESCE(timeline, '[]'::JSONB) || jsonb_build_array(p_event)
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  RETURN to_jsonb(v_order);
END;
$$;

CREATE OR REPLACE FUNCTION public.import_local_catalog_if_empty(
  p_categories JSONB,
  p_products JSONB,
  p_settings JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_category JSONB;
  v_category_count INTEGER;
  v_inserted_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_category_count FROM public.categories;
  IF v_category_count <> jsonb_array_length(p_categories) THEN
    RAISE EXCEPTION 'Category count changed; refusing local catalog import';
  END IF;

  IF EXISTS (SELECT 1 FROM public.products)
    OR EXISTS (SELECT 1 FROM public.store_settings)
    OR EXISTS (SELECT 1 FROM public.orders)
    OR EXISTS (SELECT 1 FROM public.reviews) THEN
    RAISE EXCEPTION 'Production records exist; refusing local catalog import';
  END IF;

  FOR v_category IN SELECT value FROM jsonb_array_elements(p_categories)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.categories
      WHERE id = v_category ->> 'id'
        AND slug = v_category ->> 'slug'
        AND name = v_category ->> 'name'
        AND COALESCE(description, '') = COALESCE(v_category ->> 'description', '')
        AND sort_order = COALESCE((v_category ->> 'sort_order')::INTEGER, 0)
        AND is_published = COALESCE((v_category ->> 'is_published')::BOOLEAN, TRUE)
        AND (
          image_url IS NULL
          OR image_url = v_category ->> 'source_image_url'
          OR image_url = v_category ->> 'image_url'
        )
    ) THEN
      RAISE EXCEPTION
        'Category % differs from the local snapshot; refusing import',
        v_category ->> 'id';
    END IF;

    UPDATE public.categories
    SET image_url = NULLIF(v_category ->> 'image_url', '')
    WHERE id = v_category ->> 'id';
  END LOOP;

  INSERT INTO public.products
  SELECT *
  FROM jsonb_populate_recordset(NULL::public.products, p_products);
  GET DIAGNOSTICS v_inserted_products = ROW_COUNT;

  INSERT INTO public.store_settings
  SELECT (jsonb_populate_record(NULL::public.store_settings, p_settings)).*;

  RETURN jsonb_build_object(
    'categories', v_category_count,
    'products', v_inserted_products,
    'settings', 1
  );
END;
$$;

DROP POLICY IF EXISTS "Public create orders" ON public.orders;

REVOKE ALL ON FUNCTION public.create_order_with_inventory(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_order_status_with_inventory(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_order_payment_status(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.import_local_catalog_if_empty(JSONB, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_inventory(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_status_with_inventory(TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_payment_status(TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_local_catalog_if_empty(JSONB, JSONB, JSONB) TO service_role;
