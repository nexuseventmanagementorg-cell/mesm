import React from "react";
import { getCategories } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const revalidate = 0;

export default async function NewProductPage() {
  const categories = await getCategories(true);

  return (
    <div className="p-6 sm:p-10">
      <ProductForm categories={categories} />
    </div>
  );
}
