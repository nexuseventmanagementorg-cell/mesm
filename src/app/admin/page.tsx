import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getSalesAnalytics } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  Gem,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Eye,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const analytics = await getSalesAnalytics();

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
            Store Performance & Orders
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
            MESM Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="py-2.5 px-5 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-semibold flex items-center gap-2 shadow-soft transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-gold-light" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Revenue & Sales Stat Cards (Clearly distinguishing confirmed vs pending vs gross) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Confirmed Revenue */}
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-mocha-muted">
            <span>Confirmed Sales (Paid)</span>
            <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {formatPrice(analytics.totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {analytics.confirmedOrdersCount} orders confirmed & verified
          </div>
        </div>

        {/* Pending Order Value */}
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-mocha-muted">
            <span>Pending Value (WhatsApp)</span>
            <span className="p-1.5 rounded-full bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {formatPrice(analytics.pendingRevenue)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {analytics.pendingOrdersCount} orders awaiting WhatsApp confirmation
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-mocha-muted">
            <span>Total Orders Placed</span>
            <span className="p-1.5 rounded-full bg-brand-cream text-brand-mocha">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-brand-mocha">
            {analytics.totalOrders}
          </div>
          <div className="text-[11px] text-brand-mocha-muted">
            {analytics.totalOrderedQuantity} total jewellery units ordered
          </div>
        </div>

        {/* Gross Order Value */}
        <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-mocha-muted">
            <span>Gross Order Value</span>
            <span className="p-1.5 rounded-full bg-brand-gold/15 text-brand-gold-dark">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-brand-mocha">
            {formatPrice(analytics.grossRevenue)}
          </div>
          <div className="text-[11px] text-brand-mocha-muted">
            Includes all non-cancelled orders
          </div>
        </div>
      </div>

      {/* Catalogue & Inventory Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-brand-mocha-muted">Total Products</div>
            <div className="text-lg font-bold text-brand-mocha">{analytics.totalProductsCount}</div>
          </div>
          <Gem className="w-5 h-5 text-brand-gold" />
        </div>

        <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-brand-mocha-muted">Published / Draft</div>
            <div className="text-lg font-bold text-brand-mocha">
              {analytics.publishedProductsCount} / {analytics.draftProductsCount}
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-700">Low Stock Alert</div>
            <div className="text-lg font-bold text-amber-800">{analytics.lowStockCount}</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-red-700">Out of Stock</div>
            <div className="text-lg font-bold text-red-800">{analytics.outOfStockCount}</div>
          </div>
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
      </div>

      {/* Visual Trends & Top Bestsellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Daily Orders Trend (Past 7 Days) */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-mocha">
                7-Day Order Volume & Revenue
              </h2>
              <p className="text-xs text-brand-mocha-muted">
                Activity from confirmed and pending customer orders.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.dailyTrends.map((trend) => {
              const maxRev = Math.max(...analytics.dailyTrends.map((t) => t.revenue), 1000);
              const barPercent = Math.min(100, Math.round((trend.revenue / maxRev) * 100));

              return (
                <div key={trend.date} className="space-y-1">
                  <div className="flex justify-between text-xs text-brand-mocha">
                    <span className="font-mono text-brand-mocha-muted">{trend.date}</span>
                    <span className="font-semibold">
                      {trend.orders} orders ({formatPrice(trend.revenue)})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-brand-sand/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-gold-light to-brand-mocha transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(barPercent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bestselling Jewellery by Verified Quantities */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-brand-mocha">
              Top Bestsellers
            </h2>
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-brand-gold-dark hover:underline"
            >
              Full Analytics
            </Link>
          </div>

          <div className="divide-y divide-brand-mocha/10 text-xs">
            {analytics.bestsellers.slice(0, 5).map((best, i) => (
              <div key={best.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-brand-gold-dark">
                    #{i + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-brand-cream border border-brand-mocha/10 flex-shrink-0">
                    <Image
                      src={best.image || "/images/mesm-logo.png"}
                      alt={best.productName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-brand-mocha line-clamp-1">
                      {best.productName}
                    </div>
                    <div className="text-[11px] text-brand-mocha-muted">
                      {best.totalQuantity} items ordered
                    </div>
                  </div>
                </div>
                <div className="font-bold text-brand-mocha text-right">
                  {formatPrice(best.totalRevenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-brand-mocha">Recent Orders</h2>
            <p className="text-xs text-brand-mocha-muted">
              Live incoming customer submissions requiring review or confirmation.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-brand-gold-dark hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-mocha/10 text-brand-mocha-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Order No.</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Total</th>
                <th className="py-3 px-3">Order Status</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mocha/5">
              {analytics.recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-brand-sand/20 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-brand-mocha">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-brand-mocha">{ord.customerName}</div>
                    <div className="text-[11px] text-brand-mocha-muted">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-brand-mocha-muted">{ord.customerCity}</td>
                  <td className="py-3 px-3 font-medium text-brand-mocha">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} pcs
                  </td>
                  <td className="py-3 px-3 font-bold text-brand-mocha">
                    {formatPrice(ord.total)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.orderStatus === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : ord.orderStatus === "delivered"
                          ? "bg-blue-100 text-blue-800"
                          : ord.orderStatus === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        ord.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="p-1.5 rounded-lg bg-brand-ivory border border-brand-mocha/10 hover:border-brand-gold text-brand-mocha inline-flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
