import React from "react";
import Image from "next/image";
import { getSalesAnalytics } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const analytics = await getSalesAnalytics();

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
          Store Intelligence
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
          Sales & Order Analytics
        </h1>
        <p className="text-xs text-brand-mocha-muted mt-1">
          Accurate metrics calculated strictly from verified order database records. Cancelled orders are excluded from bestseller counts.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-1">
          <div className="text-xs font-semibold text-brand-mocha-muted">Confirmed Paid Revenue</div>
          <div className="text-3xl font-bold text-emerald-800">
            {formatPrice(analytics.totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700">
            {analytics.confirmedOrdersCount} confirmed and completed orders
          </div>
        </div>

        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-1">
          <div className="text-xs font-semibold text-brand-mocha-muted">Pending WhatsApp Pipeline</div>
          <div className="text-3xl font-bold text-amber-800">
            {formatPrice(analytics.pendingRevenue)}
          </div>
          <div className="text-[11px] text-amber-700">
            {analytics.pendingOrdersCount} orders waiting on WhatsApp confirmation
          </div>
        </div>

        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-1">
          <div className="text-xs font-semibold text-brand-mocha-muted">Total Order Quantity</div>
          <div className="text-3xl font-bold text-brand-mocha">
            {analytics.totalOrderedQuantity}
          </div>
          <div className="text-[11px] text-brand-mocha-muted">
            Total jewellery items sold across all non-cancelled orders
          </div>
        </div>
      </div>

      {/* Product-Level Sales Leaderboard */}
      <div className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-brand-mocha">
              Bestselling Jewellery Products
            </h2>
            <p className="text-xs text-brand-mocha-muted">
              Ranked by verified ordered quantities from actual checkout database records.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-mocha/10 text-brand-mocha-muted uppercase text-[10px] tracking-wider bg-brand-cream/30">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Total Units Sold</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4 text-right">Storefront Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mocha/5">
              {analytics.bestsellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-mocha-muted">
                    No order data recorded yet.
                  </td>
                </tr>
              ) : (
                analytics.bestsellers.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-brand-sand/15 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-gold-dark">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                          <Image
                            src={item.image || "/images/mesm-logo.png"}
                            alt={item.productName}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-brand-mocha text-sm">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-mocha">
                      {item.totalQuantity} units
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-mocha">
                      {formatPrice(item.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.totalQuantity >= 2 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-gold text-brand-ivory shadow-xs">
                          <Sparkles className="w-3 h-3 fill-brand-ivory" /> Bestseller Badge
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-mocha-muted">
                          Needs {2 - item.totalQuantity} more order
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="text-xs font-semibold text-brand-mocha-muted">Pending Orders</div>
          <div className="text-2xl font-bold text-amber-800">
            {analytics.pendingOrdersCount}
          </div>
          <div className="text-[11px] text-amber-700">Awaiting customer WhatsApp confirmation</div>
        </div>

        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="text-xs font-semibold text-brand-mocha-muted">Confirmed Orders</div>
          <div className="text-2xl font-bold text-emerald-800">
            {analytics.confirmedOrdersCount}
          </div>
          <div className="text-[11px] text-emerald-700">Payment verified and ready for courier</div>
        </div>

        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="text-xs font-semibold text-brand-mocha-muted">Cancelled Orders</div>
          <div className="text-2xl font-bold text-red-800">
            {analytics.cancelledOrdersCount}
          </div>
          <div className="text-[11px] text-red-700">Excluded from revenue and bestseller counts</div>
        </div>
      </div>
    </div>
  );
}
