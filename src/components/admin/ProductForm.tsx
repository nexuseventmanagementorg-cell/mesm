"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Category,
  Product,
  ProductAttribute,
  ProductStatus,
  ProductVariation,
} from "@/types";
import { generateSKU, slugify } from "@/lib/utils";
import { normalizeProductTag, parseProductTags } from "@/lib/product-tags.mjs";
import {
  Plus,
  Trash2,
  ImageIcon,
  Check,
  AlertCircle,
  DollarSign,
  Package,
  FileText,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";

interface ProductFormProps {
  initialProduct?: Product;
  categories: Category[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  // Form State: A. Basic Info
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [sku, setSku] = useState(initialProduct?.sku || generateSKU("MG", "GEM"));
  const [shortDescription, setShortDescription] = useState(
    initialProduct?.shortDescription || ""
  );
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || "cat-1"
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    (initialProduct?.tags || [])
      .map(normalizeProductTag)
      .filter(Boolean)
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status || "published");
  const [isFeatured, setIsFeatured] = useState<boolean>(initialProduct?.isFeatured || false);

  // Form State: B. Media Upload
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialProduct?.videoUrl || "");

  // Form State: C. Pricing
  const [price, setPrice] = useState<number | string>(initialProduct?.price ?? 1500);
  const [compareAtPrice, setCompareAtPrice] = useState<number | string>(
    initialProduct?.compareAtPrice ?? ""
  );
  const [costPrice, setCostPrice] = useState<number | string>(
    initialProduct?.costPrice ?? ""
  );

  // Form State: D. Inventory & Variations
  const [trackInventory, setTrackInventory] = useState(
    initialProduct?.trackInventory ?? true
  );
  const [stockQuantity, setStockQuantity] = useState<number | string>(
    initialProduct?.stockQuantity ?? 10
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    initialProduct?.lowStockThreshold ?? 3
  );
  const [allowBackorders, setAllowBackorders] = useState(
    initialProduct?.allowBackorders ?? false
  );
  const [variations, setVariations] = useState<ProductVariation[]>(
    initialProduct?.variations || []
  );

  // Form State: E. Attributes
  const [attributes, setAttributes] = useState<ProductAttribute[]>(
    initialProduct?.attributes || [
      { key: "Material", value: "Crystal Resin & 18K Gold Plated Alloy" },
      { key: "Dimensions", value: "22mm pendant, 18-inch chain" },
      { key: "Care", value: "Avoid perfumes and direct water exposure" },
    ]
  );

  // UI / Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
      setSku(generateSKU("MG", val));
    }
  };

  const handleAddTag = () => {
    const newTags = parseProductTags(tagInput);
    if (newTags.length === 0) return;

    setTags((currentTags) => {
      const existingTags = new Set(
        currentTags.map((tag) => normalizeProductTag(tag).toLocaleLowerCase())
      );
      const uniqueTags = newTags.filter((tag) => {
        const key = tag.toLocaleLowerCase();
        if (existingTags.has(key)) return false;
        existingTags.add(key);
        return true;
      });

      return [...currentTags, ...uniqueTags];
    });
    setTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    setImages(next);
  };

  // Variations handlers
  const handleAddVariation = () => {
    setVariations([
      ...variations,
      {
        id: `var-${Date.now()}`,
        name: "Color",
        options: ["Gold", "Silver"],
      },
    ]);
  };

  const handleUpdateVariationName = (idx: number, newName: string) => {
    const next = [...variations];
    next[idx] = { ...next[idx], name: newName };
    setVariations(next);
  };

  const handleUpdateVariationOptions = (idx: number, optsString: string) => {
    const next = [...variations];
    const variation = next[idx];
    const options = optsString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    next[idx] = {
      ...variation,
      options,
      optionAvailability: Object.fromEntries(
        options.map((option) => [
          option,
          variation.optionAvailability?.[option] !== false,
        ])
      ),
    };
    setVariations(next);
  };

  const handleSetOptionAvailability = (
    variationIndex: number,
    option: string,
    available: boolean
  ) => {
    const next = [...variations];
    const variation = next[variationIndex];
    next[variationIndex] = {
      ...variation,
      optionAvailability: {
        ...variation.optionAvailability,
        [option]: available,
      },
    };
    setVariations(next);
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  // Attributes handlers
  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const handleUpdateAttribute = (idx: number, field: "key" | "value", val: string) => {
    const next = [...attributes];
    next[idx][field] = val;
    setAttributes(next);
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes(attributes.filter((_, i) => i !== idx));
  };

  // Save product
  const handleSubmit = async (targetStatus?: ProductStatus) => {
    if (!name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }
    if (Number(price) <= 0) {
      setErrorMessage("Please enter a valid price greater than 0 PKR.");
      return;
    }
    if (images.length === 0) {
      setErrorMessage("Please add at least one product image.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const payload: Partial<Product> = {
      id: initialProduct?.id,
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      sku: sku.trim() || generateSKU("MG", name),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categoryId,
      tags,
      status: targetStatus || status,
      isFeatured,
      images,
      videoUrl: videoUrl.trim() || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      currency: "PKR",
      trackInventory,
      stockQuantity: trackInventory ? Number(stockQuantity) : 999,
      lowStockThreshold: Number(lowStockThreshold),
      allowBackorders,
      variations,
      attributes: attributes.filter((a) => a.key.trim() && a.value.trim()),
    };

    try {
      const url = isEditing ? `/api/products/${initialProduct!.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setSuccessMessage(
        isEditing
          ? "Product updated successfully!"
          : "New product published and live in catalogue!"
      );

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to save product.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-mocha/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-mocha">
              {isEditing ? `Edit: ${initialProduct?.name}` : "Create New Product Listing"}
            </h1>
            <p className="text-xs text-brand-mocha-muted">
              Add details, upload images, set variations, and publish directly to the live MESM store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="py-2.5 px-4 bg-brand-ivory border border-brand-mocha/20 hover:bg-brand-sand/40 text-brand-mocha rounded-full text-xs font-semibold transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
            className="py-2.5 px-6 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-bold shadow-soft transition-all"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Publish to Store"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* A. BASIC INFORMATION */}
      <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
          <FileText className="w-4 h-4 text-brand-gold" />
          A. Basic Product Information
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Botanical Wildflower Teardrop Pendant"
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha font-mono focus:outline-none focus:border-brand-gold"
                />
                <button
                  type="button"
                  onClick={() => setSku(generateSKU("MG", name))}
                  className="px-3 py-2 bg-brand-cream border border-brand-mocha/15 rounded-xl text-brand-mocha hover:bg-brand-sand/50 whitespace-nowrap text-[11px] font-semibold"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Short Description (Card summary)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Real dried baby's breath & gold flake encased in crystal-clear teardrop resin."
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Full Description & Product Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the jewellery style, materials, fit, and care details..."
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-3 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Search Tags & Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type or paste comma-separated keywords, then click Add"
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-1.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-1.5 bg-brand-mocha text-brand-ivory rounded-xl text-xs font-semibold hover:bg-brand-mocha-dark"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 bg-brand-cream border border-brand-mocha/10 rounded-full text-[11px] text-brand-mocha flex items-center gap-1.5"
                >
                  <span>#{normalizeProductTag(t)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status & Featured Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha cursor-pointer"
              >
                <option value="published">Published (Visible in store)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-brand-mocha focus:ring-brand-gold"
              />
              <label htmlFor="featuredCheck" className="font-semibold text-brand-mocha cursor-pointer">
                Mark as Featured Jewellery on Homepage
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* B. MEDIA UPLOAD */}
      <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
          <ImageIcon className="w-4 h-4 text-brand-gold" />
          B. Product Photography & Media
        </h2>

        <div className="space-y-4 text-xs">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-brand-mocha/20 hover:border-brand-gold/60 rounded-2xl p-6 text-center bg-brand-ivory/50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <MediaUploadButton
                accept="image/*"
                label="Upload product photos"
                multiple
                onUploaded={(urls) => setImages((previous) => [...previous, ...urls])}
              />
              <div className="text-[11px] text-brand-mocha-muted">
                JPG, PNG, WebP, AVIF, or GIF. Up to 10 MB per image.
              </div>
            </div>
          </div>

          {/* Or Paste Image URL */}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Uploaded file path or optional image URL"
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 bg-brand-cream border border-brand-mocha/15 rounded-xl font-semibold text-brand-mocha hover:bg-brand-sand/50 whitespace-nowrap text-xs"
            >
              Add URL
            </button>
          </div>

          {/* Gallery Previews & Cover Selector */}
          {images.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-bold text-brand-mocha uppercase tracking-wider text-[11px] block">
                Gallery Images ({images.length}) — Click &ldquo;Make Cover&rdquo; to set primary:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-brand-mocha/20 bg-brand-cream group"
                  >
                    <Image
                      src={img}
                      alt={`Upload ${idx}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-brand-gold text-brand-ivory text-[9px] font-bold rounded-full shadow-xs">
                        Cover Image
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(idx)}
                          className="px-2 py-1 bg-white text-brand-mocha text-[10px] font-bold rounded-md hover:bg-brand-gold hover:text-white"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Video URL */}
          <div className="pt-2">
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Optional Product Video
            </label>
            <div className="mb-2">
              <MediaUploadButton
                accept="video/*"
                label="Upload product video"
                onUploaded={(urls) => setVideoUrl(urls[0] || "")}
              />
              <p className="mt-1.5 text-[11px] text-brand-mocha-muted">
                MP4 or WebM, up to 50 MB. You can also paste a video URL below.
              </p>
            </div>
            <input
              type="text"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Uploaded file path or optional video URL"
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>
      </section>

      {/* C. PRICING */}
      <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
          <DollarSign className="w-4 h-4 text-brand-gold" />
          C. Pricing (PKR)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Selling Price (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-sm font-bold text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Original / Compare-At Price <span className="text-brand-mocha-muted font-normal">(For discount)</span>
            </label>
            <input
              type="number"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="e.g. 2200"
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Cost Price <span className="text-brand-mocha-muted font-normal">(Private admin only)</span>
            </label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="e.g. 600"
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>
        </div>
      </section>

      {/* D. INVENTORY & VARIATIONS */}
      <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
          <Package className="w-4 h-4 text-brand-gold" />
          D. Inventory & Product Variations
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="trackStockCheck"
              checked={trackInventory}
              onChange={(e) => setTrackInventory(e.target.checked)}
              className="rounded text-brand-mocha focus:ring-brand-gold"
            />
            <label htmlFor="trackStockCheck" className="font-semibold text-brand-mocha cursor-pointer">
              Track Inventory for this product
            </label>
          </div>

          {trackInventory && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="backorderCheck"
                  checked={allowBackorders}
                  onChange={(e) => setAllowBackorders(e.target.checked)}
                  className="rounded text-brand-mocha focus:ring-brand-gold"
                />
                <label htmlFor="backorderCheck" className="font-medium text-brand-mocha cursor-pointer">
                  Allow orders when out of stock (Made-to-order)
                </label>
              </div>
            </div>
          )}

          {/* Dynamic Variations Builder */}
          <div className="pt-4 border-t border-brand-mocha/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-mocha uppercase tracking-wider text-xs">
                Product Variations (e.g. Color, Size, Finish)
              </span>
              <button
                type="button"
                onClick={handleAddVariation}
                className="px-3 py-1 bg-brand-cream border border-brand-mocha/15 rounded-lg text-xs font-semibold text-brand-mocha hover:bg-brand-sand/40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variation
              </button>
            </div>
            <p className="text-[11px] text-brand-mocha-muted">
              Close individual options here. Stock quantity and low-stock threshold above still apply to the whole product.
            </p>

            {variations.length === 0 ? (
              <p className="text-brand-mocha-muted italic text-[11px]">
                No variations configured. Customers will purchase the standard piece.
              </p>
            ) : (
              variations.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="p-3 bg-brand-ivory rounded-2xl border border-brand-mocha/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariationName(idx, e.target.value)}
                      placeholder="Name (e.g. Color, Chain Length)"
                      className="w-full sm:w-1/3 bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                    />
                    <input
                      type="text"
                      value={v.options.join(", ")}
                      onChange={(e) => handleUpdateVariationOptions(idx, e.target.value)}
                      placeholder="Options separated by commas: Gold, Silver, Rose Gold"
                      className="w-full sm:flex-1 bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(idx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label={`Remove ${v.name || "variation"}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {v.options.length > 0 && (
                    <fieldset className="border-t border-brand-mocha/10 pt-3">
                      <legend className="text-[11px] font-semibold text-brand-mocha">
                        Option availability
                      </legend>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                        {v.options.map((option) => {
                          const available = v.optionAvailability?.[option] !== false;
                          const optionId = `variation-${idx}-${option}`;
                          return (
                            <label
                              key={option}
                              htmlFor={optionId}
                              className="inline-flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                id={optionId}
                                type="checkbox"
                                checked={available}
                                onChange={(event) =>
                                  handleSetOptionAvailability(
                                    idx,
                                    option,
                                    event.target.checked
                                  )
                                }
                                className="rounded text-brand-mocha focus:ring-brand-gold"
                              />
                              <span className="text-brand-mocha">{option}</span>
                              <span
                                className={
                                  available
                                    ? "text-emerald-700 font-medium"
                                    : "text-red-600 font-medium"
                                }
                              >
                                {available ? "Available" : "Closed"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* E. PRODUCT ATTRIBUTES */}
      <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
          <Tag className="w-4 h-4 text-brand-gold" />
          E. Technical Specifications & Attributes
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-brand-mocha-muted">
              Add attributes like Material, Dimensions, Weight, and Care Instructions. Empty fields will be hidden on storefront.
            </span>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="px-3 py-1 bg-brand-cream border border-brand-mocha/15 rounded-lg text-xs font-semibold text-brand-mocha hover:bg-brand-sand/40 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
          </div>

          {attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={attr.key}
                onChange={(e) => handleUpdateAttribute(idx, "key", e.target.value)}
                placeholder="Key (e.g. Material)"
                className="w-1/3 bg-brand-ivory border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => handleUpdateAttribute(idx, "value", e.target.value)}
                placeholder="Value (e.g. 18K Gold Plated Brass)"
                className="flex-1 bg-brand-ivory border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
              />
              <button
                type="button"
                onClick={() => handleRemoveAttribute(idx)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* F. SAVE & PUBLISH ACTION BAR */}
      <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="text-xs font-semibold text-brand-mocha-muted hover:text-brand-mocha"
        >
          Discard & Cancel
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="py-3 px-5 bg-brand-ivory border border-brand-mocha/20 text-brand-mocha rounded-full text-xs font-semibold hover:bg-brand-sand/40 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
            className="py-3 px-8 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-bold shadow-card transition-all"
          >
            {isSubmitting ? "Publishing Product..." : "Publish Product to Store"}
          </button>
        </div>
      </div>
    </div>
  );
}
