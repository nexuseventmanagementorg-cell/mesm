"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { StoreSettings } from "@/types";
import { formatPrice } from "@/lib/utils";
import { getAvailablePaymentMethods, isPaymentMethodAvailable } from "@/lib/payment-methods";
import {
  MessageCircle,
  AlertCircle,
  ArrowRight,
  Gift,
  CheckCircle2,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";

type CheckoutPaymentMethod = "easypaisa" | "jazzcash" | "cod" | "bank_transfer";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();

  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCity, setCustomerCity] = useState("Karachi");
  const [customCity, setCustomCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftMessage, setShowGiftMessage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("easypaisa");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofError, setPaymentProofError] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const availablePaymentMethods = getAvailablePaymentMethods(settings);

  // Fetch store settings for payment details and supported cities
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setPaymentMethod((current) => {
          if (isPaymentMethodAvailable(current, data)) return current;
          return (
            (["easypaisa", "jazzcash", "bank_transfer", "cod"] as const).find((method) =>
              isPaymentMethodAvailable(method, data)
            ) || current
          );
        });
        if (data.supportedCities && data.supportedCities.length > 0) {
          setCustomerCity(data.supportedCities[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load store settings", err);
      });
  }, []);

  const effectiveCity = customerCity === "Other" && customCity.trim() ? customCity.trim() : customerCity;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, "").length < 10) {
      setErrorMessage("Please enter a valid Pakistani contact phone/WhatsApp number (e.g. 03001234567).");
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage("Please provide your complete delivery address.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed.");
      return;
    }
    if (!isPaymentMethodAvailable(paymentMethod, settings)) {
      setErrorMessage("This payment option is not configured. Choose an available option or contact the store.");
      return;
    }
    if (paymentProofError) {
      setErrorMessage(paymentProofError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      let paymentProofUrl: string | undefined;
      if (paymentProofFile && paymentMethod !== "cod") {
        const uploadForm = new FormData();
        uploadForm.append("file", paymentProofFile);
        const uploadResponse = await fetch("/api/payment-proof", {
          method: "POST",
          body: uploadForm,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || "Unable to upload payment receipt.");
        }
        if (typeof uploadResult.url !== "string") {
          throw new Error("The receipt upload server returned an invalid response.");
        }
        paymentProofUrl = uploadResult.url;
      }

      // 1. Submit order to server database FIRST
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerCity: effectiveCity,
          deliveryAddress: deliveryAddress.trim(),
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          giftMessage: showGiftMessage ? giftMessage.trim() : undefined,
          paymentMethod,
          paymentProofUrl,
          items: items.map((i) => ({
            productId: i.productId,
            variationText: i.selectedVariation,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // 2. Order is safely saved! Clear guest cart.
      clearCart();

      // 3. Open WhatsApp in new tab / window if URL is present
      if (data.whatsappUrl) {
        try {
          window.open(data.whatsappUrl, "_blank");
        } catch (popupErr) {
          console.warn("Popup blocked, customer can still click link on confirmation page", popupErr);
        }
      }

      // 4. Redirect to order confirmation page
      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch (err: any) {
      console.error("Order placement error", err);
      setErrorMessage(err.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cream border border-brand-gold/30 text-xs font-semibold uppercase tracking-wider text-brand-mocha mb-2">
            <Lock className="w-3.5 h-3.5 text-brand-gold-dark" />
            <span>Fast Guest Checkout</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-mocha">
            Complete Your Jewellery Order
          </h1>
          <p className="text-xs sm:text-sm text-brand-mocha-muted mt-1">
            Fill in your delivery details below to generate your order receipt and confirm with our team on WhatsApp.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="max-w-md mx-auto p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-brand-gold mx-auto" />
            <h2 className="font-serif text-lg font-bold">Your bag is empty</h2>
            <p className="text-xs text-brand-mocha-muted">
              Add some sparkling jewellery pieces to your cart before proceeding to checkout.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Customer Form & Payment */}
            <div className="lg:col-span-7 space-y-8">
              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Contact & Delivery Info */}
              <div className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
                <h2 className="font-serif text-lg font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
                  <span className="w-6 h-6 rounded-full bg-brand-mocha text-brand-ivory text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Customer & Delivery Coordinates
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ayesha Malik"
                      className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Phone / WhatsApp Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                        WhatsApp / Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0300-1234567"
                        className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                      />
                      <span className="text-[10px] text-brand-mocha-muted mt-1 block">
                        We will send order tracking updates to this number.
                      </span>
                    </div>

                    {/* Email (Optional) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                        Email Address <span className="text-brand-mocha-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="ayesha@example.com"
                        className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>
                  </div>

                  {/* City Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold cursor-pointer"
                      >
                        {settings?.supportedCities?.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )) || (
                          <>
                            <option value="Karachi">Karachi</option>
                            <option value="Lahore">Lahore</option>
                            <option value="Islamabad">Islamabad</option>
                            <option value="Rawalpindi">Rawalpindi</option>
                            <option value="Faisalabad">Faisalabad</option>
                          </>
                        )}
                        <option value="Other">Other City / Town</option>
                      </select>
                    </div>

                    {customerCity === "Other" && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                          Specify Your City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          placeholder="e.g. Abbottabad, Sukkur..."
                          className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2.5 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Full Delivery Address */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                      Complete Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="House / Flat No., Street, Sector/Block, Landmark..."
                      className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-3 text-sm text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Special Delivery Instructions */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                      Courier Instructions <span className="text-brand-mocha-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Leave with guard or call before delivery"
                      className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-4 py-2 text-xs text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Optional Gift Message Toggle */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGiftMessage(!showGiftMessage)}
                      className="text-xs font-semibold text-brand-gold-dark hover:underline flex items-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{showGiftMessage ? "Remove gift message" : "Is this a gift? Add a free personalized card"}</span>
                    </button>

                    {showGiftMessage && (
                      <div className="mt-3 p-3 bg-brand-cream/60 rounded-xl border border-brand-gold/30">
                        <label className="block text-[11px] font-bold text-brand-mocha mb-1">
                          Personalized handwritten message card:
                        </label>
                        <textarea
                          rows={2}
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Wishing you a very Happy Birthday! Hope you love these MESM."
                          className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-lg p-2.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Selection */}
              <div className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
                <h2 className="font-serif text-lg font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
                  <span className="w-6 h-6 rounded-full bg-brand-mocha text-brand-ivory text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Choose Payment Method
                </h2>

                {availablePaymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* EasyPaisa */}
                  {isPaymentMethodAvailable("easypaisa", settings) && (
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "easypaisa"
                        ? "border-brand-gold bg-brand-gold-soft/50 shadow-soft"
                        : "border-brand-mocha/15 bg-brand-ivory hover:border-brand-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-brand-mocha">EasyPaisa</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="easypaisa"
                        checked={paymentMethod === "easypaisa"}
                        onChange={() => setPaymentMethod("easypaisa")}
                        className="text-brand-mocha focus:ring-brand-gold"
                      />
                    </div>
                    <span className="text-[11px] text-brand-mocha-muted mt-2">
                      Transfer to EasyPaisa Mobile Account
                    </span>
                  </label>
                  )}

                  {/* JazzCash */}
                  {isPaymentMethodAvailable("jazzcash", settings) && (
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "jazzcash"
                        ? "border-brand-gold bg-brand-gold-soft/50 shadow-soft"
                        : "border-brand-mocha/15 bg-brand-ivory hover:border-brand-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-brand-mocha">JazzCash</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="jazzcash"
                        checked={paymentMethod === "jazzcash"}
                        onChange={() => setPaymentMethod("jazzcash")}
                        className="text-brand-mocha focus:ring-brand-gold"
                      />
                    </div>
                    <span className="text-[11px] text-brand-mocha-muted mt-2">
                      Transfer to JazzCash Mobile Account
                    </span>
                  </label>
                  )}

                  {/* Cash on Delivery */}
                  {isPaymentMethodAvailable("cod", settings) && (
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "cod"
                        ? "border-brand-gold bg-brand-gold-soft/50 shadow-soft"
                        : "border-brand-mocha/15 bg-brand-ivory hover:border-brand-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-brand-mocha">Cash on Delivery</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => {
                          setPaymentMethod("cod");
                          setPaymentProofFile(null);
                          setPaymentProofError("");
                        }}
                        className="text-brand-mocha focus:ring-brand-gold"
                      />
                    </div>
                    <span className="text-[11px] text-brand-mocha-muted mt-2">
                      Pay cash to courier upon parcel arrival
                    </span>
                  </label>
                  )}

                  {/* Bank Transfer */}
                  {isPaymentMethodAvailable("bank_transfer", settings) && (
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "bank_transfer"
                        ? "border-brand-gold bg-brand-gold-soft/50 shadow-soft"
                        : "border-brand-mocha/15 bg-brand-ivory hover:border-brand-gold/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-brand-mocha">Bank Transfer</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                        className="text-brand-mocha focus:ring-brand-gold"
                      />
                    </div>
                    <span className="text-[11px] text-brand-mocha-muted mt-2">
                      Bank transfer instructions are provided by the store
                    </span>
                  </label>
                  )}
                </div>
                ) : (
                  <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                    Online checkout is temporarily unavailable because no payment methods are enabled. Please contact the store.
                  </p>
                )}

                {/* Dynamic Instructions Card based on Admin Settings */}
                {availablePaymentMethods.length > 0 && (
                <div className="p-4 bg-brand-ivory rounded-2xl border border-brand-mocha/10 text-xs text-brand-mocha space-y-2">
                  <div className="font-semibold text-brand-gold-dark flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                    <span>Payment Instructions:</span>
                  </div>

                  {paymentMethod === "easypaisa" && (
                    <div className="space-y-1">
                      <p>
                        EasyPaisa Number: <strong>{settings?.easypaisaNumber || "Not configured"}</strong>
                      </p>
                      <p>
                        Account Title: <strong>{settings?.easypaisaTitle || "Not configured"}</strong>
                      </p>
                      <p className="text-[11px] text-brand-mocha-muted">
                        The store must verify a manual transfer before marking it as paid.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "jazzcash" && (
                    <div className="space-y-1">
                      <p>
                        Account Number: <strong>{settings?.jazzcashNumber || "Not configured"}</strong>
                      </p>
                      <p>
                        Account Title: <strong>{settings?.jazzcashTitle || "Not configured"}</strong>
                      </p>
                      <p className="text-[11px] text-brand-mocha-muted">
                        The store must verify a manual transfer before marking it as paid.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-1">
                      <p>
                        Bank Account: <strong>{settings?.bankDetails || "Not configured"}</strong>
                      </p>
                      <p className="text-[11px] text-brand-mocha-muted">
                        The store must verify a manual transfer before marking it as paid.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <p className="text-[11px] text-brand-mocha-muted">
                      Please keep the exact amount ready upon courier delivery. An initial WhatsApp confirmation is required prior to parcel dispatch.
                    </p>
                  )}
                </div>
                )}

                {paymentMethod !== "cod" && availablePaymentMethods.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-brand-gold/30 bg-brand-cream/40 p-4">
                    <label
                      htmlFor="payment-proof"
                      className="flex items-center gap-2 text-xs font-bold text-brand-mocha"
                    >
                      <UploadCloud className="h-4 w-4 text-brand-gold-dark" />
                      Upload payment screenshot <span className="font-normal text-brand-mocha-muted">(optional)</span>
                    </label>
                    <p className="text-[11px] leading-relaxed text-brand-mocha-muted">
                      If you have already paid, add your receipt here. We will save it with your order and include a viewable link in your WhatsApp message.
                    </p>
                    {paymentProofFile ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-mocha/10 bg-brand-ivory px-3 py-2">
                        <span className="min-w-0 truncate text-xs font-medium text-brand-mocha">
                          {paymentProofFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofFile(null);
                            setPaymentProofError("");
                          }}
                          className="rounded-full p-1 text-brand-mocha-muted hover:bg-brand-cream hover:text-brand-mocha"
                          aria-label="Remove payment screenshot"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <input
                        id="payment-proof"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] || null;
                          setPaymentProofError("");
                          if (!file) return;
                          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                            setPaymentProofError("Choose a JPG, PNG, or WebP payment screenshot.");
                            event.currentTarget.value = "";
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setPaymentProofError("The payment screenshot must be 5 MB or smaller.");
                            event.currentTarget.value = "";
                            return;
                          }
                          setPaymentProofFile(file);
                        }}
                        className="block w-full text-xs text-brand-mocha file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-mocha file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-ivory hover:file:bg-brand-mocha-dark"
                      />
                    )}
                    {paymentProofError && (
                      <p role="alert" className="text-[11px] font-medium text-red-700">
                        {paymentProofError}
                      </p>
                    )}
                    <p className="text-[10px] text-brand-mocha-muted">JPG, PNG, or WebP · up to 5 MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Review & Submit */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-card space-y-6 sticky top-28">
                <h2 className="font-serif text-lg font-bold text-brand-mocha pb-3 border-b border-brand-mocha/10">
                  Review Your Jewellery ({items.reduce((s, i) => s + i.quantity, 0)})
                </h2>

                {/* Line Items Snapshot */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-brand-mocha/5">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedVariation}`}
                      className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                          <Image
                            src={item.image || "/images/mesm-logo.png"}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-brand-mocha line-clamp-1">{item.name}</div>
                          {item.selectedVariation && (
                            <div className="text-[10px] text-brand-mocha-muted">
                              {item.selectedVariation}
                            </div>
                          )}
                          <div className="text-[11px] text-brand-mocha-muted">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="font-bold text-brand-mocha">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="pt-4 border-t border-brand-mocha/10 space-y-2 text-xs text-brand-mocha-muted">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-mocha">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier Delivery</span>
                    <span className="font-semibold text-brand-mocha">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase">FREE</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-brand-mocha/10 flex justify-between text-base font-bold text-brand-mocha">
                    <span>Total Order Amount</span>
                    <span className="text-brand-gold-dark">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Place Order Primary Button */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || availablePaymentMethods.length === 0}
                    className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full font-bold text-sm shadow-card flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                    <span>{isSubmitting ? (paymentProofFile ? "Uploading receipt & placing order..." : "Saving & Opening WhatsApp...") : "Place Order via WhatsApp"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>

                  <p className="text-[11px] text-center text-brand-mocha-muted leading-tight">
                    Your order will be safely registered in our database first, and WhatsApp will open with your prefilled receipt. Simply press Send to confirm with us.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer settings={settings || undefined} />
    </div>
  );
}
