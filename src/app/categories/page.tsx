import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageOpen, Sparkles } from "lucide-react";
import { CategoryImage } from "@/components/layout/CategoryImage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  getCategories,
  getPublishedProductCountsByCategory,
  getStoreSettings,
} from "@/lib/db";

export const metadata: Metadata = {
  title: "Shop by Category | MESM",
  description: "Browse the MESM jewellery catalogue by category.",
};

export const revalidate = 0;

export default async function CategoriesPage() {
  const [settings, categories, productCounts] = await Promise.all([
    getStoreSettings(),
    getCategories(false),
    getPublishedProductCountsByCategory(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} categories={categories} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-gold-dark">
            <Sparkles className="h-3.5 w-3.5" />
            Find Your Style
          </span>
          <h1 className="font-serif text-3xl font-bold text-brand-mocha sm:text-4xl">
            Shop by Category
          </h1>
          <p className="mt-3 text-sm text-brand-mocha-muted sm:text-base">
            Choose a collection to explore its jewellery and accessories.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group overflow-hidden rounded-2xl border border-brand-mocha/10 bg-brand-warm shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/50 hover:shadow-card"
            >
              <div className="relative aspect-square overflow-hidden border-b border-brand-mocha/10 bg-brand-cream p-2 sm:p-3">
                <CategoryImage
                  src={category.imageUrl}
                  alt={category.name}
                />
              </div>
              <div className="flex min-h-[76px] items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <span className="min-w-0">
                  <span className="block truncate font-serif text-sm font-bold text-brand-mocha transition-colors group-hover:text-brand-gold-dark sm:text-base">
                    {category.name}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-mocha-muted">
                    <PackageOpen className="h-3 w-3 text-brand-gold-dark" />
                    {productCounts[category.id] || 0}{" "}
                    {(productCounts[category.id] || 0) === 1 ? "product" : "products"}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-brand-gold transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
