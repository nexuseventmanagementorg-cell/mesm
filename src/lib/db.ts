import fs from "fs";
import path from "path";
import {
  Product,
  Category,
  Order,
  OrderItem,
  OrderTimelineEvent,
  StoreSettings,
  Review,
  OrderStatus,
  PaymentStatus,
  SalesAnalyticsSummary,
} from "@/types";
import {
  initialCategories,
  initialSettings,
} from "./initialData";
import {
  isSupabaseConfigured as hasSupabaseConfiguration,
  getSupabaseServer,
} from "./supabase";
import {
  areVariationSelectionsAvailable,
  hasAvailableVariantSelection,
} from "./variation-availability.mjs";
import {
  getCustomerOrderConfirmation as projectCustomerOrderConfirmation,
  persistCustomerAccessHashInTimeline,
  recoverCustomerAccessHashFromTimeline,
} from "./customer-order-access.mjs";
import { isPersistedOrderResponse } from "./order-rpc-response.mjs";

interface StoreData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "store.json");

const isSupabaseConfigured = () =>
  process.env.NODE_ENV === "production" && hasSupabaseConfiguration();

function getLocalStore(): StoreData {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Local JSON storage is disabled in production. Configure Supabase Postgres and server credentials."
    );
  }
  return ensureDataFile();
}

function getRequiredSupabase() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error(
      "Supabase is configured without server access. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY."
    );
  }
  return supabase;
}

function mapCategoryRow(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    videoUrl: typeof row.video_url === "string" ? row.video_url : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapProductRow(row: Record<string, unknown>): Product {
  const category = row.categories as { name?: unknown } | null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    sku: String(row.sku),
    shortDescription: String(row.short_description ?? ""),
    description: String(row.description ?? ""),
    categoryId: String(row.category_id ?? ""),
    categoryName: typeof category?.name === "string" ? category.name : undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    status: String(row.status ?? "draft") as Product["status"],
    isFeatured: Boolean(row.is_featured),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    videoUrl: typeof row.video_url === "string" ? row.video_url : undefined,
    price: Number(row.price ?? 0),
    compareAtPrice:
      row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    costPrice: row.cost_price == null ? undefined : Number(row.cost_price),
    currency: "PKR",
    trackInventory: Boolean(row.track_inventory ?? true),
    stockQuantity: Number(row.stock_quantity ?? 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 3),
    allowBackorders: Boolean(row.allow_backorders),
    variations: Array.isArray(row.variations)
      ? row.variations as Product["variations"]
      : [],
    attributes: Array.isArray(row.attributes)
      ? row.attributes as Product["attributes"]
      : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    orderCount: Number(row.order_count ?? 0),
    rating: row.rating == null ? undefined : Number(row.rating),
    reviewCount: row.review_count == null ? undefined : Number(row.review_count),
  };
}

function mapProductToRow(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    short_description: product.shortDescription,
    description: product.description,
    category_id: product.categoryId || null,
    tags: product.tags,
    status: product.status,
    is_featured: product.isFeatured,
    images: product.images,
    video_url: product.videoUrl || null,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    cost_price: product.costPrice ?? null,
    currency: product.currency,
    track_inventory: product.trackInventory,
    stock_quantity: product.stockQuantity,
    low_stock_threshold: product.lowStockThreshold,
    allow_backorders: product.allowBackorders,
    variations: product.variations,
    attributes: product.attributes,
    order_count: product.orderCount ?? 0,
    rating: product.rating ?? 5,
    review_count: product.reviewCount ?? 0,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

function mapOrderRow(row: Record<string, unknown>): Order {
  const { timeline, tokenHash } = recoverCustomerAccessHashFromTimeline(row.timeline);
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerEmail: typeof row.customer_email === "string" ? row.customer_email : undefined,
    customerCity: String(row.customer_city),
    deliveryAddress: String(row.delivery_address),
    deliveryInstructions:
      typeof row.delivery_instructions === "string" ? row.delivery_instructions : undefined,
    giftMessage: typeof row.gift_message === "string" ? row.gift_message : undefined,
    items: Array.isArray(row.items) ? row.items as OrderItem[] : [],
    subtotal: Number(row.subtotal ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),
    orderStatus: String(row.order_status ?? "pending") as Order["orderStatus"],
    paymentStatus: String(row.payment_status ?? "unpaid") as Order["paymentStatus"],
    paymentMethod: String(row.payment_method) as Order["paymentMethod"],
    paymentProofUrl:
      typeof row.payment_proof_url === "string" ? row.payment_proof_url : undefined,
    customerAccessTokenHash: tokenHash,
    adminNotes: typeof row.admin_notes === "string" ? row.admin_notes : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    timeline,
  };
}

