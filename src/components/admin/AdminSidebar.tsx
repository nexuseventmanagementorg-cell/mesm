"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  LayoutDashboard,
  Gem,
  PlusCircle,
  FolderTree,
  ShoppingBag,
  TrendingUp,
  Settings,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Gem },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/settings", label: "Store Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-warm border-r border-brand-mocha/10 flex flex-col justify-between min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-brand-mocha/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="relative h-[52px] w-[96px] overflow-hidden rounded-md border border-brand-gold/40 bg-brand-mocha flex-shrink-0">
              <SiteLogo
                alt="MESM — Personalized Accoutrements for Ladies"
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-brand-mocha tracking-wide block">
                MESM
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-gold-dark">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Prominent Add Product CTA */}
        <div className="p-4">
          <Link
            href="/admin/products/new"
            className="w-full py-2.5 px-4 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-gold-light" />
            <span>+ Add Product</span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1 text-xs font-medium text-brand-mocha">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-brand-cream text-brand-mocha font-bold border border-brand-gold/25 shadow-xs"
                    : "hover:bg-brand-sand/30 text-brand-mocha-muted hover:text-brand-mocha"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-brand-gold-dark" : "text-brand-mocha-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-brand-mocha/10 space-y-2 text-xs">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/30 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> View Customer Store
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out Admin</span>
        </button>
      </div>
    </aside>
  );
}
