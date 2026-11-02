"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";

interface CustomerPaymentReceiptUploadProps {
  orderNumber: string;
  accessToken: string;
  paymentProofUrl?: string;
  paymentStatus: string;
}

export function CustomerPaymentReceiptUpload({
  orderNumber,
  accessToken,
  paymentProofUrl,
  paymentStatus,
}: CustomerPaymentReceiptUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const canUpload = ["unpaid", "awaiting_verification"].includes(paymentStatus);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !canUpload) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const uploadData = new FormData();
      uploadData.set("file", file);
      const uploadResponse = await fetch("/api/payment-proof", {
        method: "POST",
        body: uploadData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || typeof uploadResult.url !== "string") {
        throw new Error(uploadResult.error || "Unable to upload the receipt image.");
      }

      const attachResponse = await fetch(
        `/api/customer-orders/${encodeURIComponent(orderNumber)}/payment-proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            paymentProofUrl: uploadResult.url,
          }),
        }
      );
      const attachResult = await attachResponse.json();
      if (!attachResponse.ok) {
        throw new Error(attachResult.error || "Unable to attach the receipt to your order.");
      }

      setFile(null);
      setSuccess("Receipt received! MESM is reviewing your transaction. ✨");
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to submit the payment receipt."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-800">
          {paymentProofUrl ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-base font-bold text-brand-mocha">
            {paymentProofUrl ? "Payment receipt received" : "Upload payment receipt"}
          </h2>
          <p className="text-xs leading-relaxed text-brand-mocha-muted">
            {paymentProofUrl
              ? "Your transaction screenshot is attached to this order and awaiting MESM verification."
              : "If you have completed your payment, upload the transaction screenshot here so MESM can verify it."}
          </p>
        </div>
      </div>

      {canUpload ? (
        <form onSubmit={handleUpload} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-brand-mocha">
              Transaction screenshot (JPG, PNG, or WebP; up to 5 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setError("");
                setSuccess("");
              }}
              className="block w-full rounded-xl border border-brand-mocha/15 bg-white p-2 text-xs text-brand-mocha file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-amber-950"
            />
          </label>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-mocha px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-mocha-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {isUploading ? "Uploading receipt..." : paymentProofUrl ? "Replace receipt" : "Upload receipt"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-xs font-medium text-emerald-800">
          Payment status: {paymentStatus.replaceAll("_", " ")}. Receipt uploads are closed for this order.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
          {success}
        </p>
      )}
    </section>
  );
}
