import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getStoreSettings } from "@/lib/db";
import { ShieldCheck, Truck, RefreshCw, FileText } from "lucide-react";

export const revalidate = 0;

export default async function PoliciesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-mocha">
            Store Policies & Terms
          </h1>
          <p className="text-xs sm:text-sm text-brand-mocha-muted">
            Clear, transparent guidelines for shipping, returns, privacy, and terms of service.
          </p>
        </div>

        {/* Shipping policy */}
        <section id="shipping" className="p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3">
          <h2 className="font-serif text-xl font-bold text-brand-mocha flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-gold" /> Shipping & Delivery Policy
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed">
            {settings.policies.shipping ||
              "We provide nationwide courier delivery across all cities and towns in Pakistan. Standard delivery takes 2 to 4 business days. Delivery is FREE on orders above PKR 3,000, and flat PKR 250 for orders below that threshold."}
          </p>
        </section>

        {/* Returns policy */}
        <section id="returns" className="p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3">
          <h2 className="font-serif text-xl font-bold text-brand-mocha flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-gold" /> Returns & Exchanges
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed">
            {settings.policies.returns ||
              "Returns are accepted within 3 days of delivery only if an item is received damaged or incorrect. Please inspect your order on arrival and contact our WhatsApp support with your unboxing video."}
          </p>
        </section>

        {/* Privacy policy */}
        <section id="privacy" className="p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3">
          <h2 className="font-serif text-xl font-bold text-brand-mocha flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-gold" /> Privacy & Confidentiality
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed">
            {settings.policies.privacy ||
              "We strictly respect your privacy. Customer details including name, phone number, and delivery address are kept confidential and used solely to process and dispatch your order. We never share customer data with third parties."}
          </p>
        </section>

        {/* Terms */}
        <section id="terms" className="p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-3">
          <h2 className="font-serif text-xl font-bold text-brand-mocha flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-gold" /> Terms of Service
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed">
            {settings.policies.terms ||
              "By placing an order via MESM, you agree to confirm order details and delivery coordinates via our official WhatsApp channel."}
          </p>
        </section>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
