"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Category } from "@/types";
import { slugify } from "@/lib/utils";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/categories?all=true&includeProductCounts=true"
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load categories.");
      }

      setCategories(data.categories);
      setProductCounts(data.productCounts);
      setLoadError("");
    } catch (error) {
      console.error(error);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormImageUrl("");
    setFormVideoUrl("");
    setFormIsPublished(true);
    setFormSortOrder(categories.length + 1);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setFormImageUrl(cat.imageUrl || "");
    setFormVideoUrl(cat.videoUrl || "");
    setFormIsPublished(cat.isPublished);
    setFormSortOrder(cat.sortOrder);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(slugify(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      setErrorMsg("Name and slug are required.");
      return;
    }

    try {
      const payload = {
        id: editingCategory?.id,
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        videoUrl: formVideoUrl.trim() || undefined,
        isPublished: formIsPublished,
        sortOrder: Number(formSortOrder),
      };

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save category");
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save category.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || "Cannot delete category");
      } else {
        loadCategories();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
            Store Taxonomy
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
            Categories ({categories.length})
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-5 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
        >
          <Plus className="w-4 h-4 text-brand-gold-light" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid Table */}
      <div className="bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-mocha/10 text-brand-mocha-muted uppercase text-[10px] tracking-wider bg-brand-cream/30">
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Category Name & Slug</th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mocha/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-mocha-muted">
                    Loading categories...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-red-700">
                    {loadError}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-mocha-muted">
                    No categories found. Create your first one above!
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-brand-sand/15 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-gold-dark">
                      #{cat.sortOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-cream border-2 border-brand-gold/40 flex-shrink-0 p-1.5">
                          <Image
                            src={
                              cat.imageUrl ||
                              "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80"
                            }
                            alt={cat.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-brand-mocha text-sm">{cat.name}</div>
                          <div className="text-[10px] font-mono text-brand-mocha-muted">
                            /{cat.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-brand-gold/15 px-2.5 py-1 font-semibold text-brand-mocha">
                        {productCounts[cat.id] || 0}{" "}
                        {(productCounts[cat.id] || 0) === 1 ? "product" : "products"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-mocha-muted max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {cat.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <Eye className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 font-semibold text-[11px]">
                          <EyeOff className="w-3.5 h-3.5" /> Hidden
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-brand-mocha-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-warm rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-brand-mocha/10 shadow-2xl space-y-5">
            <h2 className="font-serif text-xl font-bold text-brand-mocha">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Resin Jewellery"
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="resin-jewellery"
                    className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs font-mono text-brand-mocha focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the jewellery styles and pieces in this category..."
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-2.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Category Banner Image
                </label>
                <div className="mb-2">
                  <MediaUploadButton
                    accept="image/*"
                    label="Upload category image"
                    onUploaded={(urls) => setFormImageUrl(urls[0] || "")}
                  />
                </div>
                <input
                  type="text"
                  inputMode="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Uploaded file path or optional image URL"
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
                {formImageUrl && (
                  <div className="relative mt-2 h-48 overflow-hidden rounded-xl border-2 border-brand-gold/40 bg-brand-warm p-3">
                    <Image
                      src={formImageUrl}
                      alt="Category image preview"
                      fill
                      sizes="440px"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                  Category Video (Optional)
                </label>
                <div className="mb-2">
                  <MediaUploadButton
                    accept="video/*"
                    label="Upload category video"
                    onUploaded={(urls) => setFormVideoUrl(urls[0] || "")}
                  />
                </div>
                <input
                  type="text"
                  inputMode="url"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="Uploaded file path or optional video URL"
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                />
                {formVideoUrl && (
                  <video
                    src={formVideoUrl}
                    controls
                    preload="metadata"
                    className="mt-2 max-h-40 w-full rounded-xl bg-black"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded text-brand-mocha focus:ring-brand-gold"
                />
                <label htmlFor="pubCheck" className="font-semibold text-brand-mocha cursor-pointer">
                  Publish category to storefront navigation
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-brand-mocha/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-brand-ivory border border-brand-mocha/20 rounded-full font-semibold text-brand-mocha hover:bg-brand-sand/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full font-bold shadow-soft"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
