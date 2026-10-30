import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(root);
const bucketName = "meems-gems-media";
const apply = process.argv.includes("--apply");
const confirmedProject = process.argv
  .find((argument) => argument.startsWith("--confirm-project-ref="))
  ?.split("=")[1];

function fail(message) {
  throw new Error(message);
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeLocalAsset(reference) {
  if (typeof reference !== "string" || /^https?:\/\//i.test(reference)) return null;
  const normalized = reference.replace(/\\/g, "/").replace(/^\/+/, "");
  const relative = normalized.startsWith("uploads/") || normalized.startsWith("images/")
    ? path.join("public", ...normalized.split("/"))
    : normalized.startsWith("public/")
      ? path.join(...normalized.split("/"))
      : null;
  if (!relative) return null;

  const absolute = path.resolve(root, relative);
  const publicRoot = path.resolve(root, "public");
  if (!absolute.startsWith(`${publicRoot}${path.sep}`)) {
    fail(`Referenced media path is outside public/: ${reference}`);
  }
  return { reference, absolute, relative: path.relative(root, absolute).split(path.sep).join("/") };
}

function addMediaReference(map, reference) {
  const asset = safeLocalAsset(reference);
  if (asset) map.set(asset.reference, asset);
}

function collectMedia(store) {
  const references = new Map();
  for (const product of store.products) {
    for (const image of Array.isArray(product.images) ? product.images : []) {
      addMediaReference(references, image);
    }
    addMediaReference(references, product.videoUrl);
  }
  for (const category of store.categories) {
    addMediaReference(references, category.imageUrl);
    addMediaReference(references, category.videoUrl);
  }
  addMediaReference(references, store.settings?.logoUrl);
  return references;
}

function createProductRow(product, assetUrls) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    short_description: product.shortDescription ?? "",
    description: product.description ?? "",
    category_id: product.categoryId || null,
    tags: product.tags ?? [],
    status: product.status ?? "draft",
    is_featured: product.isFeatured ?? false,
    images: (product.images ?? []).map((image) => assetUrls.get(image) || image),
    video_url: assetUrls.get(product.videoUrl) || product.videoUrl || null,
    price: product.price ?? 0,
    compare_at_price: product.compareAtPrice ?? null,
    cost_price: product.costPrice ?? null,
    currency: product.currency ?? "PKR",
    track_inventory: product.trackInventory ?? true,
    stock_quantity: product.stockQuantity ?? 0,
    low_stock_threshold: product.lowStockThreshold ?? 3,
    allow_backorders: product.allowBackorders ?? false,
    variations: product.variations ?? [],
    attributes: product.attributes ?? [],
    order_count: product.orderCount ?? 0,
    rating: product.rating ?? 5,
    review_count: product.reviewCount ?? 0,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

function createSettingsRow(settings, assetUrls) {
  return {
    id: settings.id || "default",
    store_name: settings.storeName,
    tagline: settings.tagline,
    supporting_copy: settings.supportingCopy,
    about_us: settings.aboutUs,
    logo_url: assetUrls.get(settings.logoUrl) || settings.logoUrl,
    contact_email: settings.contactEmail,
    whatsapp_number: settings.whatsappNumber,
    easypaisa_number: settings.easypaisaNumber,
    easypaisa_title: settings.easypaisaTitle,
    easypaisa_enabled: settings.easypaisaEnabled,
    jazzcash_number: settings.jazzcashNumber,
    jazzcash_title: settings.jazzcashTitle,
    jazzcash_enabled: settings.jazzcashEnabled,
    bank_details: settings.bankDetails || null,
    bank_transfer_enabled: settings.bankTransferEnabled,
    cash_on_delivery_enabled: settings.cashOnDeliveryEnabled,
    default_currency: settings.defaultCurrency || "PKR",
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

function createCategoryRow(category, assetUrls) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description || null,
    source_image_url: category.imageUrl || null,
    image_url: assetUrls.get(category.imageUrl) || category.imageUrl || null,
    sort_order: category.sortOrder ?? 0,
    is_published: category.isPublished ?? true,
  };
}

async function getExactCount(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) fail(`Unable to verify ${table} row count: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const storePath = path.join(root, "data", "store.json");
  const store = JSON.parse(await readFile(storePath, "utf8"));
  const categories = Array.isArray(store.categories) ? store.categories : [];
  const products = Array.isArray(store.products) ? store.products : [];
  const orders = Array.isArray(store.orders) ? store.orders : [];
  const reviews = Array.isArray(store.reviews) ? store.reviews : [];

  if (!store.settings || categories.length !== 17 || products.length !== 38) {
    fail("Local snapshot does not match the reviewed 17-category, 38-product backup.");
  }
  if (orders.length || reviews.length) {
    fail("Local orders or reviews exist; use a separately reviewed migration for customer records.");
  }
  if (new Set(categories.map((category) => category.id)).size !== categories.length) {
    fail("Duplicate local category IDs found.");
  }
  if (new Set(products.map((product) => product.id)).size !== products.length ||
      new Set(products.map((product) => product.slug)).size !== products.length ||
      new Set(products.map((product) => product.sku)).size !== products.length) {
    fail("Duplicate local product IDs, slugs, or SKUs found.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || /^your-/i.test(key)) {
    fail("Set NEXT_PUBLIC_SUPABASE_URL and a rotated server-only Supabase key in the process environment.");
  }

  const projectRef = new URL(url).hostname.split(".")[0];
  if (apply && confirmedProject !== projectRef) {
    fail(`For writes, pass --confirm-project-ref=${projectRef} to confirm the target. No data was changed.`);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tableCounts = {};
  for (const table of ["categories", "products", "orders", "store_settings", "reviews"]) {
    tableCounts[table] = await getExactCount(supabase, table);
  }

  const { data: remoteCategories, error: categoryError } = await supabase
    .from("categories")
    .select("id,slug,name,description,image_url,sort_order,is_published");
  if (categoryError) fail(`Unable to verify existing categories: ${categoryError.message}`);

  if (tableCounts.categories !== categories.length ||
      tableCounts.products !== 0 ||
      tableCounts.orders !== 0 ||
      tableCounts.store_settings !== 0 ||
      tableCounts.reviews !== 0) {
    fail("Production table counts changed or contain records; refusing migration. No database or Storage writes were made.");
  }

  const remoteById = new Map((remoteCategories || []).map((category) => [category.id, category]));
  for (const local of categories) {
    const remote = remoteById.get(local.id);
    if (!remote ||
        remote.slug !== local.slug ||
        remote.name !== local.name ||
        (remote.description || "") !== (local.description || "") ||
        remote.sort_order !== (local.sortOrder ?? 0) ||
        remote.is_published !== (local.isPublished ?? true)) {
      fail(`Production category ${local.id} differs from the backed-up local snapshot; refusing import.`);
    }
  }

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
  if (bucketError) fail(`Unable to verify Storage bucket ${bucketName}: ${bucketError.message}`);
  if (!bucket.public) fail(`Storage bucket ${bucketName} must be public for existing storefront image URLs.`);

  const references = collectMedia(store);
  const assets = [];
  for (const asset of references.values()) {
    const bytes = await readFile(asset.absolute);
    const extension = path.extname(asset.absolute).toLowerCase();
    const digest = hash(bytes);
    const kind = /\.(mp4|webm)$/i.test(extension) ? "videos" : "images";
    assets.push({
      ...asset,
      bytes,
      digest,
      storagePath: `local-import/${kind}/${digest}${extension}`,
    });
  }
  if (assets.length !== 56) {
    fail(`Expected 56 referenced media files but found ${assets.length}; no database or Storage writes were made.`);
  }

  const assetUrls = new Map();
  for (const asset of assets) {
    assetUrls.set(
      asset.reference,
      supabase.storage.from(bucketName).getPublicUrl(asset.storagePath).data.publicUrl
    );
  }

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    projectRef,
    localCounts: { categories: categories.length, products: products.length, orders: orders.length, reviews: reviews.length, settings: 1 },
    productionCounts: tableCounts,
    mediaFiles: assets.length,
    totalMediaBytes: assets.reduce((total, asset) => total + asset.bytes.length, 0),
    storageBucket: bucketName,
    writesPerformed: false,
  }, null, 2));

  if (!apply) {
    console.log("Dry run complete. No database rows or Storage objects were changed.");
    return;
  }

  for (const asset of assets) {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(asset.storagePath, asset.bytes, {
        contentType: /\.(mp4|webm)$/i.test(asset.storagePath)
          ? asset.storagePath.endsWith(".mp4") ? "video/mp4" : "video/webm"
          : "image/" + (path.extname(asset.storagePath).slice(1) === "jpg" ? "jpeg" : path.extname(asset.storagePath).slice(1)),
        cacheControl: "31536000",
        upsert: false,
      });
    if (!error) continue;

    const { data: existing, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(asset.storagePath);
    if (downloadError || !existing || hash(Buffer.from(await existing.arrayBuffer())) !== asset.digest) {
      fail(`Storage object conflict at ${asset.storagePath}; existing object was not overwritten.`);
    }
  }

  const categoryRows = categories.map((category) => createCategoryRow(category, assetUrls));
  const productRows = products.map((product) => createProductRow(product, assetUrls));
  const settingsRow = createSettingsRow(store.settings, assetUrls);
  const { data: imported, error: importError } = await supabase.rpc(
    "import_local_catalog_if_empty",
    {
      p_categories: categoryRows,
      p_products: productRows,
      p_settings: settingsRow,
    }
  );
  if (importError) {
    fail(`Catalog import transaction failed. Uploaded media is retained; no database rows were committed: ${importError.message}`);
  }

  const verifiedCounts = {};
  for (const table of ["categories", "products", "orders", "store_settings", "reviews"]) {
    verifiedCounts[table] = await getExactCount(supabase, table);
  }
  if (verifiedCounts.categories !== categories.length ||
      verifiedCounts.products !== products.length ||
      verifiedCounts.store_settings !== 1 ||
      verifiedCounts.orders !== 0 ||
      verifiedCounts.reviews !== 0) {
    fail("Import RPC returned, but post-import row counts do not match expectations. Stop and inspect before retrying.");
  }

  console.log(JSON.stringify({
    imported,
    verifiedCounts,
    mediaFilesUploadedOrVerified: assets.length,
    writesPerformed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
