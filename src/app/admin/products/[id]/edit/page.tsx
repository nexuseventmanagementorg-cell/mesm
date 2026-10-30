import React from "react";
import { notFound } from "next/navigation";
import { getCategories, getProductById } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const revalidate = 0;

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const product = await getProductById(params.id);
  if (!product) {
    notFound();
  }

  const categories = await getCategories(true);

  return (
    <div className="p-6 sm:p-10">
      <ProductForm initialProduct={product} categories={categories} />
    </div>
  );
}
