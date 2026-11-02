"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Clock, Check } from "lucide-react";
import { toWhatsAppPhone } from "@/lib/utils";

interface CustomerMessagePlan {
  category: "order_received" | "order_status" | "payment_status";
  cycleStart: string;
  key: string;
  label: string;
  message: string;
  dueAt: string | null;
  canSend: boolean;
  reason: string;
}

interface AdminCustomerOrderMessagesProps {
  orderId: string;
  customerPhone: string;
  plans: CustomerMessagePlan[];
}

export function AdminCustomerOrderMessages({
  orderId,
  customerPhone,
  plans,
}: AdminCustomerOrderMessagesProps) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState(
    plans.find((plan) => plan.canSend)?.key || plans[0]?.key || ""
  );
  const [openedKey, setOpenedKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const selectedPlan = plans.find((plan) => plan.key === selectedKey);
  const recipient = useMemo(() => {
    const phone = toWhatsAppPhone(customerPhone);
    return /^\d{10,15}$/.test(phone) ? phone : "";
  }, [customerPhone]);
  const whatsappUrl = selectedPlan && recipient
    ? `https://wa.me/${recipient}?text=${encodeURIComponent(selectedPlan.message)}`
    : "";

  const handleMarkSent = async () => {
    if (!selectedPlan || !selectedPlan.canSend || openedKey !== selectedPlan.key) return;
    setIsSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: selectedPlan.key }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to record the sent message.");
      }
      setNotice("Message recorded in the order timeline.");
      setOpenedKey("");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to record the sent message.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      id="customer-messages"
      className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4"
    >
      <div>
        <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-gold" />
          Customer Send Message Templates from MESM Store
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-brand-mocha-muted">
          Templates are prefilled for the customer number saved with this order. WhatsApp does not send automatically:
          open the chat, press Send there, then record it below.
        </p>
        <p className="mt-1 text-[10px] font-semibold text-brand-mocha-muted">
          Reminder cap: 3 logged MESM messages per order in any 24-hour period.
        </p>
      </div>

      {plans.length > 0 && (
        <div className="space-y-3">
          <label
            htmlFor="customer-message-template"
            className="block text-[11px] font-bold uppercase tracking-wider text-brand-mocha"
          >
            Customer message template
          </label>
          <select
            id="customer-message-template"
            value={selectedKey}
            onChange={(event) => {
              setSelectedKey(event.target.value);
              setOpenedKey("");
              setNotice("");
            }}
            className="w-full rounded-xl border border-brand-mocha/20 bg-brand-ivory px-3 py-2 text-xs font-semibold text-brand-mocha focus:border-brand-gold focus:outline-none"
          >
            {plans.map((plan) => (
              <option key={`${plan.category}-${plan.key}`} value={plan.key}>
                {plan.category === "payment_status"
                  ? "Payment"
                  : plan.category === "order_received"
                    ? "MESM Store"
                    : "Order"}: {plan.label}
              </option>
            ))}
          </select>

          {selectedPlan?.message ? (
            <div className="rounded-2xl border border-brand-mocha/10 bg-brand-ivory p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-mocha-muted">
                Message preview
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-brand-mocha">
                {selectedPlan.message}
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-brand-mocha/10 bg-brand-ivory p-3 text-xs text-brand-mocha-muted">
              {selectedPlan?.reason || "No message is available for this status."}
            </p>
          )}

          {selectedPlan?.canSend && recipient ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setOpenedKey(selectedPlan.key);
                  setNotice("WhatsApp opened. Press Send in WhatsApp before recording this message.");
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#20ba59]"
              >
                <Send className="h-4 w-4" />
                Open WhatsApp to {`+${recipient}`}
              </a>
              <button
                type="button"
                onClick={handleMarkSent}
                disabled={isSaving || openedKey !== selectedPlan.key}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-mocha/20 bg-white px-4 py-2.5 text-xs font-bold text-brand-mocha disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {isSaving ? "Recording..." : "I sent this message"}
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {!recipient
                  ? "The saved customer phone number is invalid for WhatsApp."
                  : selectedPlan?.reason || "This message is not currently due."}
              </span>
            </div>
          )}

          {notice && (
            <p role="status" className="text-[11px] text-brand-mocha-muted">
              {notice}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
