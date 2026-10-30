import fs from "fs";
import path from "path";
import {
  Product,
  Category,
  Order,
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
import { isSupabaseConfigured, getSupabaseServer } from "./supabase";
import {
  areVariationSelectionsAvailable,
  hasAvailableVariantSelection,
} from "./variation-availability.mjs";

interface StoreData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "store.json");

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
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE_PATH)) {
      const isProduction = process.env.NODE_ENV === "production";
      const initialStore: StoreData = {
        settings: initialSettings,
        categories: isProduction ? [] : initialCategories,
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
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();
      if (!error && data) {
        return mapStoreSettingsRow(data);
      }
    }
  }

  const store = ensureDataFile();
  return store.settings;
}

export async function updateStoreSettings(
  updated: Partial<StoreSettings>
): Promise<StoreSettings> {
  const store = ensureDataFile();
  store.settings = { ...store.settings, ...updated };
  saveDataToFile(store);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase
        .from("store_settings")
        .upsert(mapStoreSettingsToRow(store.settings), { onConflict: "id" });
      if (error) {
        throw new Error(`Unable to save store settings: ${error.message}`);
      }
    }
  }

  return store.settings;
}

/* ==========================================================================
   CATEGORIES
   ========================================================================== */

export async function getCategories(
  includeUnpublished = false
): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      let query = supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (!includeUnpublished) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(`Unable to load categories: ${error.message}`);
      }
      if (data) {
        return data.map((row) => ({
          id: String(row.id),
          slug: String(row.slug),
          name: String(row.name),
          description: String(row.description ?? ""),
          imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
          videoUrl: typeof row.video_url === "string" ? row.video_url : undefined,
          sortOrder: Number(row.sort_order ?? 0),
          isPublished: Boolean(row.is_published),
          createdAt: String(row.created_at ?? new Date().toISOString()),
        }));
      }
    }
  }

  const store = ensureDataFile();
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
  const store = ensureDataFile();
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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.from("categories").upsert({
        id: savedCategory.id,
        slug: savedCategory.slug,
        name: savedCategory.name,
        description: savedCategory.description,
        image_url: savedCategory.imageUrl || null,
        video_url: savedCategory.videoUrl || null,
        sort_order: savedCategory.sortOrder,
        is_published: savedCategory.isPublished,
        created_at: savedCategory.createdAt,
      });
      if (error) {
        throw new Error(`Unable to save category: ${error.message}`);
      }
    }
  }

  return savedCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const store = ensureDataFile();
  // Check if any product is using this category
  const hasProducts = store.products.some((p) => p.categoryId === id);
  if (hasProducts) {
    throw new Error("Cannot delete category because active products are assigned to it.");
  }

  store.categories = store.categories.filter((c) => c.id !== id);
  saveDataToFile(store);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("categories").delete().eq("id", id);
    }
  }

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
  const store = ensureDataFile();
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
  const store = ensureDataFile();
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
  const store = ensureDataFile();
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
  const store = ensureDataFile();
  const product = store.products.find((p) => p.id === id);
  if (!product) return null;

  const category = store.categories.find((c) => c.id === product.categoryId);
  return {
    ...product,
    categoryName: category?.name || product.categoryName || "Jewellery",
  };
}

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  const store = ensureDataFile();
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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("products").upsert(saved);
    }
  }

  return saved;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = ensureDataFile();
  if (!store.products.some((product) => product.id === id)) {
    return false;
  }

  store.products = store.products.filter((p) => p.id !== id);
  saveDataToFile(store);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        throw new Error(`Unable to delete product: ${error.message}`);
      }
    }
  }

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
  const store = ensureDataFile();
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
  const store = ensureDataFile();
  let list = [...store.orders];

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
  const store = ensureDataFile();
  return store.orders.find((o) => o.id === id) || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const store = ensureDataFile();
  return store.orders.find((o) => o.orderNumber === orderNumber) || null;
}

/**
 * Inventory Policy:
 * 1. Upon order placement, authoritative stock is checked and reserved (stockQuantity decremented).
 * 2. If an order is later Cancelled by the admin, reserved stock is automatically restored.
 * 3. Double-decrementing is strictly prevented by checking previous status.
 */
export async function createOrder(orderInput: {
  orderNumber: string;
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
}): Promise<Order> {
  const store = ensureDataFile();
  const now = new Date().toISOString();

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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.from("orders").insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_email: newOrder.customerEmail || null,
        customer_city: newOrder.customerCity,
        delivery_address: newOrder.deliveryAddress,
        delivery_instructions: newOrder.deliveryInstructions || null,
        gift_message: newOrder.giftMessage || null,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        delivery_fee: newOrder.deliveryFee,
        discount: newOrder.discount,
        total: newOrder.total,
        order_status: newOrder.orderStatus,
        payment_status: newOrder.paymentStatus,
        payment_method: newOrder.paymentMethod,
        payment_proof_url: newOrder.paymentProofUrl || null,
        admin_notes: newOrder.adminNotes || null,
        timeline: newOrder.timeline,
        created_at: newOrder.createdAt,
        updated_at: newOrder.updatedAt,
      });
      if (error) {
        throw new Error(`Unable to save order to the database: ${error.message}`);
      }
    }
  }

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<Order> {
  const store = ensureDataFile();
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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("orders").update(order).eq("id", orderId);
    }
  }

  return order;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  notes?: string
): Promise<Order> {
  const store = ensureDataFile();
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

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("orders").update(order).eq("id", orderId);
    }
  }

  return order;
}

/* ==========================================================================
   ANALYTICS (From real database records)
   ========================================================================== */

export async function getSalesAnalytics(): Promise<SalesAnalyticsSummary> {
  const store = ensureDataFile();

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
  const store = ensureDataFile();
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServer();
    if (supabase) {
      let query = supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (productId) query = query.eq("product_id", productId);

      const { data, error } = await query;
      if (error) {
        console.error("Unable to load approved reviews from Supabase:", error.message);
      } else if (data) {
        return data.map((row) => ({
          id: row.id,
          productId: row.product_id,
          customerName: row.customer_name,
          rating: row.rating,
          comment: row.comment,
          isVerifiedPurchase: row.is_verified_purchase,
          isApproved: row.is_approved,
          createdAt: row.created_at,
        })) as Review[];
      }
    }
  }

  if (productId) {
    return store.reviews.filter((r) => r.productId === productId && r.isApproved === true);
  }
  return store.reviews.filter((r) => r.isApproved === true);
}

export async function addReview(
  review: Omit<Review, "id" | "createdAt" | "isApproved" | "isVerifiedPurchase">
): Promise<Review> {
  const store = ensureDataFile();
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    isVerifiedPurchase: false,
    isApproved: false,
    createdAt: new Date().toISOString(),
  };
  store.reviews.push(newReview);
  saveDataToFile(store);
  return newReview;
}

/* ==========================================================================
   RESET / SEED DATA HELPER (FOR ADMIN DASHBOARD)
   ========================================================================== */

export async function resetStoreData(): Promise<void> {
  const store = ensureDataFile();
  const resetStore = {
    ...store,
    products: [],
    orders: [],
    reviews: [],
  };
  saveDataToFile(resetStore);
}