function mapOrderToRow(order: Order) {
  const timeline = order.customerAccessTokenHash
    ? persistCustomerAccessHashInTimeline(
        order.timeline,
        order.customerAccessTokenHash
      )
    : order.timeline;

  return {
    id: order.id,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail ?? null,
    customer_city: order.customerCity,
    delivery_address: order.deliveryAddress,
    delivery_instructions: order.deliveryInstructions ?? null,
    gift_message: order.giftMessage ?? null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
    order_status: order.orderStatus,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    payment_proof_url: order.paymentProofUrl ?? null,
    admin_notes: order.adminNotes ?? null,
    timeline,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

function mapStoreSettingsRow(row: Record<string, unknown>): StoreSettings {
  return {
    ...initialSettings,
    id: String(row.id ?? "default"),
    storeName: String(row.store_name ?? initialSettings.storeName),
    tagline: String(row.tagline ?? initialSettings.tagline),
    supportingCopy: String(row.supporting_copy ?? initialSettings.supportingCopy),
    aboutUs: String(row.about_us ?? initialSettings.aboutUs),
    logoUrl: String(row.logo_url ?? initialSettings.logoUrl),
    contactEmail: String(row.contact_email ?? initialSettings.contactEmail),
    whatsappNumber: String(row.whatsapp_number ?? initialSettings.whatsappNumber),
    easypaisaNumber: String(row.easypaisa_number ?? initialSettings.easypaisaNumber),
    easypaisaTitle: String(row.easypaisa_title ?? initialSettings.easypaisaTitle),
    easypaisaEnabled: Boolean(row.easypaisa_enabled ?? initialSettings.easypaisaEnabled),
    jazzcashNumber: String(row.jazzcash_number ?? initialSettings.jazzcashNumber),
    jazzcashTitle: String(row.jazzcash_title ?? initialSettings.jazzcashTitle),
    jazzcashEnabled: Boolean(row.jazzcash_enabled ?? initialSettings.jazzcashEnabled),
    bankDetails: String(row.bank_details ?? initialSettings.bankDetails),
    bankTransferEnabled: Boolean(row.bank_transfer_enabled ?? initialSettings.bankTransferEnabled),
    cashOnDeliveryEnabled: Boolean(row.cash_on_delivery_enabled ?? initialSettings.cashOnDeliveryEnabled),
    defaultCurrency: "PKR",
    flatDeliveryFee: Number(row.flat_delivery_fee ?? initialSettings.flatDeliveryFee),
    freeDeliveryThreshold: Number(row.free_delivery_threshold ?? initialSettings.freeDeliveryThreshold),
    supportedCities: Array.isArray(row.supported_cities)
      ? row.supported_cities as string[]
      : initialSettings.supportedCities,
    businessHours: String(row.business_hours ?? initialSettings.businessHours),
    processingTime: String(row.processing_time ?? initialSettings.processingTime),
    instagramUrl: String(row.instagram_url ?? ""),
    facebookUrl: String(row.facebook_url ?? ""),
    tiktokUrl: String(row.tiktok_url ?? ""),
    announcementText: String(row.announcement_text ?? initialSettings.announcementText),
    announcementEnabled: Boolean(row.announcement_enabled ?? initialSettings.announcementEnabled),
    bestsellerMinOrders: Number(row.bestseller_min_orders ?? initialSettings.bestsellerMinOrders),
    policies:
      row.policies && typeof row.policies === "object"
        ? { ...initialSettings.policies, ...row.policies as StoreSettings["policies"] }
        : initialSettings.policies,
  };
}

function mapStoreSettingsToRow(settings: StoreSettings) {
  return {
    id: settings.id || "default",
    store_name: settings.storeName,
    tagline: settings.tagline,
    supporting_copy: settings.supportingCopy,
    about_us: settings.aboutUs,
    logo_url: settings.logoUrl,
    contact_email: settings.contactEmail,
    whatsapp_number: settings.whatsappNumber,
    easypaisa_number: settings.easypaisaNumber,
    easypaisa_title: settings.easypaisaTitle,
    easypaisa_enabled: settings.easypaisaEnabled,
    jazzcash_number: settings.jazzcashNumber,
    jazzcash_title: settings.jazzcashTitle,
    jazzcash_enabled: settings.jazzcashEnabled,
    bank_details: settings.bankDetails,
    bank_transfer_enabled: settings.bankTransferEnabled,
    cash_on_delivery_enabled: settings.cashOnDeliveryEnabled,
    default_currency: settings.defaultCurrency,
    flat_delivery_fee: settings.flatDeliveryFee,
    free_delivery_threshold: settings.freeDeliveryThreshold,
    supported_cities: settings.supportedCities,
    business_hours: settings.businessHours,
    processing_time: settings.processingTime,
    instagram_url: settings.instagramUrl || null,
    facebook_url: settings.facebookUrl || null,
    tiktok_url: settings.tiktokUrl || null,
    announcement_text: settings.announcementText,
    announcement_enabled: settings.announcementEnabled,
    bestseller_min_orders: settings.bestsellerMinOrders,
    policies: settings.policies,
    updated_at: new Date().toISOString(),
  };
}

function ensureDataFile(): StoreData {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Local JSON storage is disabled in production.");
    }
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE_PATH)) {
      const initialStore: StoreData = {
        settings: initialSettings,
        categories: initialCategories,
        products: [],
        orders: [],
        reviews: [],
      };
      saveDataToFile(initialStore);
      return initialStore;
    }

    const stored = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8")) as Partial<StoreData>;
    if (!stored || !Array.isArray(stored.products) || !Array.isArray(stored.categories)) {
      throw new Error("Store data must contain product and category lists.");
    }

    return {
      settings: {
        ...initialSettings,
        ...stored.settings,
        easypaisaEnabled:
          stored.settings?.easypaisaEnabled ?? initialSettings.easypaisaEnabled,
        jazzcashEnabled:
          stored.settings?.jazzcashEnabled ?? initialSettings.jazzcashEnabled,
        bankTransferEnabled:
          stored.settings?.bankTransferEnabled ?? initialSettings.bankTransferEnabled,
      },
      categories: stored.categories,
      products: stored.products,
      orders: Array.isArray(stored.orders) ? stored.orders : [],
      reviews: Array.isArray(stored.reviews) ? stored.reviews : [],
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to load local store data: ${detail}`);
  }
}

function saveDataToFile(data: StoreData) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to persist local store data: ${detail}`);
  }
}

/* ==========================================================================
   SETTINGS
   ========================================================================== */

export async function getStoreSettings(): Promise<StoreSettings> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("store_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) {
      throw new Error(`Unable to load store settings from Supabase: ${error.message}`);
    }
    return data ? mapStoreSettingsRow(data) : { ...initialSettings, id: "default" };
  }

  const store = getLocalStore();
  return store.settings;
}

export async function updateStoreSettings(
  updated: Partial<StoreSettings>
): Promise<StoreSettings> {
  if (isSupabaseConfigured()) {
    const settings = { ...(await getStoreSettings()), ...updated };
    const { data, error } = await getRequiredSupabase()
      .from("store_settings")
      .upsert(mapStoreSettingsToRow(settings), { onConflict: "id" })
      .select("*")
      .single();
    if (error) {
      throw new Error(`Unable to save store settings: ${error.message}`);
    }
    return mapStoreSettingsRow(data);
  }

  const store = getLocalStore();
  store.settings = { ...store.settings, ...updated };
  saveDataToFile(store);
  return store.settings;
}

/* ==========================================================================
   CATEGORIES
   ========================================================================== */

