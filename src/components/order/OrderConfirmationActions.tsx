"use client";

import React, { useState } from "react";
import { MessageCircle, Copy, Check, ExternalLink } from "lucide-react";

interface OrderConfirmationActionsProps {
  whatsappUrl: string | null;
  whatsappMessage: string;
}

export function OrderConfirmationActions({
  whatsappUrl,
  whatsappMessage,
}: OrderConfirmationActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
      {whatsappUrl && (
        <button
          onClick={handleOpenWhatsApp}
          className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft transition-all"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Open WhatsApp Chat</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>
      )}

      <button
        onClick={handleCopy}
        className="w-full sm:w-auto px-5 py-3 bg-white border border-emerald-300 text-emerald-900 rounded-full font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors shadow-xs"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-emerald-700" />
            <span>Copy Order Message</span>
          </>
        )}
      </button>
    </div>
  );
}
