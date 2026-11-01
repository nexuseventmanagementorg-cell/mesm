import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StoryReadingText } from "@/components/layout/StoryReadingText";
import { getStoreSettings } from "@/lib/db";
import { Sparkles, Heart, ShieldCheck, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default async function AboutPage() {
  const settings = await getStoreSettings();
  const storyText = settings.aboutUs.replace(/^Our Story(?:\s*[—–:-])?\s*/i, "");

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-mocha">
      <Header settings={settings} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex-1 w-full space-y-16">
        {/* Brand intro header */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto aspect-[3/2] w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-brand-gold/40 bg-brand-mocha shadow-soft">
            <Image
              src="/images/mesm-our-story.png"
              alt="Our Story — MESM jewellery, thoughtfully curated for every woman and every story"
              fill
              priority
              sizes="(max-width: 768px) calc(100vw - 2rem), 1024px"
              className="object-contain"
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block">
            Our Story & Style
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-mocha">
            About MESM
          </h1>
          <p className="font-serif text-lg italic text-brand-mocha-light">
            &ldquo;{settings.tagline || "Personalized Accoutrements for Ladies"}&rdquo;
          </p>
        </div>

        {/* Narrative Box */}
        <div className="bg-brand-warm rounded-3xl p-8 sm:p-12 border border-brand-mocha/10 shadow-soft space-y-6 text-sm sm:text-base leading-relaxed text-brand-mocha-muted">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-mocha">
            Our Story
          </h2>
          <p className="font-sans text-base sm:text-lg font-medium text-brand-mocha">
            <StoryReadingText text={storyText} />
          </p>
          <p>{settings.supportingCopy}</p>
          <p>
            Our collection brings modern trends and traditional favourites together in one place. We carefully select jewellery for everyday wear, celebrations, and all the moments in between, so you can find pieces that feel like your own.
          </p>
        </div>

        {/* Studio Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-cream text-brand-gold mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-mocha">Modern & Traditional</h3>
            <p className="text-xs text-brand-mocha-muted leading-relaxed">
              Discover contemporary styles alongside classic designs inspired by traditional jewellery.
            </p>
          </div>

          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-cream text-brand-gold mx-auto flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-mocha">A Curated Collection</h3>
            <p className="text-xs text-brand-mocha-muted leading-relaxed">
              Browse a considered selection of jewellery for daily looks, celebrations, and meaningful gifts.
            </p>
          </div>

          <div className="p-6 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-cream text-brand-gold mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-mocha">Here to Help</h3>
            <p className="text-xs text-brand-mocha-muted leading-relaxed">
              Message our team on WhatsApp for help with product details, your order, or choosing a style.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-mocha text-brand-ivory text-sm font-semibold rounded-full hover:bg-brand-mocha-dark transition-all shadow-card"
          >
            <span>Discover The Jewellery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