export async function getCategories(
  includeUnpublished = false
): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    let query = getRequiredSupabase()
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!includeUnpublished) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Unable to load categories from Supabase: ${error.message}`);
    }
    return (data || []).map(mapCategoryRow);
  }

  const store = getLocalStore();
  let list = store.categories;
  if (!includeUnpublished) {
    list = list.filter((c) => c.isPublished);
  }
  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const categories = await getCategories(true);
  return categories.find((c) => c.slug === slug) || null;
}

export async function saveCategory(
  category: Partial<Category> & { name: string; slug: string }
): Promise<Category> {
  if (isSupabaseConfigured()) {
    const existing = category.id
      ? (await getCategories(true)).find((item) => item.id === category.id)
      : undefined;
    const savedCategory: Category = {
      id: category.id || `cat-${Date.now()}`,
      name: category.name,
      slug: category.slug,
      description: category.description ?? existing?.description ?? "",
      imageUrl: category.imageUrl ?? existing?.imageUrl,
      videoUrl: category.videoUrl ?? existing?.videoUrl,
      sortOrder: category.sortOrder ?? existing?.sortOrder ?? (await getCategories(true)).length + 1,
      isPublished: category.isPublished ?? existing?.isPublished ?? true,
      createdAt: category.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    };
    const { error } = await getRequiredSupabase()
      .from("categories")
      .upsert({
        id: savedCategory.id,
        slug: savedCategory.slug,
        name: savedCategory.name,
        description: savedCategory.description,
        image_url: savedCategory.imageUrl ?? null,
        video_url: savedCategory.videoUrl ?? null,
        sort_order: savedCategory.sortOrder,
        is_published: savedCategory.isPublished,
        created_at: savedCategory.createdAt,
      }, { onConflict: "id" });
    if (error) {
      throw new Error(`Unable to save category: ${error.message}`);
    }
    return savedCategory;
  }

  const store = getLocalStore();
  let savedCategory: Category;

  if (category.id) {
    const index = store.categories.findIndex((c) => c.id === category.id);
    if (index !== -1) {
      savedCategory = {
        ...store.categories[index],
        ...category,
      };
      store.categories[index] = savedCategory;
    } else {
      savedCategory = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl,
        videoUrl: category.videoUrl,
        sortOrder: category.sortOrder || store.categories.length + 1,
        isPublished: category.isPublished ?? true,
        createdAt: new Date().toISOString(),
      };
      store.categories.push(savedCategory);
    }
  } else {
    savedCategory = {
      id: `cat-${Date.now()}`,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.imageUrl,
      videoUrl: category.videoUrl,
      sortOrder: category.sortOrder || store.categories.length + 1,
      isPublished: category.isPublished ?? true,
      createdAt: new Date().toISOString(),
    };
    store.categories.push(savedCategory);
  }

  saveDataToFile(store);
  return savedCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getRequiredSupabase();
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .limit(1);
    if (productError) {
      throw new Error(`Unable to check category products: ${productError.message}`);
    }
    if (products?.length) {
      throw new Error("Cannot delete category because products are assigned to it.");
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      throw new Error(`Unable to delete category: ${error.message}`);
    }
    return true;
  }

  const store = getLocalStore();
  // Check if any product is using this category
  const hasProducts = store.products.some((p) => p.categoryId === id);
  if (hasProducts) {
    throw new Error("Cannot delete category because active products are assigned to it.");
  }

  store.categories = store.categories.filter((c) => c.id !== id);
  saveDataToFile(store);

  return true;
}

/* ==========================================================================
   PRODUCTS
   ========================================================================== */

export interface GetProductsParams {
  categorySlug?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  giftSuitableOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc" | "popularity";
  page?: number;
  limit?: number;
  includePrivateFields?: boolean;
}

export async function getProductCountsByCategory(
  status: "all" | "published" = "published"
): Promise<Record<string, number>> {
  if (isSupabaseConfigured()) {
    let query = getRequiredSupabase().from("products").select("category_id,status");
    if (status !== "all") query = query.eq("status", "published");
    const { data, error } = await query;
    if (error) {
      throw new Error(`Unable to load product counts: ${error.message}`);
    }
    return (data || []).reduce<Record<string, number>>((counts, row) => {
      if (row.category_id) {
        counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      }
      return counts;
    }, {});
  }

  const store = getLocalStore();
  const counts: Record<string, number> = {};

  for (const product of store.products) {
    if (status === "all" || product.status === "published") {
      counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
    }
  }

  return counts;
}

export async function getPublishedProductCountsByCategory(): Promise<
  Record<string, number>
> {
  return getProductCountsByCategory("published");
}

export async function getProducts(params: GetProductsParams = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const store = isSupabaseConfigured()
    ? await (async () => {
        const supabase = getRequiredSupabase();
        const [categoryResult, productResult] = await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .order("sort_order", { ascending: true }),
          supabase.from("products").select("*, categories(name)"),
        ]);
        if (categoryResult.error) {
          throw new Error(
            `Unable to load categories from Supabase: ${categoryResult.error.message}`
          );
        }
        if (productResult.error) {
          throw new Error(
            `Unable to load products from Supabase: ${productResult.error.message}`
          );
        }
        return {
          settings: initialSettings,
          categories: (categoryResult.data || []).map(mapCategoryRow),
          products: (productResult.data || []).map((row) => mapProductRow(row)),
          orders: [],
          reviews: [],
        };
      })()
    : getLocalStore();
  let list = [...store.products];

  // Map categoryName if missing
  const catMap = new Map(store.categories.map((c) => [c.id, c.name]));
  list = list.map((p) => ({
    ...p,
    categoryName: p.categoryName || catMap.get(p.categoryId) || "Jewellery",
  }));

  // Filter by status (default to published for public unless specified)
  if (params.status) {
    if (params.status !== "all") {
      list = list.filter((p) => p.status === params.status);
    }
  } else {
    list = list.filter((p) => p.status === "published");
  }

  // Filter by category
  if (params.categorySlug && params.categorySlug !== "all") {
    const targetCat = store.categories.find((c) => c.slug === params.categorySlug);
    if (targetCat) {
      list = list.filter((p) => p.categoryId === targetCat.id);
    }
  } else if (params.categoryId && params.categoryId !== "all") {
    list = list.filter((p) => p.categoryId === params.categoryId);
  }

  // Search by name, SKU, tags, description
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (params.giftSuitableOnly) {
    list = list.filter((product) =>
      product.tags.some((tag) =>
        tag.replace(/^#+/, "").toLowerCase().includes("giftforher")
      )
    );
  }

  // Price range filter
  if (params.minPrice !== undefined && params.minPrice > 0) {
    list = list.filter((p) => p.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined && params.maxPrice > 0) {
    list = list.filter((p) => p.price <= params.maxPrice!);
  }

  // Availability filter
  if (params.inStockOnly) {
    list = list.filter(
      (p) =>
        (!p.trackInventory || p.stockQuantity > 0 || p.allowBackorders) &&
        hasAvailableVariantSelection(p.variations)
    );
  }

  // Featured only
  if (params.featuredOnly) {
    list = list.filter((p) => p.isFeatured);
  }

  // Sort
  if (params.sortBy === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (params.sortBy === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (params.sortBy === "popularity") {
    list.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
  } else {
    // default newest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = list.length;
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 12);
  const totalPages = Math.ceil(total / limit) || 1;

  const paginated = list.slice((page - 1) * limit, page * limit);

  return {
    products: params.includePrivateFields
      ? paginated
      : paginated.map((product) => ({ ...product, costPrice: undefined })),
    total,
    page,
    totalPages,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("products")
      .select("*, categories(name)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      throw new Error(`Unable to load product: ${error.message}`);
    }
    return data ? { ...mapProductRow(data), costPrice: undefined } : null;
  }

  const store = getLocalStore();
  const product = store.products.find((p) => p.slug === slug);
  if (!product || product.status !== "published") return null;

  const category = store.categories.find((c) => c.id === product.categoryId);
  return {
    ...product,
    costPrice: undefined,
    categoryName: category?.name || product.categoryName || "Jewellery",
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw new Error(`Unable to load product: ${error.message}`);
    }
    return data ? mapProductRow(data) : null;
  }

  const store = getLocalStore();
  const product = store.products.find((p) => p.id === id);
  if (!product) return null;

  const category = store.categories.find((c) => c.id === product.categoryId);
  return {
    ...product,
    categoryName: category?.name || product.categoryName || "Jewellery",
  };
}

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured()) {
    const supabase = getRequiredSupabase();
    const now = new Date().toISOString();
    let existing: Product | undefined;
    if (productData.id) {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", productData.id)
        .maybeSingle();
      if (error) {
        throw new Error(`Unable to load product before saving: ${error.message}`);
      }
      if (data) existing = mapProductRow(data);
    }

    const categories = await getCategories(true);
    const categoryId =
      productData.categoryId || existing?.categoryId || categories[0]?.id || "";
    const categoryName = categories.find((category) => category.id === categoryId)?.name;
    const saved: Product = {
      id: productData.id || `prod-${Date.now()}`,
      slug: productData.slug || existing?.slug || `product-${Date.now()}`,
      name: productData.name || existing?.name || "New Jewellery Item",
      sku: productData.sku || existing?.sku || `MG-${Date.now().toString().slice(-4)}`,
      shortDescription: productData.shortDescription ?? existing?.shortDescription ?? "",
      description: productData.description ?? existing?.description ?? "",
      categoryId,
      categoryName: productData.categoryName || categoryName || existing?.categoryName,
      tags: productData.tags ?? existing?.tags ?? [],
      status: productData.status || existing?.status || "published",
      isFeatured: productData.isFeatured ?? existing?.isFeatured ?? false,
      images: productData.images ?? existing?.images ?? [],
      videoUrl: productData.videoUrl ?? existing?.videoUrl,
      price: Number(productData.price ?? existing?.price) || 0,
      compareAtPrice:
        productData.compareAtPrice ?? existing?.compareAtPrice,
      costPrice: productData.costPrice ?? existing?.costPrice,
      currency: "PKR",
      trackInventory: productData.trackInventory ?? existing?.trackInventory ?? true,
      stockQuantity: Number(productData.stockQuantity ?? existing?.stockQuantity) || 0,
      lowStockThreshold:
        Number(productData.lowStockThreshold ?? existing?.lowStockThreshold) || 3,
      allowBackorders:
        productData.allowBackorders ?? existing?.allowBackorders ?? false,
      variations: productData.variations ?? existing?.variations ?? [],
      attributes: productData.attributes ?? existing?.attributes ?? [],
      createdAt: productData.createdAt || existing?.createdAt || now,
      updatedAt: now,
      orderCount: productData.orderCount ?? existing?.orderCount ?? 0,
      rating: productData.rating ?? existing?.rating ?? 5,
      reviewCount: productData.reviewCount ?? existing?.reviewCount ?? 0,
    };
    const { data, error } = await supabase
      .from("products")
      .upsert(mapProductToRow(saved), { onConflict: "id" })
      .select("*, categories(name)")
      .single();
    if (error) {
      throw new Error(`Unable to save product: ${error.message}`);
    }
    return mapProductRow(data);
  }

  const store = getLocalStore();
  const now = new Date().toISOString();
  let saved: Product;

  if (productData.id) {
    const idx = store.products.findIndex((p) => p.id === productData.id);
    if (idx !== -1) {
      saved = {
        ...store.products[idx],
        ...productData,
        updatedAt: now,
      } as Product;
      store.products[idx] = saved;
    } else {
      saved = {
        id: productData.id,
        slug: productData.slug || `prod-${Date.now()}`,
        name: productData.name || "Untitled Jewellery",
        sku: productData.sku || `MG-${Date.now().toString().slice(-4)}`,
        shortDescription: productData.shortDescription || "",
        description: productData.description || "",
        categoryId: productData.categoryId || store.categories[0]?.id || "cat-1",
        categoryName: productData.categoryName,
        tags: productData.tags || [],
        status: productData.status || "draft",
        isFeatured: productData.isFeatured || false,
        images: productData.images || [],
        videoUrl: productData.videoUrl,
        price: Number(productData.price) || 0,
        compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : undefined,
        costPrice: productData.costPrice ? Number(productData.costPrice) : undefined,
        currency: "PKR",
        trackInventory: productData.trackInventory ?? true,
        stockQuantity: Number(productData.stockQuantity) || 0,
        lowStockThreshold: Number(productData.lowStockThreshold) || 3,
        allowBackorders: Boolean(productData.allowBackorders),
        variations: productData.variations || [],
        attributes: productData.attributes || [],
        createdAt: productData.createdAt || now,
        updatedAt: now,
        orderCount: productData.orderCount || 0,
      };
      store.products.push(saved);
    }
  } else {
    saved = {
      id: `prod-${Date.now()}`,
      slug: productData.slug || `product-${Date.now()}`,
      name: productData.name || "New Jewellery Item",
      sku: productData.sku || `MG-${Date.now().toString().slice(-4)}`,
      shortDescription: productData.shortDescription || "",
      description: productData.description || "",
      categoryId: productData.categoryId || store.categories[0]?.id || "cat-1",
      categoryName: productData.categoryName,
      tags: productData.tags || [],
      status: productData.status || "published",
      isFeatured: productData.isFeatured || false,
      images: productData.images || [],
      videoUrl: productData.videoUrl,
      price: Number(productData.price) || 0,
      compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : undefined,
      costPrice: productData.costPrice ? Number(productData.costPrice) : undefined,
      currency: "PKR",
      trackInventory: productData.trackInventory ?? true,
      stockQuantity: Number(productData.stockQuantity) || 0,
      lowStockThreshold: Number(productData.lowStockThreshold) || 3,
      allowBackorders: Boolean(productData.allowBackorders),
      variations: productData.variations || [],
      attributes: productData.attributes || [],
      createdAt: now,
      updatedAt: now,
      orderCount: 0,
    };
    store.products.push(saved);
  }

  saveDataToFile(store);

  return saved;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      throw new Error(`Unable to delete product: ${error.message}`);
    }
    return Boolean(data?.length);
  }

  const store = getLocalStore();
  if (!store.products.some((product) => product.id === id)) {
    return false;
  }

  store.products = store.products.filter((p) => p.id !== id);
  saveDataToFile(store);

  return true;
}

/* ==========================================================================
   POPULAR PRODUCTS (Computed from real orders excluding cancelled)
   ========================================================================== */

export async function getPopularProducts(limit = 4): Promise<{
  product: Product;
  isBestseller: boolean;
  confirmedQuantity: number;
}[]> {
  const store = isSupabaseConfigured()
    ? {
        settings: await getStoreSettings(),
        products: await (async () => {
          const { data, error } = await getRequiredSupabase()
            .from("products")
            .select("*, categories(name)")
            .eq("status", "published");
          if (error) {
            throw new Error(`Unable to load popular products: ${error.message}`);
          }
          return (data || []).map((row) => mapProductRow(row));
        })(),
        orders: await (async () => {
          const { data, error } = await getRequiredSupabase()
            .from("orders")
            .select("*")
            .neq("order_status", "cancelled");
          if (error) {
            throw new Error(`Unable to load popular-product orders: ${error.message}`);
          }
          return (data || []).map((row) => mapOrderRow(row));
        })(),
      }
    : getLocalStore();
  const minThreshold = store.settings.bestsellerMinOrders || 2;

  // Aggregate quantities from non-cancelled orders
  const activeOrders = store.orders.filter((o) => o.orderStatus !== "cancelled");
  const salesMap = new Map<string, number>();

  for (const ord of activeOrders) {
    for (const item of ord.items) {
      const current = salesMap.get(item.productId) || 0;
      salesMap.set(item.productId, current + item.quantity);
    }
  }

  // Get all published products
  const published = store.products.filter((p) => p.status === "published");

  // Rank by actual order sales
  const ranked = published.map((p) => {
    const qty = salesMap.get(p.id) || 0;
    return {
      product: p,
      isBestseller: qty >= minThreshold,
      confirmedQuantity: qty,
    };
  });

  ranked.sort((a, b) => {
    if (b.confirmedQuantity !== a.confirmedQuantity) {
      return b.confirmedQuantity - a.confirmedQuantity;
    }
    // Fallback: featured products first, then newest
    if (b.product.isFeatured !== a.product.isFeatured) {
      return b.product.isFeatured ? 1 : -1;
    }
    return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime();
  });

  return ranked.slice(0, limit).map((entry) => ({
    ...entry,
    product: { ...entry.product, costPrice: undefined },
  }));
}

/* ==========================================================================
   ORDERS & INVENTORY POLICY
   ========================================================================== */

export interface GetOrdersParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getOrders(params: GetOrdersParams = {}): Promise<{
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}> {
  let list: Order[];
  if (isSupabaseConfigured()) {
    let query = getRequiredSupabase().from("orders").select("*");
    if (params.status && params.status !== "all") {
      query = query.eq("order_status", params.status);
    }
    if (params.paymentStatus && params.paymentStatus !== "all") {
      query = query.eq("payment_status", params.paymentStatus);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Unable to load orders: ${error.message}`);
    }
    list = (data || []).map((row) => mapOrderRow(row));
  } else {
    list = [...getLocalStore().orders];
  }

  if (params.status && params.status !== "all") {
    list = list.filter((o) => o.orderStatus === params.status);
  }

  if (params.paymentStatus && params.paymentStatus !== "all") {
    list = list.filter((o) => o.paymentStatus === params.paymentStatus);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerCity.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = list.length;
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 10);
  const totalPages = Math.ceil(total / limit) || 1;

  const paginated = list.slice((page - 1) * limit, page * limit);

  return {
    orders: paginated,
    total,
    page,
    totalPages,
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Unable to load order: ${error.message}`);
    return data ? mapOrderRow(data) : null;
  }
  return getLocalStore().orders.find((o) => o.id === id) || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw new Error(`Unable to load order: ${error.message}`);
    return data ? mapOrderRow(data) : null;
  }
  return getLocalStore().orders.find((o) => o.orderNumber === orderNumber) || null;
}

type CustomerOrderConfirmation = Omit<
  Pick<
    Order,
    | "id"
    | "orderNumber"
    | "createdAt"
    | "orderStatus"
    | "paymentStatus"
    | "paymentMethod"
    | "paymentProofUrl"
    | "customerName"
    | "customerPhone"
    | "customerCity"
    | "deliveryAddress"
    | "deliveryInstructions"
    | "giftMessage"
    | "items"
    | "subtotal"
    | "deliveryFee"
    | "discount"
    | "total"
  >,
  "items"
> & {
  items: Pick<
    OrderItem,
    | "productName"
    | "productImage"
    | "sku"
    | "variationText"
    | "quantity"
    | "unitPrice"
    | "lineTotal"
  >[];
};

export async function getCustomerOrderConfirmation(
  orderNumber: string,
  token: unknown
): Promise<CustomerOrderConfirmation | null> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return null;
  return projectCustomerOrderConfirmation(
    order,
    orderNumber,
    token
  ) as CustomerOrderConfirmation | null;
}

/**
 * Inventory Policy:
 * 1. Upon order placement, authoritative stock is checked and reserved (stockQuantity decremented).
 * 2. If an order is later Cancelled by the admin, reserved stock is automatically restored.
 * 3. Double-decrementing is strictly prevented by checking previous status.
 */
export class OrderIdempotencyConflictError extends Error {
  constructor() {
    super("This checkout key was already used with different order details.");
    this.name = "OrderIdempotencyConflictError";
  }
}

export async function getOrderByIdempotencyKey(
  idempotencyKey: string,
  requestFingerprint: string
): Promise<Order | null> {
  let order: Order | null = null;
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("orders")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) {
      throw new Error(`Unable to check checkout idempotency: ${error.message}`);
    }
    if (data && data.request_fingerprint !== requestFingerprint) {
      throw new OrderIdempotencyConflictError();
    }
    if (data) order = mapOrderRow(data);
  } else {
    order =
      getLocalStore().orders.find((entry) => entry.idempotencyKey === idempotencyKey) ||
      null;
    if (order && order.requestFingerprint !== requestFingerprint) {
      throw new OrderIdempotencyConflictError();
    }
  }
  return order;
}

export async function createOrder(orderInput: {
  orderNumber: string;
  idempotencyKey: string;
  requestFingerprint: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  giftMessage?: string;
  items: {
    productId: string;
    variationText?: string;
    quantity: number;
  }[];
  paymentMethod: "easypaisa" | "jazzcash" | "cod" | "bank_transfer";
  paymentProofUrl?: string;
  customerAccessTokenHash: string;
}): Promise<Order> {
  const isIdempotencyConflict = (error: { code?: string; message?: string }) =>
    error.code === "IDEMPOTENCY_CONFLICT" ||
    /idempotency_key_conflict/i.test(error.message || "");

  if (isSupabaseConfigured()) {
    const supabase = getRequiredSupabase();
    const priorOrder = await getOrderByIdempotencyKey(
      orderInput.idempotencyKey,
      orderInput.requestFingerprint
    );
    if (priorOrder) return priorOrder;

    const requestedIds = Array.from(
      new Set(orderInput.items.map((item) => item.productId))
    );
    if (orderInput.items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      throw new Error("Order quantities must be positive whole numbers.");
    }

    const [{ data: rows, error: productsError }, settings] = await Promise.all([
      supabase.from("products").select("*, categories(name)").in("id", requestedIds),
      getStoreSettings(),
    ]);
    if (productsError) {
      throw new Error(`Unable to validate order products: ${productsError.message}`);
    }

    const productMap = new Map(
      (rows || []).map((row) => [String(row.id), mapProductRow(row)])
    );
    const now = orderInput.createdAt;
    let subtotal = 0;
    const inventory = new Map<string, { product: Product; quantity: number }>();
    const validatedItems: OrderItem[] = orderInput.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
      if (product.status !== "published") {
        throw new Error(`Product "${product.name}" is not currently available.`);
      }
      if (
        !hasAvailableVariantSelection(product.variations) ||
        !areVariationSelectionsAvailable(product.variations, item.variationText)
      ) {
        throw new Error(`The selected option for "${product.name}" is not currently available.`);
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      const current = inventory.get(product.id);
      inventory.set(product.id, {
        product,
        quantity: (current?.quantity || 0) + item.quantity,
      });
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0] || "/images/mesm-logo.png",
        variationText: item.variationText,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      };
    });

    for (const { product, quantity } of Array.from(inventory.values())) {
      if (
        product.trackInventory &&
        !product.allowBackorders &&
        product.stockQuantity < quantity
      ) {
        throw new Error(
          `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
        );
      }
    }

    const deliveryFee =
      subtotal >= (settings.freeDeliveryThreshold || 3000)
        ? 0
        : settings.flatDeliveryFee || 250;
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderNumber: orderInput.orderNumber,
      idempotencyKey: orderInput.idempotencyKey,
      requestFingerprint: orderInput.requestFingerprint,
      customerName: orderInput.customerName.trim(),
      customerPhone: orderInput.customerPhone.trim(),
      customerEmail: orderInput.customerEmail?.trim(),
      customerCity: orderInput.customerCity.trim(),
      deliveryAddress: orderInput.deliveryAddress.trim(),
      deliveryInstructions: orderInput.deliveryInstructions?.trim(),
      giftMessage: orderInput.giftMessage?.trim(),
      items: validatedItems,
      subtotal,
      deliveryFee,
      discount: 0,
      total: subtotal + deliveryFee,
      orderStatus: "pending",
      paymentStatus: orderInput.paymentMethod === "cod" ? "unpaid" : "awaiting_verification",
      paymentMethod: orderInput.paymentMethod,
      paymentProofUrl: orderInput.paymentProofUrl,
      customerAccessTokenHash: orderInput.customerAccessTokenHash,
      createdAt: now,
      updatedAt: now,
      timeline: [{
        id: `tl-${Date.now()}`,
        timestamp: now,
        status: "pending",
        title: "Order Placed via Customer Checkout",
        description: `Order created for WhatsApp confirmation via ${orderInput.paymentMethod.toUpperCase()}`,
        actor: "customer",
      }],
    };
    const { data, error } = await supabase.rpc("create_order_with_inventory", {
      p_order: mapOrderToRow(newOrder),
      p_inventory: Array.from(inventory.values()).map(({ product, quantity }) => ({
        product_id: product.id,
        quantity,
        expected_price: product.price,
      })),
      p_idempotency_key: orderInput.idempotencyKey,
      p_request_fingerprint: orderInput.requestFingerprint,
    });
    if (error) {
      if (isIdempotencyConflict(error)) throw new OrderIdempotencyConflictError();
      throw new Error(
        `Unable to place order in Supabase: ${error.message}`
      );
    }
    if (!isPersistedOrderResponse(data)) {
      throw new Error("Supabase returned an invalid persisted order response.");
    }
    return mapOrderRow(data as Record<string, unknown>);
  }

  const priorAttempt = await getOrderByIdempotencyKey(
    orderInput.idempotencyKey,
    orderInput.requestFingerprint
  );
  if (priorAttempt) return priorAttempt;
  const store = getLocalStore();
  const now = orderInput.createdAt;

  const itemsWithProducts = orderInput.items.map((itemInput) => {
    const product = store.products.find((p) => p.id === itemInput.productId);
    if (!product) {
      throw new Error(`Product with ID ${itemInput.productId} not found.`);
    }

    if (product.status !== "published") {
      throw new Error(`Product "${product.name}" is not currently available.`);
    }

    if (
      !hasAvailableVariantSelection(product.variations) ||
      !areVariationSelectionsAvailable(
        product.variations,
        itemInput.variationText
      )
    ) {
      throw new Error(
        `The selected option for "${product.name}" is not currently available.`
      );
    }

    return { itemInput, product };
  });

  const inventoryDemand = new Map<Product, number>();
  for (const { itemInput, product } of itemsWithProducts) {
    if (product.trackInventory && !product.allowBackorders) {
      inventoryDemand.set(
        product,
        (inventoryDemand.get(product) || 0) + itemInput.quantity
      );
    }
  }
  inventoryDemand.forEach((quantity, product) => {
    if (product.stockQuantity < quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
      );
    }
  });

  // Validate prices and reserve stock after every requested option is validated.
  let subtotal = 0;
  const validatedItems = [];
  for (const { itemInput, product } of itemsWithProducts) {
    if (product.trackInventory && !product.allowBackorders) {
      product.stockQuantity -= itemInput.quantity;
      product.orderCount = (product.orderCount || 0) + itemInput.quantity;
    }

    const lineTotal = product.price * itemInput.quantity;
    subtotal += lineTotal;

    validatedItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0] || "/images/mesm-logo.png",
      variationText: itemInput.variationText,
      quantity: itemInput.quantity,
      unitPrice: product.price,
      lineTotal,
    });
  }

  const freeThreshold = store.settings.freeDeliveryThreshold || 3000;
  const flatFee = store.settings.flatDeliveryFee || 250;
  const deliveryFee = subtotal >= freeThreshold ? 0 : flatFee;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderInput.orderNumber,
    idempotencyKey: orderInput.idempotencyKey,
    requestFingerprint: orderInput.requestFingerprint,
    customerName: orderInput.customerName.trim(),
    customerPhone: orderInput.customerPhone.trim(),
    customerEmail: orderInput.customerEmail?.trim(),
    customerCity: orderInput.customerCity.trim(),
    deliveryAddress: orderInput.deliveryAddress.trim(),
    deliveryInstructions: orderInput.deliveryInstructions?.trim(),
    giftMessage: orderInput.giftMessage?.trim(),
    items: validatedItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    orderStatus: "pending",
    paymentStatus: orderInput.paymentMethod === "cod" ? "unpaid" : "awaiting_verification",
    paymentMethod: orderInput.paymentMethod,
    paymentProofUrl: orderInput.paymentProofUrl,
    customerAccessTokenHash: orderInput.customerAccessTokenHash,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        status: "pending",
        title: "Order Placed via Customer Checkout",
        description: `Order created for WhatsApp confirmation via ${orderInput.paymentMethod.toUpperCase()}`,
        actor: "customer",
      },
    ],
  };

  store.orders.unshift(newOrder);
  saveDataToFile(store);

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<Order> {
  if (isSupabaseConfigured()) {
    const current = await getOrderById(orderId);
    if (!current) throw new Error("Order not found");
    if (current.orderStatus === newStatus) return current;
    const now = new Date().toISOString();
    const event: OrderTimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      status: newStatus,
      title: `Status changed to ${newStatus.toUpperCase()}`,
      description: notes || `Admin updated order status to ${newStatus}`,
      actor: "admin",
    };
    const { data, error } = await getRequiredSupabase().rpc(
      "update_order_status_with_inventory",
      {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_notes: notes ?? null,
        p_event: event,
      }
    );
    if (error) {
      throw new Error(
        `Unable to update order status in Supabase. Ensure the inventory transaction migration is applied: ${error.message}`
      );
    }
    return mapOrderRow(data as Record<string, unknown>);
  }

  const store = getLocalStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const previousStatus = order.orderStatus;
  if (previousStatus === newStatus) {
    return order;
  }

  const now = new Date().toISOString();

  // Stock policy: if cancelling an active order, restore inventory
  if (newStatus === "cancelled" && previousStatus !== "cancelled") {
    for (const item of order.items) {
      const prod = store.products.find((p) => p.id === item.productId);
      if (prod && prod.trackInventory) {
        prod.stockQuantity += item.quantity;
        prod.orderCount = Math.max(0, (prod.orderCount || 0) - item.quantity);
      }
    }
  } else if (previousStatus === "cancelled" && newStatus !== "cancelled") {
    // If un-cancelling, re-reserve inventory if available
    for (const item of order.items) {
      const prod = store.products.find((p) => p.id === item.productId);
      if (prod && prod.trackInventory) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        prod.orderCount = (prod.orderCount || 0) + item.quantity;
      }
    }
  }

  order.orderStatus = newStatus;
  order.updatedAt = now;
  if (notes) {
    order.adminNotes = order.adminNotes ? `${order.adminNotes}\n${notes}` : notes;
  }

  order.timeline.push({
    id: `tl-${Date.now()}`,
    timestamp: now,
    status: newStatus,
    title: `Status changed to ${newStatus.toUpperCase()}`,
    description: notes || `Admin updated order status to ${newStatus}`,
    actor: "admin",
  });

  saveDataToFile(store);

  return order;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  notes?: string
): Promise<Order> {
  if (isSupabaseConfigured()) {
    const current = await getOrderById(orderId);
    if (!current) throw new Error("Order not found");
    const now = new Date().toISOString();
    const event: OrderTimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      status: paymentStatus,
      title: `Payment status changed to ${paymentStatus.toUpperCase()}`,
      description: notes || `Admin verified payment as ${paymentStatus}`,
      actor: "admin",
    };
    const { data, error } = await getRequiredSupabase().rpc(
      "update_order_payment_status",
      {
        p_order_id: orderId,
        p_new_status: paymentStatus,
        p_notes: notes ?? null,
        p_event: event,
      }
    );
    if (error) {
      throw new Error(`Unable to update payment status in Supabase: ${error.message}`);
    }
    return mapOrderRow(data as Record<string, unknown>);
  }

  const store = getLocalStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const now = new Date().toISOString();
  order.paymentStatus = paymentStatus;
  order.updatedAt = now;
  if (notes) {
    order.adminNotes = order.adminNotes ? `${order.adminNotes}\n${notes}` : notes;
  }

  order.timeline.push({
    id: `tl-${Date.now()}`,
    timestamp: now,
    status: paymentStatus,
    title: `Payment status changed to ${paymentStatus.toUpperCase()}`,
    description: notes || `Admin verified payment as ${paymentStatus}`,
    actor: "admin",
  });

  saveDataToFile(store);

  return order;
}

