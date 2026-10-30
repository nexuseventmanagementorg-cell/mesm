"use client";

import { useId, useState } from "react";
import type { ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";

function isUploadResponse(value: unknown): value is { urls: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "urls" in value &&
    Array.isArray(value.urls) &&
    value.urls.every((url: unknown) => typeof url === "string")
  );
}

interface MediaUploadButtonProps {
  accept: "image/*" | "video/*";
  label: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
}

export function MediaUploadButton({
  accept,
  label,
  multiple = false,
  onUploaded,
}: MediaUploadButtonProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Media upload failed.";
        throw new Error(message);
      }
      if (!isUploadResponse(result)) {
        throw new Error("The upload server returned an invalid response.");
      }

      onUploaded(result.urls);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Media upload failed."
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleUpload}
        disabled={uploading}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-mocha/20 bg-brand-ivory px-4 py-2.5 font-semibold text-brand-mocha hover:border-brand-gold/60 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <UploadCloud className="h-4 w-4 text-brand-gold" />
        {uploading ? "Uploading..." : label}
      </label>
      {error && (
        <p role="alert" className="mt-2 text-[11px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
