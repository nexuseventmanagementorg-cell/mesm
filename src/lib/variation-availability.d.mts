import type { ProductVariation } from "@/types";

export function isVariationOptionAvailable(
  variation: ProductVariation,
  option: string
): boolean;

export function getAvailableVariationOptions(
  variation: ProductVariation
): string[];

export function getDefaultVariationSelections(
  variations: ProductVariation[]
): Record<string, string>;

export function hasAvailableVariantSelection(
  variations: ProductVariation[]
): boolean;

export function areVariationSelectionsAvailable(
  variations: ProductVariation[],
  variationText?: string
): boolean;
