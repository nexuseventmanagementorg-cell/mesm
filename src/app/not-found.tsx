import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-5">
        <div className="relative h-[110px] w-[202px] overflow-hidden rounded-xl border-2 border-brand-gold/40 bg-brand-mocha shadow-card">
          <SiteLogo
            alt="MESM — Personalized Accoutrements for Ladies"
            sizes="202px"
            priority
            className="object-cover"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 404 — Page Not Found
          </span>
          <h1 className="font-serif text-3xl font-bold text-brand-mocha">
            Looking for something precious?
          </h1>
          <p className="text-xs text-brand-mocha-muted leading-relaxed">
            The jewellery piece or page you are looking for may have moved or is no longer in stock.
          </p>
        </div>

        <Link
          href="/shop"
          className="px-6 py-3 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors inline-flex items-center gap-2 shadow-soft"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Jewellery Catalogue</span>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
