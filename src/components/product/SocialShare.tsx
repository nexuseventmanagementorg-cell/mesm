"use client";

import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
} from "lucide-react";
import { Product } from "@/types";
import { ProductQRModal } from "./ProductQRModal";

interface SocialShareProps {
  product: Product;
}

export function SocialShare({ product }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://meemsgems.com/product/${product.slug}`;

  const shareText = `Check out this gorgeous ${product.name} at MESM!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl,
        });
      } catch {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n${productUrl}`
  )}`;

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    productUrl
  )}`;

  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
    productUrl
  )}&media=${encodeURIComponent(
    product.images[0] || ""
  )}&description=${encodeURIComponent(shareText)}`;

  return (
    <>
      <div className="pt-4 border-t border-brand-mocha/10">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-brand-mocha flex items-center gap-1.5 mr-1">
            <Share2 className="w-3.5 h-3.5 text-brand-gold" /> Share:
          </span>

          {/* WhatsApp Share */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
            title="Share to WhatsApp"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          {/* Facebook Share */}
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors font-bold text-xs w-8 h-8 flex items-center justify-center"
            title="Share on Facebook"
            aria-label="Share on Facebook"
          >
            f
          </a>

          {/* Pinterest Share */}
          <a
            href={pinterestShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors font-bold text-xs w-8 h-8 flex items-center justify-center"
            title="Pin on Pinterest"
            aria-label="Share on Pinterest"
          >
            P
          </a>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-full bg-brand-mocha/5 text-brand-mocha hover:bg-brand-mocha hover:text-brand-ivory transition-colors"
            title="Copy Product Link"
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* View / Download QR Code Button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-gold/15 text-brand-mocha hover:bg-brand-gold hover:text-brand-ivory text-xs font-semibold transition-colors"
            title="View Product QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-gold-dark" />
            <span>QR Code</span>
          </button>

          {/* Web Share API */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              title="Share using your device's available apps"
              aria-label="Share with more apps"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-sand/50 text-brand-mocha hover:bg-brand-sand text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More apps</span>
            </button>
          )}
        </div>
      </div>

      <ProductQRModal
        product={product}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </>
  );
}
