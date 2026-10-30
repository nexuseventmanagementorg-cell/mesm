"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { ProductQRModal } from "@/components/product/ProductQRModal";
import { Edit3, Eye, QrCode, Copy, Trash2 } from "lucide-react";

interface AdminProductRowActionsProps {
  product: Product;
}

export function AdminProductRowActions({ product }: AdminProductRowActionsProps) {
  const router = useRouter();
  const [showQR, setShowQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.status === 404) {
        router.refresh();
        alert("This product was already removed. The catalogue has been refreshed.");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error deleting product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicateData = {
        ...product,
        id: undefined,
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
        sku: `${product.sku}-CPY`,
        status: "draft",
        orderCount: 0,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to duplicate product");
      }
    } catch (e) {
      console.error(e);
      alert("Error duplicating product");
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1 text-xs">
        {/* View on live store */}
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="p-1.5 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-lg transition-colors"
          title="View on Live Store"
        >
          <Eye className="w-4 h-4" />
        </Link>

        {/* View QR Code */}
        <button
          onClick={() => setShowQR(true)}
          className="p-1.5 text-brand-mocha-muted hover:text-brand-gold hover:bg-brand-sand/40 rounded-lg transition-colors"
          title="View & Download Product QR Code"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Edit */}
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="p-1.5 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-lg transition-colors"
          title="Edit Product"
        >
          <Edit3 className="w-4 h-4" />
        </Link>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="p-1.5 text-brand-mocha-muted hover:text-brand-mocha hover:bg-brand-sand/40 rounded-lg transition-colors"
          title="Duplicate Product"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-brand-mocha-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          title="Delete Product"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <ProductQRModal
        product={product}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </>
  );
}
