"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { StoreSettings } from "@/types";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";
import {
  Save,
  MessageCircle,
  CreditCard,
  Truck,
  Sparkles,
  RotateCcw,
  Check,
  FileText,
  Share2,
} from "lucide-react";

type PaymentMethodSetting =
  | "easypaisaEnabled"
  | "jazzcashEnabled"
  | "bankTransferEnabled"
  | "cashOnDeliveryEnabled";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resettingData, setResettingData] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] =
    useState<PaymentMethodSetting | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setMessage("Store settings saved successfully!");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      console.error(err);
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodToggle = async (
    field: PaymentMethodSetting,
    label: string,
    enabled: boolean
  ) => {
    setSettings((current) => current && { ...current, [field]: enabled });
    setSavingPaymentMethod(field);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: enabled }),
      });
      if (!res.ok) throw new Error("Failed to update payment availability");

      setMessage(`${label} ${enabled ? "enabled and visible" : "disabled and hidden"}.`);
    } catch (error) {
      console.error("Failed to update payment availability", error);
      setSettings((current) => current && { ...current, [field]: !enabled });
      setMessage(`Could not update ${label}. Please try again.`);
    } finally {
      setSavingPaymentMethod(null);
    }
  };

  const handleResetData = async () => {
    if (!confirm("Clear all products, orders, and reviews? Categories and store settings will be kept.")) {
      return;
    }
    setResettingData(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        alert("Products, orders, and reviews cleared. Categories and settings were kept. Reloading...");
        window.location.reload();
      } else {
        alert("Failed to clear store data.");
      }
    } catch (e) {
      console.error(e);
      alert("Error clearing store data");
    } finally {
      setResettingData(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-10 text-center text-xs text-brand-mocha-muted">
        Loading store settings...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-mocha/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark block mb-1">
            Store Configuration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-mocha">
            Store Settings
          </h1>
          <p className="text-xs text-brand-mocha-muted mt-1">
            Change your official WhatsApp number, payment account details, delivery fees, and policies without editing source code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          disabled={resettingData}
          className="py-2 px-4 bg-brand-cream border border-brand-mocha/20 hover:bg-brand-sand/40 text-brand-mocha rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-gold" />
          <span>{resettingData ? "Clearing..." : "Clear Store Data"}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        {/* Brand Identity & Logo */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            Brand Identity & Logo
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative h-[60px] w-[110px] overflow-hidden rounded-lg border-2 border-brand-gold/40 bg-brand-mocha flex-shrink-0">
              <Image
                src={settings.logoUrl || "/images/mesm-logo.png"}
                alt="MESM — Personalized Accoutrements for Ladies"
                fill
                sizes="110px"
                priority
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-brand-mocha text-sm">Official MESM Logo</div>
              <p className="text-[11px] text-brand-mocha-muted">
                Upload a JPG, PNG, WebP, AVIF, or GIF image up to 10 MB, then save settings to apply it.
              </p>
              <MediaUploadButton
                accept="image/*"
                label="Upload logo"
                onUploaded={(urls) => {
                  const logoUrl = urls[0];
                  if (logoUrl) {
                    setSettings((current) =>
                      current ? { ...current, logoUrl } : current
                    );
                    setMessage("Logo uploaded. Save Store Settings to apply it.");
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Primary Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Supporting Brand Copy
            </label>
            <input
              type="text"
              value={settings.supportingCopy}
              onChange={(e) => setSettings({ ...settings, supportingCopy: e.target.value })}
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              About Us Story
            </label>
            <textarea
              rows={3}
              value={settings.aboutUs}
              onChange={(e) => setSettings({ ...settings, aboutUs: e.target.value })}
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-3 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>
        </section>

        {/* Social Media Profile Links */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <Share2 className="w-4 h-4 text-brand-gold" />
            Social Media Profiles
          </h2>
          <p className="text-[11px] text-brand-mocha-muted">
            Add your official profile links. Only configured profiles will appear as follow icons in the store footer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Instagram Profile
              </label>
              <input
                type="url"
                value={settings.instagramUrl || ""}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                placeholder="https://www.instagram.com/your-profile"
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Facebook Page
              </label>
              <input
                type="url"
                value={settings.facebookUrl || ""}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                placeholder="https://www.facebook.com/your-page"
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                TikTok Profile
              </label>
              <input
                type="url"
                value={settings.tiktokUrl || ""}
                onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                placeholder="https://www.tiktok.com/@your-profile"
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </section>

        {/* WhatsApp & Order Communication Settings */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            Official WhatsApp Channel
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Business WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="03001234567"
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-sm font-bold text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
              <span className="text-[11px] text-brand-mocha-muted mt-1 block">
                All customer checkout orders will automatically open a chat with this number!
              </span>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="pt-2 border-t border-brand-mocha/10 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="annCheck"
                checked={settings.announcementEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, announcementEnabled: e.target.checked })
                }
                className="rounded text-brand-mocha focus:ring-brand-gold"
              />
              <label htmlFor="annCheck" className="font-semibold text-brand-mocha cursor-pointer">
                Enable Top Announcement Bar in Store Header
              </label>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
                Announcement Message
              </label>
              <input
                type="text"
                value={settings.announcementText}
                onChange={(e) =>
                  setSettings({ ...settings, announcementText: e.target.value })
                }
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </section>

        {/* EasyPaisa, JazzCash & Payment Settings */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <CreditCard className="w-4 h-4 text-brand-gold" />
            EasyPaisa, JazzCash & Payment Account Details
          </h2>

          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-brand-mocha">
              Available Payment Methods
            </h3>
            <p className="text-[11px] text-brand-mocha-muted">
              Turn a method off to hide it from checkout and the storefront. Transfer methods also need account details.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ["easypaisaEnabled", "EasyPaisa"],
                ["jazzcashEnabled", "JazzCash"],
                ["bankTransferEnabled", "Bank Transfer"],
                ["cashOnDeliveryEnabled", "Cash on Delivery"],
              ] as const).map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 p-3 bg-brand-ivory rounded-xl border border-brand-mocha/10 font-semibold text-brand-mocha cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings[field]}
                    disabled={savingPaymentMethod === field}
                    onChange={(e) => handlePaymentMethodToggle(field, label, e.target.checked)}
                    className="h-4 w-4 accent-brand-gold"
                  />
                  <span>{label}</span>
                  <span className="ml-auto text-[10px] font-medium text-brand-mocha-muted">
                    {savingPaymentMethod === field
                      ? "Saving..."
                      : settings[field]
                        ? "Available"
                        : "Off"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* EasyPaisa */}
            <div className="p-4 bg-brand-ivory rounded-2xl border border-brand-mocha/10 space-y-3">
              <h3 className="font-bold text-brand-mocha text-xs uppercase tracking-wider">
                EasyPaisa Configuration
              </h3>
              <div>
                <label className="block font-medium text-brand-mocha mb-1">Account Number:</label>
                <input
                  type="text"
                  value={settings.easypaisaNumber}
                  onChange={(e) => setSettings({ ...settings, easypaisaNumber: e.target.value })}
                  className="w-full bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                />
              </div>
              <div>
                <label className="block font-medium text-brand-mocha mb-1">Account Title:</label>
                <input
                  type="text"
                  value={settings.easypaisaTitle}
                  onChange={(e) => setSettings({ ...settings, easypaisaTitle: e.target.value })}
                  className="w-full bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                />
              </div>
            </div>

            {/* JazzCash */}
            <div className="p-4 bg-brand-ivory rounded-2xl border border-brand-mocha/10 space-y-3">
              <h3 className="font-bold text-brand-mocha text-xs uppercase tracking-wider">
                JazzCash Configuration
              </h3>
              <div>
                <label className="block font-medium text-brand-mocha mb-1">Account Number:</label>
                <input
                  type="text"
                  value={settings.jazzcashNumber}
                  onChange={(e) => setSettings({ ...settings, jazzcashNumber: e.target.value })}
                  className="w-full bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                />
              </div>
              <div>
                <label className="block font-medium text-brand-mocha mb-1">Account Title:</label>
                <input
                  type="text"
                  value={settings.jazzcashTitle}
                  onChange={(e) => setSettings({ ...settings, jazzcashTitle: e.target.value })}
                  className="w-full bg-brand-warm border border-brand-mocha/20 rounded-lg px-3 py-1.5 text-xs text-brand-mocha"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
              Direct Bank Transfer Instructions & IBAN
            </label>
            <input
              type="text"
              value={settings.bankDetails}
              onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
              className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
            />
          </div>
        </section>

        {/* Courier & Delivery Rules */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-5">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <Truck className="w-4 h-4 text-brand-gold" />
            Courier Delivery Rules & Shipping Fees
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Flat Courier Delivery Fee (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={settings.flatDeliveryFee}
                onChange={(e) =>
                  setSettings({ ...settings, flatDeliveryFee: Number(e.target.value) })
                }
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Free Delivery Threshold (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={settings.freeDeliveryThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
              <span className="text-[11px] text-brand-mocha-muted mt-1 block">
                Orders equal or exceeding this total automatically get FREE shipping.
              </span>
            </div>
          </div>
        </section>

        {/* Store Policies */}
        <section className="p-6 sm:p-8 bg-brand-warm rounded-3xl border border-brand-mocha/10 shadow-soft space-y-4">
          <h2 className="font-serif text-base font-bold text-brand-mocha flex items-center gap-2 pb-3 border-b border-brand-mocha/10">
            <FileText className="w-4 h-4 text-brand-gold" />
            Legal & Customer Policies
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
                Returns & Replacement Policy
              </label>
              <textarea
                rows={2}
                value={settings.policies.returns}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, returns: e.target.value },
                  })
                }
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-2.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-mocha mb-1">
                Shipping & Delivery Policy
              </label>
              <textarea
                rows={2}
                value={settings.policies.shipping}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, shipping: e.target.value },
                  })
                }
                className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl p-2.5 text-xs text-brand-mocha focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3.5 px-8 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full font-bold text-xs shadow-card flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4 text-brand-gold-light" />
            <span>{saving ? "Saving Settings..." : "Save All Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
