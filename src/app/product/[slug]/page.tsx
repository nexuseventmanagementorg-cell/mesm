import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductDetailActions } from "@/components/product/ProductDetailActions";
import { SocialShare } from "@/components/product/SocialShare";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug, getProducts, getStoreSettings } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, ShieldCheck, Truck, Sparkles, Package, RefreshCw } from "lucide-react";
import { Metadata } from "next";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 0;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== "published") {
    return { title: "Product Not Found | MESM" };
  }

  return {
    title: `${product.name} | MESM Jewellery`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} — MESM`,
      description: product.shortDescription,
      images: product.images[0] ? [product.images[0]] : ["/images/mesm-logo.png"],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== "published") {
    notFound();
  }

  const settings = await getStoreSettings();

  // Get related products from same category
  const { products: relatedProducts } = await getProducts({
    categoryId: product.categoryId,
    status: "published",
    limit: 4,
  });

  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} />

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <nav className="flex items-center gap-2 text-xs text-brand-mocha-muted">
          <Link href="/" className="hover:text-brand-gold transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-mocha-muted/60" />
          <Link href="/shop" className="hover:text-brand-gold transition-colors">
            Catalogue
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-mocha-muted/60" />
          <Link
            href={`/shop?category=${product.categoryId}`}
            className="hover:text-brand-gold transition-colors"
          >
            {product.categoryName || "Collection"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-mocha-muted/60" />
          <span className="text-brand-mocha font-semibold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Main Product Showcase */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={product.images}
              productName={product.name}
              videoUrl={product.videoUrl}
            />
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-brand-mocha-muted mb-2">
                <span className="font-bold uppercase tracking-wider text-brand-gold-dark">
                  {product.categoryName || "Jewellery"}
                </span>
                <span className="font-mono text-[11px]">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha leading-tight">
                {product.name}
              </h1>

              {/* Price & Discount */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-brand-mocha">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="text-base text-brand-mocha-muted line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                    {discountPercent && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-rose text-brand-mocha-dark">
                        Save {discountPercent}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed font-sans border-t border-brand-mocha/10 pt-4">
                {product.shortDescription}
              </p>
            )}

            {/* Interactive Variations, Quantity, Add to Cart & Buy Now */}
            <ProductDetailActions product={product} />

            {/* Trust Perks Banner */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-brand-cream/50 rounded-2xl border border-brand-mocha/10 text-xs text-brand-mocha">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Fast Nationwide Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Product Details at Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Delivery details at checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Carefully described pieces</span>
              </div>
            </div>

            {/* Social Share & QR Code Controls */}
            <SocialShare product={product} />
          </div>
        </div>

        {/* Detailed Information Tabs / Specifications */}
        <div className="mt-16 pt-12 border-t border-brand-mocha/10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-mocha">
              Craftsmanship & Story
            </h2>
            <div className="prose prose-brand text-xs sm:text-sm text-brand-mocha-muted leading-relaxed space-y-4">
              <p>{product.description}</p>
            </div>

            {/* Product Attributes Table (Only shows non-blank fields!) */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="pt-4">
                <h3 className="font-serif text-lg font-bold text-brand-mocha mb-3">
                  Specifications
                </h3>
                <div className="bg-brand-warm rounded-2xl border border-brand-mocha/10 overflow-hidden text-xs">
                  {product.attributes
                    .filter((attr) => attr.key?.trim() && attr.value?.trim())
                    .map((attr, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between py-2.5 px-4 ${
                          idx % 2 === 0 ? "bg-brand-cream/20" : "bg-brand-warm"
                        } border-b border-brand-mocha/5 last:border-b-0`}
                      >
                        <span className="font-semibold text-brand-mocha">{attr.key}</span>
                        <span className="text-brand-mocha-muted text-right max-w-xs">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Delivery & Care Guide */}
            <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-mocha flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-gold" /> Care & Preservation
              </h3>
              <p className="text-xs text-brand-mocha-muted leading-relaxed">
                To maintain the pristine shine of your jewellery, gently wipe with a soft microfiber cloth after wearing. Store in a cool, dry place. Keep resin pieces away from harsh acetone and chemical sprays.
              </p>
              <div className="pt-2 border-t border-brand-mocha/10 text-xs text-brand-mocha">
                <span className="font-semibold">Processing Time:</span>{" "}
                <span className="text-brand-mocha-muted">
                  {settings.processingTime || "1-2 Business Days"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <section className="mt-20 pt-12 border-t border-brand-mocha/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
                  You May Also Love
                </span>
                <h2 className="font-serif text-2xl font-bold text-brand-mocha">
                  More From {product.categoryName || "This Collection"}
                </h2>
              </div>
              <Link
                href={`/shop?category=${product.categoryId}`}
                className="text-xs sm:text-sm font-semibold text-brand-mocha hover:text-brand-gold transition-colors flex items-center gap-1"
              >
                <span>View More</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredRelated.map((relProd) => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
