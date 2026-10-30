"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  ShieldCheck,
  Mail,
  MapPin,
  Heart,
  LockKeyhole,
} from "lucide-react";
import { StoreSettings } from "@/types";
import { toWhatsAppPhone } from "@/lib/utils";
import { FooterSocialLinks } from "./FooterSocialLinks";
import { SiteLogo } from "./SiteLogo";
import { getAvailablePaymentMethods } from "@/lib/payment-methods";

interface FooterProps {
  settings?: StoreSettings;
}

export function Footer({ settings }: FooterProps) {
  const [loadedSettings, setLoadedSettings] = useState(settings);
  useEffect(() => {
    fetch("/api/settings")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load payment settings");
        return response.json();
      })
      .then(setLoadedSettings)
      .catch((error) => console.error("Failed to load footer settings", error));
  }, [settings]);

  const currentSettings = loadedSettings || settings;
  const availablePaymentMethods = getAvailablePaymentMethods(currentSettings || null);
  const paymentMethodLabels = {
    easypaisa: "EasyPaisa",
    jazzcash: "JazzCash",
    bank_transfer: "Bank Transfer",
    cod: "Cash on Delivery",
  };
  const cleanPhone = currentSettings?.whatsappNumber
    ? toWhatsAppPhone(currentSettings.whatsappNumber)
    : "";
  const hasWhatsAppNumber = /^\d{10,15}$/.test(cleanPhone);

  return (
    <footer className="bg-brand-cream/80 border-t border-brand-mocha/10 text-brand-mocha pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-brand-mocha/10">
          {/* Brand Identity Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-[76px] w-[140px] overflow-hidden rounded-lg border border-brand-gold/40 bg-brand-mocha">
                <SiteLogo
                  logoUrl={settings?.logoUrl}
                  alt="MESM — Personalized Accoutrements for Ladies"
                  sizes="140px"
                  className="object-cover"
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-brand-mocha-muted leading-relaxed">
              {settings?.supportingCopy ||
                "Discover a carefully selected collection of modern and traditional jewellery, with styles for everyday wear and special occasions."}
            </p>

            <div className="pt-1">
              {hasWhatsAppNumber ? (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    "Hello MESM! I have an inquiry regarding your jewellery collection."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-full text-xs font-semibold hover:bg-[#20ba59] transition-colors shadow-soft"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Assistance
                </a>
              ) : (
                <p className="text-xs text-brand-mocha-muted">
                  WhatsApp support details will appear here once configured.
                </p>
              )}
            </div>

            <FooterSocialLinks settings={settings} />
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-serif text-base font-bold text-brand-mocha mb-4 tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-brand-mocha-muted">
              <li>
                <Link href="/shop" className="hover:text-brand-gold transition-colors">
                  Explore Full Catalogue
                </Link>
              </li>
              <li>
                <Link href="/shop?category=earrings" className="hover:text-brand-gold transition-colors">
                  Earrings & Studs
                </Link>
              </li>
              <li>
                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 text-brand-mocha-muted/70"
                  title="Coming Soon"
                >
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Pressed Flower Resin — Coming Soon
                </span>
              </li>
              <li>
                <Link href="/shop?category=jewellery-set" className="hover:text-brand-gold transition-colors">
                  Jewellery Sets
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-gold transition-colors">
                  About Our Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Help Column */}
          <div>
            <h4 className="font-serif text-base font-bold text-brand-mocha mb-4 tracking-wide">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-brand-mocha-muted">
              <li>
                <Link href="/faq" className="hover:text-brand-gold transition-colors">
                  FAQ & Care Guide
                </Link>
              </li>
              <li>
                <Link href="/policies#shipping" className="hover:text-brand-gold transition-colors">
                  Shipping & Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/policies#returns" className="hover:text-brand-gold transition-colors">
                  Returns & Exchanges Policy
                </Link>
              </li>
              <li>
                <Link href="/policies#privacy" className="hover:text-brand-gold transition-colors">
                  Privacy & Confidentiality
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-gold transition-colors flex items-center gap-1.5 text-xs text-brand-mocha-muted">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Contact Column */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-brand-mocha mb-4 tracking-wide">
              Payment & Delivery
            </h4>
            <p className="text-xs text-brand-mocha-muted leading-relaxed">
              {availablePaymentMethods.length > 0
                ? `Available payment methods: ${availablePaymentMethods
                    .map((method) => paymentMethodLabels[method])
                    .join(", ")}.`
                : "Please contact us to confirm available payment methods."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {availablePaymentMethods.map((method) => (
                <span
                  key={method}
                  className="px-2.5 py-1 bg-brand-ivory border border-brand-mocha/10 rounded-md text-[11px] font-semibold text-brand-mocha shadow-xs"
                >
                  {paymentMethodLabels[method]}
                </span>
              ))}
            </div>

            <div className="pt-2 text-xs text-brand-mocha-muted flex flex-col space-y-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-gold" /> {currentSettings?.contactEmail || "hello@meemsgems.com"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-gold" /> Nationwide Courier Delivery across Pakistan
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-mocha-muted gap-4">
          <p>© {new Date().getFullYear()} MESM. All rights reserved.</p>
          <div className="flex flex-col items-center gap-2 text-[11px] sm:items-end">
            <p className="flex items-center gap-1">
              Designed for women who shine <Heart className="w-3 h-3 text-brand-rose inline fill-brand-rose" />
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-1">
              Website by <span className="font-semibold text-brand-mocha">DURRANI WEB DEVELOPERS</span>
              <span aria-hidden="true">·</span>
              <a
                href="https://wa.me/923054359098?text=Hello%20Durrani%20Web%20Developers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-mocha hover:text-brand-gold-dark transition-colors"
                aria-label="Contact Durrani Web Developers on WhatsApp at 0305 4359098"
              >
                <MessageCircle className="h-3 w-3 text-[#25D366]" />
                WhatsApp 0305 4359098
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
