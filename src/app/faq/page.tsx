import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getStoreSettings } from "@/lib/db";
import { HelpCircle, Sparkles, MessageCircle } from "lucide-react";
import { toWhatsAppPhone } from "@/lib/utils";

export const revalidate = 0;

export default async function FAQPage() {
  const settings = await getStoreSettings();
  const cleanPhone = toWhatsAppPhone(settings.whatsappNumber);
  const hasWhatsAppNumber = /^\d{10,15}$/.test(cleanPhone);

  const faqs = [
    {
      q: "How do I place an order via WhatsApp?",
      a: "Browse our collection, add items to your bag, and proceed to checkout. When you submit your delivery details, your order is recorded in our system and WhatsApp opens with your prefilled receipt. Tap 'Send' in WhatsApp to confirm your order with our team.",
    },
    {
      q: "What payment methods are supported?",
      a: "Available payment methods and instructions are displayed during checkout. For manual transfers, share the receipt with the store; payment is only marked as received after the team verifies it.",
    },
    {
      q: "How long does courier delivery take?",
      a: settings.policies.shipping || `Order processing usually takes ${settings.processingTime || "the timeframe shown on the product page"}. Delivery options and charges are confirmed during checkout.`,
    },
    {
      q: "How should I care for my jewellery?",
      a: "Keep resin pieces away from direct heat, sunlight, perfumes, and chemical cleaners. Wipe gently with a soft, dry cloth and follow any care notes listed on the product.",
    },
    {
      q: "Can I add a custom gift card or message?",
      a: "If available for your order, add a gift message during checkout. The message is saved with the order for the store team.",
    },
    {
      q: "What if I receive a damaged or incorrect piece?",
      a: settings.policies.returns || "Please contact the store promptly if an item arrives damaged or incorrect. The team will review the order details and advise on the next steps.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Customer Assistance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-mocha">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-brand-mocha-muted max-w-md mx-auto">
            Everything you need to know about our jewellery collection, WhatsApp ordering, payments, and care.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 bg-brand-warm rounded-2xl border border-brand-mocha/10 shadow-soft space-y-2"
            >
              <h2 className="font-serif text-base sm:text-lg font-bold text-brand-mocha flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-gold flex-shrink-0" />
                {faq.q}
              </h2>
              <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp direct help banner */}
        <div className="p-8 bg-brand-cream rounded-3xl border border-brand-mocha/10 text-center space-y-4">
          <h2 className="font-serif text-xl font-bold text-brand-mocha">
            Have a question not listed here?
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-muted max-w-sm mx-auto">
            Our team is available on WhatsApp to help with product details, styling, and sizing questions.
          </p>
          {hasWhatsAppNumber ? <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              "Hello MESM! I have a question about your jewellery."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full text-xs font-semibold hover:bg-[#20ba59] transition-colors shadow-soft"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Us on WhatsApp
          </a> : (
            <p className="text-sm text-brand-mocha-muted">
              WhatsApp contact details are not configured yet. Please use {settings.contactEmail} for assistance.
            </p>
          )}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
