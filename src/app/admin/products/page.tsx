import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { PlusCircle, Search } from "lucide-react";
import { AdminProductRowActions } from "@/components/admin/AdminProductRowActions";
import { AdminQueryFilter } from "@/components/admin/AdminQueryFilter";

interface AdminProductsPageProps {
  searchParams: {
    search?: string;
    status?: string;
    category?: string;
    page?: string;
  };
}

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const search = searchParams.search || "";
  const status = searchParams.status || "all";
  const categorySlug = searchParams.category || "all";
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const categories = await getCategories(true);

  const pageSize = 50;
  const { products, total, page: currentPage, totalPages } = await getProducts({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    categorySlug: categorySlug !== "all" ? categorySlug : undefined,
    page,
    limit: pageSize,
    includePrivateFields: true,
  });
  const firstVisiblePage = Math.min(
    Math.max(1, currentPage - 2),
    Math.max(1, totalPages - 4)
  );
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index
  );

  const getPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (categorySlug !== "all") params.set("category", categorySlug);
    params.set("page", String(targetPage));
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="p-6 sm:p-10 space-y-6">
      {/* Header with prominent Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
            Catalogue Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
            Products ({total})
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="py-3 px-6 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-card transition-all"
        >
          <PlusCircle className="w-4 h-4 text-brand-gold-light" />
          <span>+ Add New Product</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <form className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by product title, SKU, or tags..."
            className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl pl-10 pr-4 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
          />
          <Search className="w-4 h-4 text-brand-mocha-muted absolute left-3.5 top-2.5" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <AdminQueryFilter
            parameter="status"
            value={status}
            label="Filter products by status"
            options={[
              { value: "all", label: "All Statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
          />

          {/* Category filter */}
          <AdminQueryFilter
            parameter="category"
            value={categorySlug}
            label="Filter products by category"
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((category) => ({
                value: category.slug,
                label: category.name,
              })),
            ]}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-mocha/10 text-brand-mocha-muted uppercase text-[10px] tracking-wider bg-brand-cream/30">
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mocha/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-mocha-muted">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-sand/15 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                          <Image
                            src={product.images[0] || "/images/mesm-logo.png"}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-brand-mocha line-clamp-1">
                            {product.name}
                          </div>
                          <div className="text-[10px] font-mono text-brand-mocha-muted">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-brand-mocha">
                      {product.categoryName || "Jewellery"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-mocha">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      {!product.trackInventory ? (
                        <span className="text-gray-500">Not Tracked</span>
                      ) : product.stockQuantity <= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : product.stockQuantity <= product.lowStockThreshold ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Low: {product.stockQuantity} pcs
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          {product.stockQuantity} in stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          product.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : product.status === "draft"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-mocha">
                      {product.orderCount || 0} sold
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AdminProductRowActions product={product} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-mocha-muted">
          Showing {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, total)} of {total} products
        </p>

        {totalPages > 1 && (
          <nav aria-label="Product pages" className="flex items-center gap-1">
            <Link
              href={getPageHref(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                currentPage === 1
                  ? "pointer-events-none text-brand-mocha-muted/50"
                  : "text-brand-mocha hover:bg-brand-sand/40"
              }`}
            >
              Previous
            </Link>
            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={getPageHref(pageNumber)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  pageNumber === currentPage
                    ? "bg-brand-mocha text-brand-ivory"
                    : "text-brand-mocha hover:bg-brand-sand/40"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
            <Link
              href={getPageHref(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                currentPage === totalPages
                  ? "pointer-events-none text-brand-mocha-muted/50"
                  : "text-brand-mocha hover:bg-brand-sand/40"
              }`}
            >
              Next
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