/* ==========================================================================
   ANALYTICS (From real database records)
   ========================================================================== */

export async function getSalesAnalytics(): Promise<SalesAnalyticsSummary> {
  const store = isSupabaseConfigured()
    ? {
        orders: await (async () => {
          const { data, error } = await getRequiredSupabase().from("orders").select("*");
          if (error) throw new Error(`Unable to load analytics orders: ${error.message}`);
          return (data || []).map((row) => mapOrderRow(row));
        })(),
        products: await (async () => {
          const { data, error } = await getRequiredSupabase().from("products").select("*");
          if (error) throw new Error(`Unable to load analytics products: ${error.message}`);
          return (data || []).map((row) => mapProductRow(row));
        })(),
      }
    : getLocalStore();

  const allOrders = store.orders;
  const nonCancelled = allOrders.filter((o) => o.orderStatus !== "cancelled");
  const confirmedOrders = allOrders.filter(
    (o) => o.paymentStatus === "paid" || ["confirmed", "shipped", "delivered"].includes(o.orderStatus)
  );
  const pendingOrders = allOrders.filter((o) => o.orderStatus === "pending");
  const cancelledOrders = allOrders.filter((o) => o.orderStatus === "cancelled");

  const grossRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.total, 0);

  let totalOrderedQuantity = 0;
  const productSalesMap = new Map<
    string,
    { name: string; image: string; quantity: number; revenue: number }
  >();

  for (const ord of nonCancelled) {
    for (const item of ord.items) {
      totalOrderedQuantity += item.quantity;
      const curr = productSalesMap.get(item.productId) || {
        name: item.productName,
        image: item.productImage,
        quantity: 0,
        revenue: 0,
      };
      curr.quantity += item.quantity;
      curr.revenue += item.lineTotal;
      productSalesMap.set(item.productId, curr);
    }
  }

  const bestsellers = Array.from(productSalesMap.entries())
    .map(([productId, val]) => ({
      productId,
      productName: val.name,
      image: val.image,
      totalQuantity: val.quantity,
      totalRevenue: val.revenue,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  const lowStockCount = store.products.filter(
    (p) => p.trackInventory && p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
  ).length;

  const outOfStockCount = store.products.filter(
    (p) => p.trackInventory && p.stockQuantity <= 0
  ).length;

  const publishedProductsCount = store.products.filter((p) => p.status === "published").length;
  const draftProductsCount = store.products.filter((p) => p.status === "draft").length;

  // Daily trends for the last 7 days
  const dailyTrendsMap = new Map<string, { orders: number; revenue: number }>();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyTrendsMap.set(key, { orders: 0, revenue: 0 });
  }

  for (const ord of nonCancelled) {
    const key = ord.createdAt.split("T")[0];
    if (dailyTrendsMap.has(key)) {
      const entry = dailyTrendsMap.get(key)!;
      entry.orders += 1;
      entry.revenue += ord.total;
    }
  }

  const dailyTrends = Array.from(dailyTrendsMap.entries()).map(([date, val]) => ({
    date,
    orders: val.orders,
    revenue: val.revenue,
  }));

  return {
    totalRevenue: confirmedRevenue,
    pendingRevenue,
    grossRevenue,
    totalOrders: allOrders.length,
    pendingOrdersCount: pendingOrders.length,
    confirmedOrdersCount: confirmedOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    totalOrderedQuantity,
    lowStockCount,
    outOfStockCount,
    totalProductsCount: store.products.length,
    publishedProductsCount,
    draftProductsCount,
    bestsellers,
    recentOrders: allOrders.slice(0, 8),
    dailyTrends,
  };
}

/* ==========================================================================
   REVIEWS
   ========================================================================== */

export async function getReviews(productId?: string): Promise<Review[]> {
  if (isSupabaseConfigured()) {
    let query = getRequiredSupabase()
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (productId) query = query.eq("product_id", productId);
    const { data, error } = await query;
    if (error) {
      throw new Error(`Unable to load approved reviews: ${error.message}`);
    }
    return (data || []).map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      customerName: String(row.customer_name),
      rating: Number(row.rating),
      comment: String(row.comment),
      isVerifiedPurchase: Boolean(row.is_verified_purchase),
      isApproved: Boolean(row.is_approved),
      createdAt: String(row.created_at),
    }));
  }

  const store = getLocalStore();
  if (productId) {
    return store.reviews.filter((r) => r.productId === productId && r.isApproved === true);
  }
  return store.reviews.filter((r) => r.isApproved === true);
}

