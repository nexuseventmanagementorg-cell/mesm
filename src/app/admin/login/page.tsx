"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, UserRound, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { SiteLogo } from "@/components/layout/SiteLogo";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      window.location.replace("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-brand-mocha">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        {/* Real Brand Logo */}
        <div className="relative h-[110px] w-[202px] mx-auto overflow-hidden rounded-xl border-2 border-brand-gold/40 bg-brand-mocha shadow-card">
          <SiteLogo
            alt="MESM — Personalized Accoutrements for Ladies"
            sizes="202px"
            priority
            className="object-cover"
          />
        </div>

        <div>
          <h2 className="font-serif text-3xl font-bold text-brand-mocha tracking-tight">
            MESM
          </h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold-dark mt-1">
            Protected Administrator Portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-brand-warm py-8 px-6 sm:px-10 rounded-3xl border border-brand-mocha/10 shadow-card space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                />
                <UserRound className="w-4 h-4 text-brand-mocha-muted absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-mocha mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-ivory border border-brand-mocha/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-mocha focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                />
                <Lock className="w-4 h-4 text-brand-mocha-muted absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-gold/20 text-[11px] text-brand-mocha-muted">
              <div className="font-semibold text-brand-mocha flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> Secure administrator access
              </div>
              <p className="mt-1">
                Sign-in credentials are configured privately by the store owner and are never displayed here.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-mocha hover:bg-brand-mocha-dark text-brand-ivory rounded-full text-xs font-semibold transition-all shadow-soft flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Admin Panel"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-brand-mocha/10">
            <Link
              href="/"
              className="text-xs text-brand-mocha-muted hover:text-brand-gold transition-colors font-medium"
            >
              ← Back to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
