"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryThreshold,
    remainingForFreeDelivery,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / freeDeliveryThreshold) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-mocha/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-warm shadow-2xl flex flex-col border-l border-brand-mocha/10">
          {/* Header */}
          <div className="p-5 border-b border-brand-mocha/10 flex items-center justify-between bg-brand-ivory">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-gold" />
              <h2 className="font-serif text-lg font-bold text-brand-mocha">Your Jewellery Bag</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-brand-gold/15 text-brand-mocha rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-brand-mocha-muted hover:text-brand-mocha rounded-full hover:bg-brand-sand/40"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free delivery threshold progress bar */}
          <div className="p-4 bg-brand-cream/60 border-b border-brand-mocha/10 text-xs">
            {remainingForFreeDelivery > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium text-brand-mocha">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Add{" "}
                    <strong>{formatPrice(remainingForFreeDelivery)}</strong> for FREE Delivery!
                  </span>
                  <span className="text-brand-gold-dark font-bold">{freeDeliveryProgress}%</span>
                </div>
                <div className="w-full h-2 bg-brand-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-gold-light to-brand-gold transition-all duration-300 rounded-full"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>You qualify for FREE Delivery across Pakistan!</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-brand-mocha-muted">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-mocha">Your bag is empty</h3>
                <p className="text-xs text-brand-mocha-muted max-w-xs">
                  Discover modern and traditional jewellery styles for everyday wear and special occasions.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-3 px-6 py-2.5 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-all shadow-soft"
                >
                  Explore Jewellery
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedVariation || "default"}`}
                  className="flex gap-3 p-3 bg-brand-ivory rounded-2xl border border-brand-mocha/10 shadow-xs relative"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-brand-cream flex-shrink-0 border border-brand-mocha/10">
                    <Image
                      src={item.image || "/images/mesm-logo.png"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-xs sm:text-sm font-semibold text-brand-mocha hover:text-brand-gold line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {item.selectedVariation && (
                        <p className="text-[11px] text-brand-mocha-muted mt-0.5 truncate">
                          {item.selectedVariation}
                        </p>
                      )}
                      <p className="text-xs font-bold text-brand-gold-dark mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-brand-mocha/20 rounded-full bg-brand-warm px-1.5 py-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.selectedVariation, item.quantity - 1)
                          }
                          className="p-1 text-brand-mocha-muted hover:text-brand-mocha"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-brand-mocha">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.selectedVariation, item.quantity + 1)
                          }
                          className="p-1 text-brand-mocha-muted hover:text-brand-mocha"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-medium text-brand-mocha-muted">
                        Total: {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeItem(item.productId, item.selectedVariation)}
                    className="absolute top-3 right-3 text-brand-mocha-muted hover:text-red-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-brand-mocha/10 bg-brand-ivory space-y-3">
              <div className="space-y-1.5 text-xs text-brand-mocha-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-mocha">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-brand-mocha">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-brand-mocha pt-2 border-t border-brand-mocha/10">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-gold-dark">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 px-4 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-all shadow-card"
                >
                  <span>Proceed to WhatsApp Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex justify-between items-center px-1 text-xs text-brand-mocha-muted">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your jewellery bag?")) {
                        clearCart();
                      }
                    }}
                    className="hover:text-red-600 transition-colors"
                  >
                    Clear Bag
                  </button>
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="hover:text-brand-gold transition-colors font-medium underline"
                  >
                    View Full Cart Page
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