export async function addReview(
  review: Omit<Review, "id" | "createdAt" | "isApproved" | "isVerifiedPurchase">
): Promise<Review> {
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    isVerifiedPurchase: false,
    isApproved: false,
    createdAt: new Date().toISOString(),
  };
  if (isSupabaseConfigured()) {
    const { data, error } = await getRequiredSupabase()
      .from("reviews")
      .insert({
        id: newReview.id,
        product_id: newReview.productId,
        customer_name: newReview.customerName,
        rating: newReview.rating,
        comment: newReview.comment,
        is_verified_purchase: newReview.isVerifiedPurchase,
        is_approved: newReview.isApproved,
        created_at: newReview.createdAt,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Unable to submit review: ${error.message}`);
    return {
      id: String(data.id),
      productId: String(data.product_id),
      customerName: String(data.customer_name),
      rating: Number(data.rating),
      comment: String(data.comment),
      isVerifiedPurchase: Boolean(data.is_verified_purchase),
      isApproved: Boolean(data.is_approved),
      createdAt: String(data.created_at),
    };
  }

  const store = getLocalStore();
  store.reviews.push(newReview);
  saveDataToFile(store);
  return newReview;
}

/* ==========================================================================
   RESET / SEED DATA HELPER (FOR ADMIN DASHBOARD)
   ========================================================================== */

export async function resetStoreData(): Promise<void> {
  if (isSupabaseConfigured()) {
    throw new Error(
      "The bulk reset action is disabled for Supabase production data. Use a reviewed, table-specific maintenance procedure."
    );
  }
  const store = getLocalStore();
  const resetStore = {
    ...store,
    products: [],
    orders: [],
    reviews: [],
  };
  saveDataToFile(resetStore);
}
