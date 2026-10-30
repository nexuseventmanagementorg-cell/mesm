import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CategoryImage } from "@/components/layout/CategoryImage";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { InStockOnlyFilter, ShopSortSelector } from "@/components/product/ShopFilters";
import { MagicalPopText } from "@/components/layout/MagicalPopText";
import { getCategories, getProducts, getStoreSettings } from "@/lib/db";
import type { Product } from "@/types";
import { ArrowDown, ArrowRight, Filter, Search, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface ShopPageProps {
  searchParams: {
    collection?: string;
    category?: string;
    search?: string;
    sort?: "newest" | "price_asc" | "price_desc" | "popularity";
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export const revalidate = 0;

const editorialCollections = {
  "new-in": {
    eyebrow: "Just arrived, waiting to become yours",
    title: "A little something that feels like you",
    introduction:
      "Meet the newest MESM pieces: thoughtful finishing touches for the days you want to feel effortlessly unforgettable.",
    storyTitle: "Your next compliment starts here",
    story:
      "The right detail can change how you carry yourself. Discover fresh designs made to bring a little more confidence, colour, and occasion to your everyday style. Find the one that feels unmistakably you.",
    note: "Freshly added to MESM",
    accent: "from-[#260301] via-[#260301] to-[#260301]",
  },
  "best-sellers": {
    eyebrow: "Chosen and loved by our customers",
    title: "The pieces that make every look feel special",
    introduction:
      "Discover the designs customers reach for when they want a little extra confidence, charm, and shine.",
    storyTitle: "A favourite you will reach for again",
    story:
      "From meaningful celebrations to ordinary days made brighter, these much-loved pieces have already found a place in customers’ stories. Explore the favourites, then choose the one you will make your own.",
    note: "Ranked by completed orders",
    accent: "from-[#260301] via-[#260301] to-[#260301]",
  },
  "gift-picks": {
    eyebrow: "A little joy, beautifully chosen",
    title: "Give her a moment she will remember",
    introduction:
      "For birthdays, celebrations, thank-yous, and all the “just because I love you” moments in between.",
    storyTitle: "More than a present: a little reminder of you",
    story:
      "Choose a piece she can wear long after the wrapping is gone. From graceful everyday accents to celebration-ready sparkle, find a thoughtful surprise that says you know her style—and that you were thinking of her.",
    note: "Gift-worthy designs, chosen with care",
    accent: "from-[#260301] via-[#260301] to-[#260301]",
  },
} as const;

function getEditorialCollection(value?: string) {
  return value && Object.prototype.hasOwnProperty.call(editorialCollections, value)
    ? (value as keyof typeof editorialCollections)
    : undefined;
}

function pickUniqueImageProduct(
  candidates: Product[],
  usedImages: Set<string>,
  usedProducts: Set<string>
) {
  return candidates.find(
    (product) =>
      !usedProducts.has(product.id) &&
      Boolean(product.images[0]) &&
      !usedImages.has(product.images[0])
  );
}

function shuffleForCollection(products: Product[], collection: string) {
  const score = (product: Product) => {
    let hash = 0;
    for (const character of `${collection}:${product.id}`) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    return hash >>> 0;
  };

  return [...products].sort(
    (first, second) =>
      score(first) - score(second) || first.id.localeCompare(second.id)
  );
}

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const collection = getEditorialCollection(searchParams.collection);
  if (!collection) {
    return {
      title: "MESM | Personalized Accoutrements for Ladies",
    };
  }

  const editorial = editorialCollections[collection];
  return {
    title: `${editorial.title} | MESM`,
    description: editorial.introduction,
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const settings = await getStoreSettings();
  const categories = await getCategories(false);

  const categorySlug = searchParams.category || "all";
  const search = searchParams.search || "";
  const collection = getEditorialCollection(searchParams.collection);
  const sort =
    searchParams.sort ||
    (collection === "best-sellers" ? "popularity" : "newest");
  const inStockOnly = searchParams.inStock === "true";
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = 12;

  const [
    { products, total, totalPages },
    { products: newestCandidates },
    { products: popularCandidates },
  ] = await Promise.all([
    getProducts({
      categorySlug: categorySlug !== "all" ? categorySlug : undefined,
      search: search || undefined,
      giftSuitableOnly: collection === "gift-picks",
      sortBy: sort,
      inStockOnly,
      minPrice,
      maxPrice,
      page,
      limit,
      status: "published",
    }),
    getProducts({ status: "published", sortBy: "newest", limit: 100 }),
    getProducts({ status: "published", sortBy: "popularity", limit: 100 }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const editorial = collection ? editorialCollections[collection] : undefined;
  const usedHeroImages = new Set<string>();
  const usedHeroProducts = new Set<string>();
  const newInHero = pickUniqueImageProduct(
    shuffleForCollection(newestCandidates, "new-in"),
    usedHeroImages,
    usedHeroProducts
  );
  if (newInHero) {
    usedHeroProducts.add(newInHero.id);
    usedHeroImages.add(newInHero.images[0]);
  }
  const bestSellerHero = pickUniqueImageProduct(
    shuffleForCollection(popularCandidates, "best-sellers"),
    usedHeroImages,
    usedHeroProducts
  );
  if (bestSellerHero) {
    usedHeroProducts.add(bestSellerHero.id);
    usedHeroImages.add(bestSellerHero.images[0]);
  }
  const giftHero = pickUniqueImageProduct(
    shuffleForCollection(
      newestCandidates.filter((product) =>
        product.tags.some((tag) =>
          tag.replace(/^#+/, "").toLowerCase().includes("giftforher")
        )
      ),
      "gift-picks"
    ),
    usedHeroImages,
    usedHeroProducts
  );
  const editorialHero =
    collection === "new-in"
      ? newInHero
      : collection === "best-sellers"
        ? bestSellerHero
        : collection === "gift-picks"
          ? giftHero
          : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} categories={categories} />

      {!editorial && (
        <div className="bg-brand-cream/60 border-b border-brand-mocha/10 py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-6 text-center">
            {activeCategory?.imageUrl && (
              <div className="relative hidden h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-brand-gold/50 bg-brand-warm p-1.5 shadow-soft sm:block lg:h-56 lg:w-56">
                <CategoryImage
                  src={activeCategory.imageUrl}
                  videoUrl={activeCategory.videoUrl}
                  alt={activeCategory.name}
                />
              </div>
            )}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Jewellery Catalogue
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-mocha">
                {activeCategory ? activeCategory.name : "Modern & Traditional Jewellery"}
              </h1>
              <p className="text-xs sm:text-sm text-brand-mocha-muted">
                {activeCategory?.description ||
                  "Browse a carefully selected range of modern and traditional jewellery, from everyday favourites to statement styles."}
              </p>
            </div>
          </div>
        </div>
      )}

      {editorial && (
        <section className="border-b border-brand-mocha/10 bg-brand-warm px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-brand-gold/20 bg-brand-ivory shadow-card lg:grid-cols-12">
            <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:col-span-7 lg:px-14">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-cream px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-dark sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <MagicalPopText text={editorial.eyebrow} />
              </span>
              <h1 className="mt-5 max-w-xl font-serif text-3xl font-bold leading-tight text-brand-mocha sm:text-4xl lg:text-5xl">
                {editorial.title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-brand-mocha-muted sm:text-base">
                {editorial.introduction}
              </p>
              <div className="mt-7 border-l-2 border-brand-gold/60 pl-4">
                <h3 className="font-serif text-lg font-bold text-brand-mocha">
                  {editorial.storyTitle}
                </h3>
                <p className="mt-2 max-w-lg text-xs leading-relaxed text-brand-mocha-muted sm:text-sm">
                  {editorial.story}
                </p>
              </div>
              <Link
                href="#collection-products"
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-brand-mocha px-5 py-3 text-xs font-semibold text-brand-ivory transition-colors hover:bg-brand-mocha-dark"
              >
                Explore the edit <ArrowDown className="h-4 w-4 text-brand-gold-light" />
              </Link>
            </div>
            <div className={`editorial-feature-float relative min-h-[280px] overflow-hidden bg-gradient-to-br ${editorial.accent} lg:col-span-5 lg:min-h-[500px] lg:rounded-l-[3rem] lg:border-l lg:border-brand-gold/20`}>
              {editorialHero?.images[0] ? (
                <Image
                  src={editorialHero.images[0]}
                  alt={editorialHero.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="rounded-2xl object-contain p-6 sm:rounded-3xl sm:p-10"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-20 w-20 text-brand-mocha/20" />
                </div>
              )}
              {editorialHero && (
                <Link
                  href={`/product/${editorialHero.slug}`}
                  className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-gold/40 bg-[#2b1009]/95 p-4 text-[#fff7ec] shadow-card sm:bottom-6 sm:left-6 sm:right-6"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-[#f4c879]">
                      {editorial.note}
                    </span>
                    <span className="mt-1 block line-clamp-2 font-serif text-sm font-bold leading-snug text-[#fff7ec]">
                      {editorialHero.name}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 flex-shrink-0 text-[#f4c879]" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-mocha/10">
                <h3 className="shop-filter-lightning font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-gold" /> Filter Catalogue
                </h3>
                {(categorySlug !== "all" || search || inStockOnly || minPrice || maxPrice) && (
                  <Link
                    href="/shop"
                    className="text-xs text-brand-gold-dark hover:underline font-semibold"
                  >
                    Reset
                  </Link>
                )}
              </div>

              {/* Category Filter */}
              <div id="category-catalogue" className="scroll-mt-32">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark mb-3">
                  Categories
                </h4>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <Link
                    href={`/shop?sort=${sort}${search ? `&search=${search}` : ""}${collection ? `&collection=${collection}` : ""}`}
                    className={`group block rounded-lg border border-transparent py-1.5 px-3 transition-all duration-200 hover:translate-x-1 hover:border-brand-gold/40 hover:shadow-soft ${
                      categorySlug === "all"
                        ? "bg-brand-mocha text-brand-ivory font-semibold"
                        : "text-brand-mocha hover:bg-brand-sand/40"
                    }`}
                  >
                    <span className="shop-filter-lightning">All Collections</span>
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/shop?category=${encodeURIComponent(c.slug)}&sort=${sort}${
                        search ? `&search=${search}` : ""
                      }${collection ? `&collection=${collection}` : ""}`}
                      className={`group flex items-center gap-2.5 rounded-lg border border-transparent py-1.5 px-2 transition-all duration-200 hover:translate-x-1 hover:border-brand-gold/40 hover:shadow-soft ${
                        categorySlug === c.slug
                          ? "bg-brand-mocha text-brand-ivory font-semibold"
                          : "text-brand-mocha hover:bg-brand-sand/40"
                      }`}
                    >
                      {c.imageUrl && (
                        <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-brand-gold/40 bg-brand-cream p-1">
                          <CategoryImage
                            src={c.imageUrl}
                            alt=""
                          />
                        </span>
                      )}
                      <span className="shop-filter-lightning">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="pt-4 border-t border-brand-mocha/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark mb-2">
                  Availability
                </h4>
                <label className="flex items-center gap-2 text-xs sm:text-sm text-brand-mocha cursor-pointer">
                  <InStockOnlyFilter checked={inStockOnly} />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Price Filter */}
              <div className="pt-4 border-t border-brand-mocha/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark mb-3">
                  Price (PKR)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/shop?category=${categorySlug}&maxPrice=1500&sort=${sort}${collection ? `&collection=${collection}` : ""}`}
                    className="py-1.5 px-2 bg-brand-ivory border border-brand-mocha/10 rounded-lg text-center hover:border-brand-gold"
                  >
                    Under 1,500
                  </Link>
                  <Link
                    href={`/shop?category=${categorySlug}&minPrice=1500&maxPrice=3000&sort=${sort}${collection ? `&collection=${collection}` : ""}`}
                    className="py-1.5 px-2 bg-brand-ivory border border-brand-mocha/10 rounded-lg text-center hover:border-brand-gold"
                  >
                    1,500 - 3,000
                  </Link>
                  <Link
                    href={`/shop?category=${categorySlug}&minPrice=3000&sort=${sort}${collection ? `&collection=${collection}` : ""}`}
                    className="py-1.5 px-2 bg-brand-ivory border border-brand-mocha/10 rounded-lg text-center hover:border-brand-gold col-span-2"
                  >
                    3,000+ (Free Delivery Eligible)
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main id="collection-products" className="lg:col-span-3 space-y-6 scroll-mt-36">
            {/* Control Bar: Search & Sort */}
            <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-brand-mocha-muted">
                Showing <strong className="text-brand-mocha">{products.length}</strong> of{" "}
                <strong className="text-brand-mocha">{total}</strong> jewellery items
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-brand-mocha flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand-gold" /> Sort:
                </span>
                <ShopSortSelector sort={sort} />
              </div>
            </div>

            {/* Product Cards Grid */}
            {products.length === 0 ? (
              <div className="p-12 text-center bg-brand-warm rounded-3xl border border-brand-mocha/10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-cream mx-auto flex items-center justify-center text-brand-mocha-muted">
                  <Search className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-mocha">
                  No matching jewellery found
                </h3>
                <p className="text-xs sm:text-sm text-brand-mocha-muted max-w-sm mx-auto">
                  Try clearing your search query or adjusting your category and price filters.
                </p>
                <Link
                  href={collection ? `/shop?collection=${collection}` : "/shop"}
                  className="inline-block px-6 py-2.5 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors"
                >
                  Reset All Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {products.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isBestseller={collection === "best-sellers" && Boolean(prod.orderCount)}
                    showDescription={Boolean(editorial)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/shop?category=${categorySlug}&sort=${sort}&page=${page - 1}${
                      search ? `&search=${search}` : ""
                    }${collection ? `&collection=${collection}` : ""}`}
                    className="p-2 rounded-full bg-brand-warm border border-brand-mocha/10 text-brand-mocha hover:bg-brand-sand transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}

                <div className="flex items-center gap-1 text-xs font-semibold">
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        href={`/shop?category=${categorySlug}&sort=${sort}&page=${p}${
                          search ? `&search=${search}` : ""
                        }${collection ? `&collection=${collection}` : ""}`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          p === page
                            ? "bg-brand-mocha text-brand-ivory"
                            : "bg-brand-warm border border-brand-mocha/10 text-brand-mocha hover:bg-brand-sand"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`/shop?category=${categorySlug}&sort=${sort}&page=${page + 1}${
                      search ? `&search=${search}` : ""
                    }${collection ? `&collection=${collection}` : ""}`}
                    className="p-2 rounded-full bg-brand-warm border border-brand-mocha/10 text-brand-mocha hover:bg-brand-sand transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer settings={settings} />
    </div>
  );
}
