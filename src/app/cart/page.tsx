"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

export default function CartPage() {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryThreshold,
    remainingForFreeDelivery,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / freeDeliveryThreshold) * 100)
  );

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <h1 className="font-serif text-3xl font-bold text-brand-mocha mb-8">
          Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
        </h1>

        {items.length === 0 ? (
          <div className="p-12 text-center bg-brand-warm rounded-3xl border border-brand-mocha/10 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-cream mx-auto flex items-center justify-center text-brand-mocha-muted">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-brand-mocha">
              Your bag is currently empty
            </h2>
            <p className="text-xs sm:text-sm text-brand-mocha-muted">
              Explore modern and traditional jewellery, from everyday favourites to standout pieces.
            </p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors shadow-soft"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free delivery banner */}
              <div className="p-4 bg-brand-cream rounded-2xl border border-brand-mocha/10 text-xs">
                {remainingForFreeDelivery > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-medium text-brand-mocha">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-gold" /> Add{" "}
                        <strong>{formatPrice(remainingForFreeDelivery)}</strong> more for FREE Nationwide Delivery!
                      </span>
                      <span className="text-brand-gold-dark font-bold">{freeDeliveryProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-brand-sand rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-gold-light to-brand-gold rounded-full"
                        style={{ width: `${freeDeliveryProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Congratulations! You qualify for FREE Delivery across Pakistan!</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-brand-warm rounded-3xl border border-brand-mocha/10 overflow-hidden divide-y divide-brand-mocha/10 shadow-soft">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedVariation || "def"}`}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                        <Image
                          src={item.image || "/images/mesm-logo.png"}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-serif text-sm sm:text-base font-semibold text-brand-mocha hover:text-brand-gold transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        {item.selectedVariation && (
                          <div className="text-xs text-brand-mocha-muted mt-0.5">
                            {item.selectedVariation}
                          </div>
                        )}
                        <div className="text-xs font-bold text-brand-gold-dark mt-1">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-brand-mocha/20 rounded-full bg-brand-ivory px-2 py-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.selectedVariation, item.quantity - 1)
                          }
                          className="p-1 text-brand-mocha-muted hover:text-brand-mocha"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-brand-mocha">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.selectedVariation, item.quantity + 1)
                          }
                          className="p-1 text-brand-mocha-muted hover:text-brand-mocha"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-sm font-bold text-brand-mocha min-w-[90px] text-right">
                        {formatPrice(item.price * item.quantity)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.productId, item.selectedVariation)}
                        className="p-1 text-brand-mocha-muted hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-2 text-xs">
                <button
                  onClick={() => {
                    if (confirm("Clear all items from your bag?")) clearCart();
                  }}
                  className="text-brand-mocha-muted hover:text-red-600 transition-colors"
                >
                  Clear Entire Bag
                </button>
                <Link href="/shop" className="text-brand-gold-dark hover:underline font-semibold">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-4">
              <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-card space-y-6">
                <h2 className="font-serif text-lg font-bold text-brand-mocha">Order Summary</h2>

                <div className="space-y-3 text-xs sm:text-sm text-brand-mocha-muted">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-mocha">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-brand-mocha">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase">FREE</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-brand-mocha/10 flex justify-between text-base font-bold text-brand-mocha">
                    <span>Total Amount</span>
                    <span className="text-brand-gold-dark">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-4 px-6 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-card transition-all"
                >
                  <span>Proceed to WhatsApp Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
