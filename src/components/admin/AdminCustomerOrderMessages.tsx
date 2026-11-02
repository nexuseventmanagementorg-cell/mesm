"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Clock, Check } from "lucide-react";
import { toWhatsAppPhone } from "@/lib/utils";

interface CustomerMessagePlan {
  category: "order_received" | "order_status" | "payment_status" | "payment_receipt";
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
  const [openedKey, setOpenedKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const recipient = useMemo(() => {
    const phone = toWhatsAppPhone(customerPhone);
    return /^\d{10,15}$/.test(phone) ? phone : "";
  }, [customerPhone]);
  const groupedPlans = [
    { label: "MESM Store", plans: plans.filter((plan) => plan.category === "order_received") },
    { label: "Order status templates", plans: plans.filter((plan) => plan.category === "order_status") },
    { label: "Payment status templates", plans: plans.filter((plan) => plan.category === "payment_status") },
    { label: "Payment receipt templates", plans: plans.filter((plan) => plan.category === "payment_receipt") },
  ].filter((group) => group.plans.length > 0);

  const handleMarkSent = async (plan: CustomerMessagePlan) => {
    if (!plan.canSend || openedKey !== plan.key) return;
    setIsSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: plan.key }),
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
        <p className="mt-1 text-[11px] leading-relaxed text-brand-mocha-muted">
          Every template is listed below with its own WhatsApp button. Status, reminder timing, duplicate, and daily-limit rules still apply.
          WhatsApp does not support colored text, so the messages use MESM branding, emoji, and bold emphasis.
        </p>
        <p className="mt-1 text-[10px] font-semibold text-brand-mocha-muted">
          Reminder cap: 3 logged MESM messages per order in any 24-hour period. ✨
        </p>
      </div>

      {plans.length > 0 && (
        <div className="space-y-3">
          {groupedPlans.map((group) => (
            <section key={group.label} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-mocha-muted">
                {group.label}
              </h3>
              {group.plans.map((plan) => {
                const canOpenWhatsApp = Boolean(recipient && plan.message);
                const whatsappUrl = canOpenWhatsApp
                  ? `https://wa.me/${recipient}?text=${encodeURIComponent(plan.message)}`
                  : "";
                const isOpened = openedKey === plan.key;

                return (
                  <article
                    key={`${plan.category}-${plan.key}`}
                    className="overflow-hidden rounded-xl border border-brand-mocha/10 bg-brand-ivory"
                  >
                    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold text-brand-mocha">{plan.label}</p>
                      {canOpenWhatsApp && plan.canSend ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setOpenedKey(plan.key);
                            setNotice("");
                          }}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#20ba59]"
                          title="Open this message in WhatsApp"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send to WhatsApp
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-mocha-muted px-3 py-2 text-[11px] font-bold text-white opacity-60"
                          title={!recipient ? "The saved customer phone number is invalid for WhatsApp." : plan.reason}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send to WhatsApp
                        </button>
                      )}
                    </div>
                    <details className="border-t border-brand-mocha/10">
                      <summary className="cursor-pointer px-3 py-2 text-[10px] font-semibold text-brand-gold-dark hover:bg-brand-sand/30">
                        Preview message
                      </summary>
                      <div className="space-y-3 p-3">
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-3">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-amber-950">
                            ✨ MESM Store message preview
                          </p>
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                            {plan.message}
                          </p>
                        </div>
                        {isOpened && plan.canSend && (
                          <button
                            type="button"
                            onClick={() => handleMarkSent(plan)}
                            disabled={isSaving}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-mocha/20 bg-white px-3 py-2 text-[11px] font-bold text-brand-mocha disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isSaving ? "Recording..." : "I sent this message"}
                          </button>
                        )}
                        {!plan.canSend && (
                          <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] text-amber-900">
                            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {plan.reason || "This message is not currently available to send."}
                          </p>
                        )}
                      </div>
                    </details>
                  </article>
                );
              })}
            </section>
          ))}
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
