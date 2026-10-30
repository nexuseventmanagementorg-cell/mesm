"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap, Plus, Minus, Check, AlertCircle } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import {
  getAvailableVariationOptions,
  getDefaultVariationSelections,
  hasAvailableVariantSelection,
  isVariationOptionAvailable,
} from "@/lib/variation-availability.mjs";

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Selected variation state map
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>(
    () => getDefaultVariationSelections(product.variations)
  );

  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isOutOfStock =
    product.trackInventory && product.stockQuantity <= 0 && !product.allowBackorders;
  const maxStock = product.trackInventory ? product.stockQuantity : 99;
  const hasAvailableOptions = hasAvailableVariantSelection(product.variations);
  const hasCompleteAvailableSelection =
    hasAvailableOptions &&
    product.variations.every(
      (variation) =>
        variation.options.length === 0 ||
        (Boolean(selectedVariations[variation.name]) &&
          isVariationOptionAvailable(
            variation,
            selectedVariations[variation.name]
          ))
    );
  const cannotPurchase = isOutOfStock || !hasCompleteAvailableSelection;

  const variationSummary = Object.entries(selectedVariations)
    .map(([name, val]) => `${name}: ${val}`)
    .join(", ");

  const handleAddToCart = () => {
    if (cannotPurchase) return;

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] || "/images/mesm-logo.png",
        maxStock: product.stockQuantity,
        selectedVariation: variationSummary || undefined,
        trackInventory: product.trackInventory,
      },
      quantity
    );

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    if (cannotPurchase) return;

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] || "/images/mesm-logo.png",
        maxStock: product.stockQuantity,
        selectedVariation: variationSummary || undefined,
        trackInventory: product.trackInventory,
      },
      quantity
    );

    router.push("/checkout");
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Variations Selection */}
      {product.variations.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-brand-mocha/10">
          {product.variations.map((v) => (
            <div key={v.id || v.name} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-mocha flex items-center justify-between">
                <span>{v.name}:</span>
                <span className="text-brand-gold-dark font-medium normal-case">
                  {selectedVariations[v.name] ||
                    (getAvailableVariationOptions(v).length > 0
                      ? "Select an option"
                      : "No available options")}
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => {
                  const isSelected = selectedVariations[v.name] === opt;
                  const isAvailable = isVariationOptionAvailable(v, opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() =>
                        setSelectedVariations((prev) => ({
                          ...prev,
                          [v.name]: opt,
                        }))
                      }
                      aria-pressed={isSelected}
                      aria-label={`${opt}${isAvailable ? "" : " (closed)"}`}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                        isSelected
                          ? "bg-brand-mocha text-brand-ivory border-brand-mocha shadow-soft"
                          : "bg-brand-warm border-brand-mocha/20 text-brand-mocha hover:border-brand-gold"
                      }`}
                    >
                      {opt}{!isAvailable && " (Closed)"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock warning */}
      {!hasAvailableOptions ? (
        <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>No available option combinations for this product.</span>
        </div>
      ) : !hasCompleteAvailableSelection ? (
        <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>Please select an available option.</span>
        </div>
      ) : product.trackInventory && !product.allowBackorders ? (
        <div className="text-xs">
          {product.stockQuantity <= 0 ? (
            <div className="flex items-center gap-1.5 text-red-600 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Currently out of stock. Contact our WhatsApp support for pre-orders.</span>
            </div>
          ) : product.stockQuantity <= product.lowStockThreshold ? (
            <div className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span>Hurry! Only {product.stockQuantity} items left in stock.</span>
            </div>
          ) : (
            <div className="text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>In stock & ready to dispatch (1-2 business days)</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Quantity & CTA Buttons */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-mocha">
            Quantity:
          </span>
          <div className="flex items-center border border-brand-mocha/20 rounded-full bg-brand-warm px-2 py-1 shadow-xs">
            <button
              type="button"
              disabled={quantity <= 1 || cannotPurchase}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 text-brand-mocha-muted hover:text-brand-mocha disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-brand-mocha">
              {quantity}
            </span>
            <button
              type="button"
              disabled={quantity >= maxStock || cannotPurchase}
              onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
              className="p-1 text-brand-mocha-muted hover:text-brand-mocha disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs text-brand-mocha-muted">
            Line Total: <strong>{formatPrice(product.price * quantity)}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Add to Cart */}
          <button
            type="button"
            disabled={cannotPurchase}
            onClick={handleAddToCart}
            className={`w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-soft ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-brand-warm hover:bg-brand-sand/60 text-brand-mocha border border-brand-mocha/20"
            } disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" /> Added to Bag!
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-brand-gold" /> Add to Bag
              </>
            )}
          </button>

          {/* Buy Now (Direct to Checkout) */}
          <button
            type="button"
            disabled={cannotPurchase}
            onClick={handleBuyNow}
            className="w-full py-3.5 px-6 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-card disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 text-brand-gold-light" />
            <span>Buy Now (WhatsApp Checkout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
