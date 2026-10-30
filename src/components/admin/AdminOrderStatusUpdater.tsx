"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import { Check, RefreshCw, Save } from "lucide-react";

interface AdminOrderStatusUpdaterProps {
  order: Order;
}

export function AdminOrderStatusUpdater({ order }: AdminOrderStatusUpdaterProps) {
  const router = useRouter();

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg("");

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus,
          paymentStatus,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setMsg("Order updated successfully!");
      setNotes("");
      router.refresh();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setMsg("Error saving update.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
      <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-brand-gold" />
        Update Order & Payment Status
      </h2>

      {msg && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        <div>
          <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
            Order Fulfillment Status
          </label>
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
            className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold font-semibold"
          >
            <option value="pending">Pending Confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing in Studio</option>
            <option value="ready">Ready to Dispatch</option>
            <option value="shipped">Shipped (Out for Delivery)</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled (Restores Stock)</option>
          </select>
          <span className="text-[10px] text-brand-mocha-muted mt-0.5 block">
            {orderStatus === "cancelled"
              ? "⚠️ Cancelling restores product quantities back to stock."
              : "Updates customer order timeline."}
          </span>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
            Payment Verification Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold font-semibold"
          >
            <option value="unpaid">Unpaid</option>
            <option value="awaiting_verification">Awaiting Verification (Screenshot pending)</option>
            <option value="paid">Paid (Verified in Bank/EasyPaisa/JazzCash)</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
            Internal Note / Tracking Number
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified EasyPaisa ref #EP89127, TCS Tracking #4409"
            className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 px-4 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 text-brand-gold-light" />
          <span>{isSaving ? "Updating Status..." : "Save Status Changes"}</span>
        </button>
      </form>
    </div>
  );
}
