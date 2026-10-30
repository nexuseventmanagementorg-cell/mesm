import React from "react";
import Link from "next/link";
import { getOrders } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Search, Eye } from "lucide-react";
import { AdminQueryFilter } from "@/components/admin/AdminQueryFilter";

interface AdminOrdersPageProps {
  searchParams: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    page?: string;
  };
}

export const revalidate = 0;

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const search = searchParams.search || "";
  const status = searchParams.status || "all";
  const paymentStatus = searchParams.paymentStatus || "all";
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const { orders, total } = await getOrders({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    page,
    limit: 15,
  });

  return (
    <div className="p-6 sm:p-10 space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
          Order Processing & Verification
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
          Customer Orders ({total})
        </h1>
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-brand-warm rounded-2xl border border-brand-mocha/10 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <form className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by Order No (MG-...), customer name, or phone..."
            className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl pl-10 pr-4 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
          />
          <Search className="w-4 h-4 text-brand-mocha-muted absolute left-3.5 top-2.5" />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Order Status filter */}
          <AdminQueryFilter
            parameter="status"
            value={status}
            label="Filter orders by status"
            options={[
              { value: "all", label: "All Order Statuses" },
              { value: "pending", label: "Pending Confirmation" },
              { value: "confirmed", label: "Confirmed" },
              { value: "preparing", label: "Preparing" },
              { value: "ready", label: "Ready to Dispatch" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />

          {/* Payment Status filter */}
          <AdminQueryFilter
            parameter="paymentStatus"
            value={paymentStatus}
            label="Filter orders by payment status"
            options={[
              { value: "all", label: "All Payment Statuses" },
              { value: "unpaid", label: "Unpaid" },
              { value: "awaiting_verification", label: "Awaiting Verification" },
              { value: "paid", label: "Paid (Verified)" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-mocha/10 text-brand-mocha-muted uppercase text-[10px] tracking-wider bg-brand-cream/30">
                <th className="py-3.5 px-4">Order No. & Date</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mocha/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-mocha-muted">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-brand-sand/15 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-brand-mocha text-sm">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[10px] text-brand-mocha-muted">
                        {new Date(ord.createdAt).toLocaleDateString()} at{" "}
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-brand-mocha">{ord.customerName}</div>
                      <div className="text-[11px] text-brand-mocha-muted font-mono">
                        {ord.customerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-brand-mocha">{ord.customerCity}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-brand-mocha font-medium">
                        {ord.items.reduce((s, i) => s + i.quantity, 0)} pieces
                      </div>
                      <div className="text-[10px] text-brand-mocha-muted truncate max-w-[140px]">
                        {ord.items.map((i) => i.productName).join(", ")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-mocha">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold w-max ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-brand-gold-dark mt-0.5">
                          {ord.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="py-1.5 px-3 bg-brand-ivory border border-brand-mocha/15 hover:border-brand-gold rounded-full font-semibold text-brand-mocha inline-flex items-center gap-1.5 text-xs shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
