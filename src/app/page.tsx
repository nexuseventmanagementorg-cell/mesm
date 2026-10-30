import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Star,
  ChevronRight,
  HelpCircle,
  Gem,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { CategoryImage } from "@/components/layout/CategoryImage";
import { HeroVideo } from "@/components/layout/HeroVideo";
import { ProductCard } from "@/components/product/ProductCard";
import { MagicalPopText } from "@/components/layout/MagicalPopText";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getCategories,
  getPopularProducts,
  getProducts,
  getReviews,
  getStoreSettings,
} from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const revalidate = 0; // Dynamic on request for live inventory & orders

export default async function HomePage() {
  const isDevelopmentSampleStore =
    process.env.NODE_ENV !== "production" && !isSupabaseConfigured();
  const settings = await getStoreSettings();
  const categories = await getCategories(false);
  const popularData = await getPopularProducts(4);
  const { products: newArrivals } = await getProducts({
    status: "published",
    sortBy: "newest",
    limit: 8,
  });
  const reviews = await getReviews();

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} categories={categories} />
      {isDevelopmentSampleStore && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Development preview — sample catalogue and order data, not live store inventory.
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-mocha-dark via-brand-mocha to-brand-rose pt-8 pb-16 text-brand-ivory lg:pt-16 lg:pb-24">
        {/* Soft decorative background circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-rose/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-brand-gold/20 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="flex items-center justify-center gap-3 lg:justify-start">
                <div className="hero-brand-mark relative h-[82px] w-[150px] flex-shrink-0 overflow-hidden rounded-xl border border-brand-gold/40 bg-brand-mocha shadow-gold">
                  <SiteLogo
                    logoUrl={settings.logoUrl}
                    alt="MESM — Personalized Accoutrements for Ladies"
                    sizes="150px"
                    priority
                    className="hero-brand-logo logo-image-zoom object-cover"
                  />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold-light">
                    Elegance, made personal
                  </span>
                  <span className="font-serif text-sm font-bold tracking-[0.12em] text-brand-ivory">
                    MESM
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cream border border-brand-gold/30 shadow-xs">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-mocha">
                  Personalized pieces for every occasion
                </span>
              </div>

              <h1 className="hero-headline font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-ivory leading-[1.25]">
                <span className="hero-title-lightning">Find Your Style.</span>
                <br />
                <span
                  className="hero-title-shine italic font-normal text-brand-gold-light"
                  data-glare="Designed to Shine."
                >
                  Designed to Shine.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-brand-ivory/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                {settings.supportingCopy ||
                  "Discover a carefully selected collection of modern and traditional jewellery, with styles for everyday wear and special occasions."}
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:flex-col lg:items-start xl:flex-row xl:items-center">
                <Link
                  href="/shop"
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-mocha text-sm font-semibold rounded-full shadow-card transition-all duration-300 flex items-center justify-center gap-2.5 group"
                >
                  <span>Explore The Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  disabled
                  aria-label="Pressed Flower Resin — Coming Soon"
                  className="w-full sm:w-auto px-7 py-3.5 bg-brand-warm/95 border border-brand-gold/40 text-brand-mocha/75 text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-soft cursor-not-allowed"
                >
                  <Gem className="w-4 h-4 text-brand-gold" />
                  <span>Pressed Flower Resin — Coming Soon</span>
                </button>
              </div>

            </div>

            {/* Right Hero Visual Cards */}
            <div className="lg:col-span-7 relative">
              <div className="relative mx-auto mt-10 w-full max-w-none">
                <p
                  aria-label="Where Every Style Tells Your Story."
                  className="mb-3 text-center font-signature text-2xl font-semibold text-brand-gold-light sm:text-3xl"
                >
                  <span className="hero-tagline-word" aria-hidden="true">Where</span>{" "}
                  <span className="hero-tagline-word" aria-hidden="true">Every</span>{" "}
                  <span className="hero-tagline-word" aria-hidden="true">Style</span>{" "}
                  <span className="hero-tagline-word" aria-hidden="true">Tells</span>{" "}
                  <span className="hero-tagline-word" aria-hidden="true">Your</span>{" "}
                  <span className="hero-tagline-word" aria-hidden="true">Story.</span>
                </p>
                <HeroVideo />
              </div>
            </div>

            {/* Store highlights and shop link share a row below the hero */}
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-brand-ivory/20 pt-6 text-left sm:grid-cols-4 sm:gap-4 lg:col-span-12">
              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-ivory/10 text-brand-gold-light">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-ivory">Free Delivery</div>
                  <div className="text-[11px] text-brand-ivory/70">
                    {settings.freeDeliveryThreshold > 0
                      ? `Orders over ${formatPrice(settings.freeDeliveryThreshold)}`
                      : "Shown at checkout"}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-ivory/10 text-brand-gold-light">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-ivory">Curated Styles</div>
                  <div className="text-[11px] text-brand-ivory/70">Modern & traditional</div>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-ivory/10 text-brand-gold-light">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-ivory">WhatsApp Order</div>
                  <div className="text-[11px] text-brand-ivory/70">Instant confirmation</div>
                </div>
              </div>

              <Link
                href="/shop"
                className="col-span-2 flex min-w-0 items-center gap-3 rounded-2xl border border-brand-gold/25 bg-brand-warm p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[5px] hover:border-[#E6C98F] hover:shadow-[0_12px_36px_rgba(230,201,143,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C98F] sm:col-span-1 sm:gap-3.5 sm:p-3 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-mocha sm:h-14 sm:w-14">
                  <Gem className="h-6 w-6 text-brand-gold-light" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="font-serif text-xs font-bold text-brand-mocha sm:text-sm">
                    MESM
                  </div>
                  <div className="text-[11px] font-medium text-brand-gold-dark">
                    Original Handcrafts
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold text-brand-mocha">
                    Shop Now →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="py-14 bg-brand-cream/40 border-y border-brand-mocha/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
                Curated Collections
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
                <MagicalPopText text="Shop by Jewellery Category" />
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-semibold text-brand-mocha hover:text-brand-gold transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-brand-cream border-2 border-brand-gold/40 shadow-soft transition-all duration-300 flex flex-col justify-end p-3 sm:p-4 text-center hover:-translate-y-2 hover:scale-[1.02] hover:border-brand-gold hover:shadow-[0_16px_34px_rgba(196,154,80,0.3)] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <CategoryImage
                  src={cat.imageUrl}
                  videoUrl={cat.videoUrl}
                  alt={cat.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-mocha/80 via-brand-mocha/20 to-transparent" />
                <div className="relative z-10">
                  <h3 className={`font-serif font-bold text-brand-ivory transition-colors group-hover:text-brand-gold-light ${
                    cat.name === "Armlets & Armcuffs"
                      ? "whitespace-nowrap text-xs tracking-tight"
                      : "text-sm sm:text-base"
                  }`}>
                    <MagicalPopText text={cat.name} />
                  </h3>
                  <span className="text-[10px] sm:text-xs text-brand-ivory/80 font-sans tracking-wide">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR PRODUCTS / CUSTOMER FAVOURITES (From actual order history!) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-gold-dark mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customer Favourites</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
                <MagicalPopText text="Most Popular Pieces" />
              </h2>
              <p className="text-xs sm:text-sm text-brand-mocha-muted mt-1">
                Ranked from saved, non-cancelled orders.
              </p>
            </div>
            <Link
              href="/shop?collection=best-sellers"
              className="text-xs sm:text-sm font-semibold text-brand-mocha hover:text-brand-gold transition-colors flex items-center gap-1"
            >
              <span>Explore All Favourites</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularData.map(({ product, isBestseller }) => (
              <ProductCard
                key={product.id}
                product={product}
                isBestseller={isBestseller}
                magicalTitle
              />
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-16 bg-brand-cream/30 border-t border-brand-mocha/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
                Just Added
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
                <MagicalPopText text="New Arrivals" />
              </h2>
            </div>
            <Link
              href="/shop?collection=new-in"
              className="text-xs sm:text-sm font-semibold text-brand-mocha hover:text-brand-gold transition-colors flex items-center gap-1"
            >
              <span>View All New Arrivals</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} magicalTitle />
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY & STYLE PHILOSOPHY */}
      <section className="py-20 relative overflow-hidden bg-brand-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-ivory rounded-3xl p-8 sm:p-12 lg:p-16 border border-brand-gold/25 shadow-card relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Brand Story Image */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto aspect-[768/819] w-full max-w-[420px] overflow-hidden rounded-2xl border-2 border-brand-gold/40 bg-brand-mocha shadow-glass">
                  <Image
                    src="/images/mesm-brand-story.png"
                    alt="MESM jewellery and accessories styled for every special detail"
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="brand-story-image object-cover"
                  />
                </div>
              </div>

              {/* Story Copy */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream text-brand-gold-dark text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Our Jewellery Edit
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-mocha">
                  <MagicalPopText text="Jewellery for Every Story" />
                </h2>

                <p className="text-sm sm:text-base text-brand-mocha-muted leading-relaxed font-sans">
                  {settings.aboutUs ||
                    "MESM brings together distinctive jewellery and personalized accessories for women who love expressing their personal style."}
                </p>

                <p className="text-sm sm:text-base text-brand-mocha-muted leading-relaxed font-sans">
                  Explore everyday favourites, elegant occasion wear, and eye-catching statement pieces. Find a style for yourself or a thoughtful gift for someone special.
                </p>

                <div className="pt-2">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors shadow-soft"
                  >
                    <span>Read More About Us</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPROVED CUSTOMER REVIEWS */}
      {reviews.length > 0 && (
        <section className="py-16 bg-brand-cream/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
              Customer Reviews
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
              <MagicalPopText text="Notes from Our Customers" />
            </h2>
            <p className="text-xs sm:text-sm text-brand-mocha-muted mt-1">
              Reviews approved by the MESM team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 bg-brand-warm rounded-2xl border border-brand-mocha/10 shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-500 mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-brand-mocha italic leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-brand-mocha/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-mocha">{rev.customerName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Order
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </section>
      )}

      {/* FAQ SECTION */}
      <section className="py-16 bg-brand-warm border-t border-brand-mocha/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
              <MagicalPopText text="Ordering & Jewellery Care" />
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group p-5 bg-brand-ivory rounded-2xl border border-brand-mocha/10">
              <summary className="list-none cursor-pointer font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-gold" />
                <span className="flex-1">
                  <MagicalPopText text="How does WhatsApp order confirmation work?" />
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="text-xs sm:text-sm text-brand-mocha-muted mt-3 leading-relaxed">
                When you click &ldquo;Place Order via WhatsApp&rdquo; at checkout, your order is safely saved in our system first with a unique order number. Then, WhatsApp opens with your prefilled order receipt. Simply press Send in WhatsApp to chat with our team.
              </p>
            </details>

            <details className="group p-5 bg-brand-ivory rounded-2xl border border-brand-mocha/10">
              <summary className="list-none cursor-pointer font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-gold" />
                <span className="flex-1">
                  <MagicalPopText text="How is a manual payment confirmed?" />
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="text-xs sm:text-sm text-brand-mocha-muted mt-3 leading-relaxed">
                Available payment methods and instructions are shown at checkout. A transfer receipt can be shared with the store, but payment is only marked as received after the team verifies it.
              </p>
            </details>

            <details className="group p-5 bg-brand-ivory rounded-2xl border border-brand-mocha/10">
              <summary className="list-none cursor-pointer font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-gold" />
                <span className="flex-1">
                  <MagicalPopText text="How do I care for resin and fashion jewellery?" />
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="text-xs sm:text-sm text-brand-mocha-muted mt-3 leading-relaxed">
                Store your jewellery in the provided MESM pouch or an airtight box away from direct sunlight. Avoid direct contact with harsh perfumes, chlorine, hairspray, and extreme water exposure.
              </p>
            </details>
          </div>

          <div className="mt-7 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-mocha hover:text-brand-gold-dark">
              Visit our help centre <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </div>
  );
}
