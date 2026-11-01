const ORDER_ITEM_KEYS = new Set([
  "id",
  "productId",
  "productName",
  "productSlug",
  "productImage",
  "variationText",
  "quantity",
  "unitPrice",
  "lineTotal",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isPersistedOrderResponse(value) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.order_number) ||
    !isNonEmptyString(value.customer_name) ||
    !isNonEmptyString(value.customer_phone) ||
    !isNonEmptyString(value.customer_city) ||
    !isNonEmptyString(value.delivery_address) ||
    !isNonEmptyString(value.created_at) ||
    !isNonEmptyString(value.order_status) ||
    !isNonEmptyString(value.payment_status) ||
    !isNonEmptyString(value.payment_method) ||
    !isNonNegativeNumber(value.subtotal) ||
    !isNonNegativeNumber(value.delivery_fee) ||
    !isNonNegativeNumber(value.discount) ||
    !isNonNegativeNumber(value.total) ||
    !Array.isArray(value.items) ||
    value.items.length === 0
  ) {
    return false;
  }

  return value.items.every((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      Object.keys(item).some((key) => !ORDER_ITEM_KEYS.has(key))
    ) {
      return false;
    }

    return (
      isNonEmptyString(item.id) &&
      isNonEmptyString(item.productId) &&
      isNonEmptyString(item.productName) &&
      isNonEmptyString(item.productSlug) &&
      isNonEmptyString(item.productImage) &&
      (item.variationText === undefined || typeof item.variationText === "string") &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      isNonNegativeNumber(item.unitPrice) &&
      isNonNegativeNumber(item.lineTotal)
    );
  });
}
