"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { CategoryImage } from "@/components/layout/CategoryImage";
import { Category, StoreSettings } from "@/types";

interface HeaderProps {
  settings?: StoreSettings;
  categories?: Category[];
}

const primaryNavigation = [
  { label: "Shop All", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "New In", href: "/shop?collection=new-in" },
  { label: "Best Sellers", href: "/shop?collection=best-sellers" },
  { label: "Gift Picks", href: "/shop?collection=gift-picks" },
  { label: "Our Story", href: "/about" },
];

function DesktopNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium text-brand-mocha">
      {primaryNavigation.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`whitespace-nowrap transition-colors hover:text-brand-gold ${
            (item.href === "/shop" && pathname === "/shop") ||
            (item.href === "/categories" && pathname === "/categories") ||
            (item.href.includes("collection=") &&
              pathname === "/shop" &&
              searchParams.get("collection") ===
                new URLSearchParams(item.href.split("?")[1]).get("collection")) ||
            (item.href === "/about" && pathname === "/about")
              ? "text-brand-gold font-semibold"
              : ""
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function DesktopNavigationFallback() {
  return (
    <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium text-brand-mocha">
      {primaryNavigation.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="whitespace-nowrap transition-colors hover:text-brand-gold"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Header({ settings, categories = [] }: HeaderProps) {
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-warm/95 backdrop-blur-md border-b border-brand-mocha/10 transition-all duration-200">
      {/* Announcement Bar */}
      {settings?.announcementEnabled !== false && (
        <div className="bg-gradient-to-r from-brand-mocha via-brand-mocha-light to-brand-mocha text-brand-ivory text-xs sm:text-sm py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold-light animate-pulse" />
          <span>
            {settings?.announcementText ||
              "✨ Free Delivery on jewellery orders above PKR 3,000!"}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-brand-gold-light animate-pulse hidden sm:inline" />
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-brand-mocha hover:text-brand-gold transition-colors focus:outline-none"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>

          {/* Website Logo — MANDATORY ORIGINAL ASSET */}
          <div className="flex-shrink min-w-0 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-3 group focus:outline-none"
              title="MESM — Personalized Accoutrements for Ladies"
            >
              <div className="nav-logo-float relative h-[62px] w-[112px] sm:h-[76px] sm:w-[140px] overflow-hidden rounded-lg border border-brand-gold/40 bg-brand-mocha shadow-soft transition-all duration-300 group-hover:border-brand-gold flex-shrink-0">
                <SiteLogo
                  logoUrl={settings?.logoUrl}
                  alt="MESM — Personalized Accoutrements for Ladies"
                  sizes="(max-width: 640px) 112px, 140px"
                  priority
                  className="object-cover"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <Suspense fallback={<DesktopNavigationFallback />}>
            <DesktopNavigation />
          </Suspense>

          {/* Right Action Icons */}
          <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-4">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1.5 sm:p-2 text-brand-mocha hover:text-brand-gold transition-colors rounded-full hover:bg-brand-sand/30"
              aria-label="Search catalogue"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 sm:p-2.5 bg-brand-mocha text-brand-ivory rounded-full hover:bg-brand-mocha-dark transition-all duration-200 shadow-soft relative flex items-center gap-1.5 focus:outline-none"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-brand-gold-light" />
              <span className="text-xs font-bold px-0.5">{itemCount}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {searchOpen && (
          <div className="py-3 px-2 border-t border-brand-mocha/10 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search earrings, resin pendants, rings, kundan..."
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-full py-2.5 pl-11 pr-24 text-sm text-brand-mocha placeholder:text-brand-mocha-muted/60 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                autoFocus
              />
              <Search className="w-4 h-4 text-brand-mocha-muted absolute left-4" />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-brand-mocha text-brand-ivory rounded-full text-xs font-medium hover:bg-brand-mocha-dark transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-warm border-b border-brand-mocha/10 px-4 pt-3 pb-6 shadow-xl animate-fadeIn">
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-2 border-b border-brand-mocha/5 pb-3">
              {primaryNavigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-brand-cream/60 px-3 py-2 text-sm font-medium text-brand-mocha hover:text-brand-gold"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-dark">
                Categories
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop?category=${encodeURIComponent(c.slug)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-w-0 items-center gap-2 rounded-lg py-1 text-sm text-brand-mocha-light hover:text-brand-gold"
                  >
                    {c.imageUrl && (
                      <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-brand-gold/30 bg-brand-cream">
                        <CategoryImage src={c.imageUrl} alt="" />
                      </span>
                    )}
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-brand-mocha/10 flex flex-col space-y-2 text-sm text-brand-mocha">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-brand-gold"
              >
                About MESM
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-brand-gold"
              >
                FAQ & Care Guide
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-xs text-brand-mocha-muted hover:text-brand-gold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
