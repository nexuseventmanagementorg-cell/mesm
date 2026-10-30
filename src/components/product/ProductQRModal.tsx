"use client";

import React, { useEffect, useState } from "react";
import { QrCode, Download, Copy, Check, Printer, X } from "lucide-react";
import { Product } from "@/types";
import { generateQRCodeDataUrl, getProductPublicUrl } from "@/lib/qr";

interface ProductQRModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQRModal({ product, isOpen, onClose }: ProductQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/product/${product.slug}`
    : getProductPublicUrl(product.slug);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    generateQRCodeDataUrl(publicUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#42100F", light: "#F8F2E9" },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("QR generation failed", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `mesm-${product.slug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSVG = () => {
    window.open(`/api/qr?slug=${product.slug}&format=svg`, "_blank");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${product.name} - MESM QR Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #F8F2E9; color: #42100F; }
            .card { text-align: center; border: 2px dashed #B58A45; padding: 32px; border-radius: 20px; background: #FFFAF2; max-width: 340px; }
            .logo { width: 128px; height: 70px; border-radius: 8px; margin-bottom: 12px; }
            h2 { font-size: 20px; margin: 0 0 4px 0; }
            p { font-size: 13px; color: #80655B; margin: 0 0 16px 0; }
            .sku { font-size: 11px; font-weight: bold; color: #B58A45; text-transform: uppercase; margin-bottom: 16px; }
            img.qr { width: 220px; height: 220px; border-radius: 12px; border: 1px solid #F8F2E9; }
            .footer { font-size: 11px; color: #80655B; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <img class="logo" src="/images/mesm-logo.png" alt="MESM Logo" />
            <h2>${product.name}</h2>
            <div class="sku">SKU: ${product.sku}</div>
            <img class="qr" src="${qrDataUrl}" alt="QR Code" />
            <p>Scan with your camera to open product & order on WhatsApp</p>
            <div class="footer">MESM — Personalized Accoutrements for Ladies</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-brand-warm rounded-3xl p-6 sm:p-8 max-w-md w-full border border-brand-mocha/10 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-brand-mocha-muted hover:text-brand-mocha rounded-full hover:bg-brand-sand/50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-mocha text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5 text-brand-gold-dark" /> Product QR Code
          </div>

          <h3 className="font-serif text-xl font-bold text-brand-mocha">
            {product.name}
          </h3>
          <p className="text-xs text-brand-mocha-muted">SKU: {product.sku}</p>

          {/* QR Display */}
          <div className="relative mx-auto w-64 h-64 p-3 bg-brand-ivory rounded-2xl border border-brand-mocha/10 shadow-soft flex items-center justify-center">
            {loading ? (
              <div className="text-xs text-brand-mocha-muted animate-pulse">Generating QR...</div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${product.name}`}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-xs text-red-500">Failed to render QR</div>
            )}
          </div>

          <p className="text-[11px] text-brand-mocha-muted">
            Directs shoppers straight to this product&apos;s live mobile page.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleDownloadPNG}
              className="py-2.5 px-3 bg-brand-mocha text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-mocha-dark transition-colors flex items-center justify-center gap-1.5 shadow-soft"
            >
              <Download className="w-3.5 h-3.5" /> Download PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              className="py-2.5 px-3 bg-brand-ivory border border-brand-mocha/20 text-brand-mocha text-xs font-semibold rounded-full hover:bg-brand-sand/50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-brand-gold" /> Download SVG
            </button>
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-brand-ivory border border-brand-mocha/20 text-brand-mocha text-xs font-semibold rounded-full hover:bg-brand-sand/50 transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-brand-mocha-muted" /> Copy Link
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 bg-brand-gold text-brand-ivory text-xs font-semibold rounded-full hover:bg-brand-gold-dark transition-colors flex items-center justify-center gap-1.5 shadow-soft"
            >
              <Printer className="w-3.5 h-3.5" /> Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
