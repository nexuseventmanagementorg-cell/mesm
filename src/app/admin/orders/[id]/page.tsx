import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrderById } from "@/lib/db";
import { formatPrice, toWhatsAppPhone } from "@/lib/utils";
import { AdminOrderStatusUpdater } from "@/components/admin/AdminOrderStatusUpdater";
import { verifyAdminAuth } from "@/lib/auth";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CreditCard,
  MessageCircle,
  Clock,
  Gift,
} from "lucide-react";

export const revalidate = 0;

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  if (!(await verifyAdminAuth())) {
    redirect("/admin/login");
  }

  const order = await getOrderById(params.id);
  if (!order) {
    notFound();
  }

  const customerCleanPhone = toWhatsAppPhone(order.customerPhone);
  const directWhatsAppUrl = `https://wa.me/${customerCleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}! We are contacting you from MESM regarding your jewellery order #${order.orderNumber}.`
  )}`;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-mocha/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-brand-mocha">
                Order {order.orderNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.orderStatus === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : order.orderStatus === "delivered"
                    ? "bg-blue-100 text-blue-800"
                    : order.orderStatus === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-brand-mocha-muted">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Customer WhatsApp Chat */}
        <a
          href={directWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Chat Customer on WhatsApp</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items & Totals */}
        <div className="lg:col-span-7 space-y-6">
          {/* Items Card */}
          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
            <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-gold" />
              Ordered Items Snapshot
            </h2>

            <div className="divide-y divide-brand-mocha/10">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
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
                      {item.sku && (
                        <div className="text-[11px] text-brand-mocha-muted">
                          SKU: {item.sku}
                        </div>
                      )}
                      {item.variationText && (
                        <div className="text-[11px] text-brand-gold-dark font-medium">
                          {item.variationText}
                        </div>
                      )}
                      <div className="text-brand-mocha-muted">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-brand-mocha text-right">
                    {formatPrice(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-brand-mocha/10 space-y-2 text-xs text-brand-mocha-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-mocha">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Courier Delivery</span>
                <span className="font-semibold text-brand-mocha">
                  {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-semibold text-brand-mocha">
                  {formatPrice(order.discount)}
                </span>
              </div>
              <div className="pt-2 border-t border-brand-mocha/10 flex justify-between text-base font-bold text-brand-mocha">
                <span>Total Value</span>
                <span className="text-brand-gold-dark">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline Audit History */}
          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
            <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-gold" />
              Order Timeline & Status History
            </h2>

            <div className="space-y-4 relative pl-4 border-l-2 border-brand-mocha/10 text-xs">
              {order.timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-gold border-2 border-brand-warm" />
                  <div className="font-semibold text-brand-mocha">{evt.title}</div>
                  {evt.description && (
                    <div className="text-brand-mocha-muted text-[11px] mt-0.5">
                      {evt.description}
                    </div>
                  )}
                  <div className="text-[10px] text-brand-mocha-muted mt-0.5">
                    {new Date(evt.timestamp).toLocaleString()} ({evt.actor})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Status Controls & Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status & Payment Updater Controls */}
          <AdminOrderStatusUpdater order={order} />

          {/* Customer & Shipping Details */}
          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3 text-xs">
            <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-gold" />
              Shipping Destination
            </h2>

            <div className="space-y-2 text-brand-mocha-muted">
              <div>
                <span className="font-semibold text-brand-mocha">Customer:</span> {order.customerName}
              </div>
              <div>
                <span className="font-semibold text-brand-mocha">Contact Phone:</span> {order.customerPhone}
              </div>
              {order.customerEmail && (
                <div>
                  <span className="font-semibold text-brand-mocha">Email:</span> {order.customerEmail}
                </div>
              )}
              <div>
                <span className="font-semibold text-brand-mocha">City:</span> {order.customerCity}
              </div>
              <div>
                <span className="font-semibold text-brand-mocha">Delivery Address:</span> {order.deliveryAddress}
              </div>
              {order.deliveryInstructions && (
                <div>
                  <span className="font-semibold text-brand-mocha">Courier Notes:</span> {order.deliveryInstructions}
                </div>
              )}
              {order.giftMessage && (
                <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-gold/30">
                  <span className="font-semibold text-brand-mocha flex items-center gap-1 mb-1">
                    <Gift className="w-3.5 h-3.5 text-brand-gold" /> Gift Message:
                  </span>
                  <p className="italic text-brand-mocha">&ldquo;{order.giftMessage}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2 text-xs">
            <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-gold" />
              Payment Information
            </h2>
            <div className="space-y-1 text-brand-mocha-muted">
              <p>Method: <strong className="uppercase text-brand-mocha">{order.paymentMethod}</strong></p>
              <p>Payment Verification: <strong className="uppercase text-brand-mocha">{order.paymentStatus}</strong></p>
              {order.paymentProofUrl && (
                <div className="space-y-2 border-t border-brand-mocha/10 pt-3">
                  <span className="font-semibold text-brand-mocha">Customer payment receipt:</span>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-fit overflow-hidden rounded-xl border border-brand-mocha/15 bg-brand-ivory hover:border-brand-gold/60"
                  >
                    <Image
                      src={order.paymentProofUrl}
                      alt={`Payment receipt for order ${order.orderNumber}`}
                      width={320}
                      height={240}
                      unoptimized
                      className="max-h-56 w-auto object-contain"
                    />
                  </a>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-gold-dark hover:underline"
                  >
                    Open full receipt <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {order.adminNotes && (
                <div className="pt-2 border-t border-brand-mocha/10">
                  <span className="font-semibold text-brand-mocha block">Admin Notes:</span>
                  <p className="text-[11px] whitespace-pre-wrap">{order.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
