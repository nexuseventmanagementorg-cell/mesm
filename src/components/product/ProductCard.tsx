"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { MagicalPopText } from "@/components/layout/MagicalPopText";
import {
  getDefaultVariationSelections,
  hasAvailableVariantSelection,
} from "@/lib/variation-availability.mjs";

interface ProductCardProps {
  product: Product;
  isBestseller?: boolean;
  showDescription?: boolean;
  magicalTitle?: boolean;
}

export function ProductCard({
  product,
  isBestseller,
  showDescription = false,
  magicalTitle = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [imageSrc, setImageSrc] = useState(
    product.images[0] || "/images/mesm-logo.png"
  );

  useEffect(() => {
    setImageSrc(product.images[0] || "/images/mesm-logo.png");
  }, [product.images]);

  const isOutOfStock =
    (product.trackInventory && product.stockQuantity <= 0 && !product.allowBackorders) ||
    !hasAvailableVariantSelection(product.variations);
  const isLowStock =
    product.trackInventory &&
    product.stockQuantity <= product.lowStockThreshold &&
    product.stockQuantity > 0;

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // Pick first variation default option if available
    const variationSummary = Object.entries(
      getDefaultVariationSelections(product.variations)
    )
      .map(([name, option]) => `${name}: ${option}`)
      .join(", ");

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: imageSrc,
        maxStock: product.stockQuantity,
        selectedVariation: variationSummary || undefined,
        trackInventory: product.trackInventory,
      },
      1
    );
  };

  return (
    <div className="group relative bg-brand-warm rounded-2xl sm:rounded-3xl border border-brand-mocha/10 overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-brand-cream/50"
      >
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={() => setImageSrc("/images/mesm-logo.png")}
        />

        {/* Badges Container */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isBestseller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-ivory shadow-xs">
              <Sparkles className="w-3 h-3 fill-brand-ivory" /> Bestseller
            </span>
          )}

          {discountPercent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-rose text-brand-mocha-dark shadow-xs">
              Save {discountPercent}%
            </span>
          )}

          {isOutOfStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-white shadow-xs">
              Sold Out
            </span>
          )}

          {isLowStock && !isOutOfStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
              Only {product.stockQuantity} Left
            </span>
          )}
        </div>

        {/* Quick Add Overlay on Desktop Hover */}
        {!isOutOfStock && (
          <div className="absolute inset-x-3 bottom-3 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={handleQuickAdd}
              className="w-full py-2.5 px-4 bg-brand-warm/95 hover:bg-brand-mocha hover:text-brand-ivory backdrop-blur-md text-brand-mocha text-xs font-semibold rounded-full shadow-lg transition-all flex items-center justify-center gap-2 border border-brand-mocha/10"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-gold" />
              <span>Quick Add to Bag</span>
            </button>
          </div>
        )}
      </Link>

      {/* Info Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-gold-dark">
            {product.categoryName || "Jewellery"}
          </span>

          {/* Title */}
          <h3 className="font-serif text-sm sm:text-base font-semibold text-brand-mocha mt-1 line-clamp-1 group-hover:text-brand-gold transition-colors">
            <Link href={`/product/${product.slug}`}>
              {magicalTitle ? (
                <MagicalPopText text={product.name} />
              ) : (
                product.name
              )}
            </Link>
          </h3>
          {showDescription && product.shortDescription && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-mocha-muted">
              {product.shortDescription}
            </p>
          )}

        </div>

        {/* Pricing & Mobile Quick Action */}
        <div className="mt-3 pt-2.5 border-t border-brand-mocha/5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-brand-mocha">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-brand-mocha-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Mobile quick add button */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="sm:hidden p-2 rounded-full bg-brand-mocha text-brand-ivory disabled:bg-gray-300 transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-brand-gold-light" />
          </button>
        </div>
      </div>
    </div>
  );
}
