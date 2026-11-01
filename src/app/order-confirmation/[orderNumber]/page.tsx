import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCustomerOrderConfirmation, getStoreSettings } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  generateCustomerOrderConfirmationMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import { OrderConfirmationActions } from "@/components/order/OrderConfirmationActions";
import { CUSTOMER_ORDER_ACCESS_COOKIE } from "@/lib/customer-order-access.mjs";
import {
  CheckCircle2,
  MessageCircle,
  Truck,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

interface OrderConfirmationPageProps {
  params: {
    orderNumber: string;
  };
}

export const revalidate = 0;

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const token = cookies().get(CUSTOMER_ORDER_ACCESS_COOKIE)?.value;
  const [order, settings] = await Promise.all([
    getCustomerOrderConfirmation(params.orderNumber, token),
    getStoreSettings(),
  ]);
  if (!order) {
    notFound();
  }

  const whatsappMessage = generateCustomerOrderConfirmationMessage(order);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full">
        {/* Success Header Card */}
        <div className="bg-brand-warm rounded-3xl p-6 sm:p-10 border border-brand-mocha/10 shadow-card text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark">
              Order Registered Successfully
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
              Thank You, {order.customerName}!
            </h1>
            <p className="text-sm font-mono font-bold text-brand-mocha mt-1">
              Order Reference: <span className="text-brand-gold-dark">{order.orderNumber}</span>
            </p>
          </div>

          {/* Critical WhatsApp Banner */}
          <div className={`p-5 rounded-2xl text-left max-w-xl mx-auto space-y-3 ${
            whatsappUrl
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-amber-50 border border-amber-200"
          }`}>
            <div className="flex items-start gap-3">
              <MessageCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                whatsappUrl ? "text-[#25D366]" : "text-amber-700"
              }`} />
              <div>
                <h2 className="font-serif text-sm sm:text-base font-bold text-emerald-950">
                  {whatsappUrl
                    ? "Step 2: Press Send in WhatsApp to Confirm"
                    : "Order saved — WhatsApp is not configured"}
                </h2>
                <p className={`text-xs leading-relaxed mt-1 ${
                  whatsappUrl ? "text-emerald-800" : "text-amber-900"
                }`}>
                  {whatsappUrl
                    ? "Your order has been recorded in our store system. WhatsApp will open with a prefilled message; please press Send to contact the store."
                    : "Your order is recorded with the reference below. The store owner needs to configure the WhatsApp business number before messages can be sent."}
                </p>
              </div>
            </div>

            {whatsappUrl && (
              <OrderConfirmationActions
                whatsappUrl={whatsappUrl}
                whatsappMessage={whatsappMessage}
              />
            )}
          </div>
        </div>

        {/* Order Details & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
          {/* Left Column: Ordered Items */}
          <div className="md:col-span-7 space-y-6">
            <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
              <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-gold" />
                Ordered Jewellery ({order.items.length})
              </h2>

              <div className="divide-y divide-brand-mocha/10">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                        <Image
                          src={item.productImage || "/images/mesm-logo.png"}
                          alt={item.productName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-brand-mocha">{item.productName}</div>
                        {item.variationText && (
                          <div className="text-[11px] text-brand-mocha-muted">{item.variationText}</div>
                        )}
                        <div className="text-brand-mocha-muted">
                          Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-brand-mocha">
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-brand-mocha/10 space-y-1.5 text-xs text-brand-mocha-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-mocha">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-brand-mocha">
                    {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-brand-mocha/10 flex justify-between text-sm font-bold text-brand-mocha">
                  <span>Total Amount</span>
                  <span className="text-brand-gold-dark">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Details & Payment Info */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4 text-xs">
              <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-gold" />
                Delivery Information
              </h2>

              <div className="space-y-2 text-brand-mocha-muted">
                <div>
                  <span className="font-semibold text-brand-mocha">Recipient:</span> {order.customerName}
                </div>
                <div>
                  <span className="font-semibold text-brand-mocha">Phone:</span> {order.customerPhone}
                </div>
                <div>
                  <span className="font-semibold text-brand-mocha">City:</span> {order.customerCity}
                </div>
                <div>
                  <span className="font-semibold text-brand-mocha">Address:</span> {order.deliveryAddress}
                </div>
                {order.deliveryInstructions && (
                  <div>
                    <span className="font-semibold text-brand-mocha">Notes:</span> {order.deliveryInstructions}
                  </div>
                )}
                {order.giftMessage && (
                  <div className="p-2.5 bg-brand-cream/60 rounded-xl border border-brand-gold/30">
                    <span className="font-semibold text-brand-mocha block">Gift Card Message:</span>
                    <span className="italic">{order.giftMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Verification Box */}
            <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3 text-xs">
              <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-gold" />
                Payment: {order.paymentMethod.toUpperCase()}
              </h2>

              {order.paymentMethod === "easypaisa" && (
                <div className="space-y-1 text-brand-mocha-muted">
                  <p>EasyPaisa Number: <strong>{settings.easypaisaNumber}</strong></p>
                  <p>Title: <strong>{settings.easypaisaTitle}</strong></p>
                  <p className="text-[11px] pt-1">
                    Send your transaction screenshot via WhatsApp to mark order as Paid.
                  </p>
                </div>
              )}

              {order.paymentMethod === "jazzcash" && (
                <div className="space-y-1 text-brand-mocha-muted">
                  <p>Account Number: <strong>{settings.jazzcashNumber}</strong></p>
                  <p>Account Title: <strong>{settings.jazzcashTitle}</strong></p>
                  <p className="text-[11px] pt-1">
                    Send your transaction screenshot via WhatsApp to mark order as Paid.
                  </p>
                </div>
              )}

              {order.paymentMethod === "cod" && (
                <p className="text-brand-mocha-muted leading-relaxed">
                  Cash on Delivery selected. Please keep PKR {order.total.toLocaleString()} ready at the time of delivery.
                </p>
              )}

              {order.paymentMethod === "bank_transfer" && (
                <div className="space-y-1 text-brand-mocha-muted">
                  <p><strong>Bank Details:</strong> {settings.bankDetails}</p>
                </div>
              )}
              {order.paymentProofUrl && (
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex font-semibold text-brand-gold-dark hover:underline"
                >
                  View your uploaded payment receipt
                </a>
              )}
            </div>

            <div className="text-center pt-2">
              <Link
                href="/shop"
                className="text-xs font-semibold text-brand-gold-dark hover:underline"
              >
                ← Return to Jewellery Store
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
