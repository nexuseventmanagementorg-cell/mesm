import { createHash, timingSafeEqual } from "crypto";

export const CUSTOMER_ORDER_ACCESS_COOKIE = "mesm_customer_order_access";
export const CUSTOMER_ORDER_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24;
export const CUSTOMER_ACCESS_HASH_FIELD = "__mesm_customer_access_token_hash";
const TOKEN_PATTERN = /^([A-Za-z0-9_-]{43})\.(\d{10})$/;

export function hashCustomerOrderAccessToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function persistCustomerAccessHashInTimeline(timeline, tokenHash) {
  if (!timeline.length) return timeline;
  return timeline.map((event, index) =>
    index === 0 ? { ...event, [CUSTOMER_ACCESS_HASH_FIELD]: tokenHash } : event
  );
}

export function recoverCustomerAccessHashFromTimeline(value) {
  if (!Array.isArray(value)) return { timeline: [] };

  let tokenHash;
  const timeline = value.map((event) => {
    if (typeof event !== "object" || event === null || Array.isArray(event)) {
      return event;
    }

    const storedHash = event[CUSTOMER_ACCESS_HASH_FIELD];
    if (typeof storedHash === "string") tokenHash = storedHash;
    const safeEvent = { ...event };
    delete safeEvent[CUSTOMER_ACCESS_HASH_FIELD];
    return safeEvent;
  });
  return { timeline, tokenHash };
}

export function verifyCustomerOrderAccessToken(storedHash, token, now = Date.now()) {
  if (
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(storedHash) ||
    typeof token !== "string"
  ) {
    return false;
  }

  const match = TOKEN_PATTERN.exec(token);
  if (!match || Number(match[2]) <= Math.floor(now / 1000)) return false;

  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(hashCustomerOrderAccessToken(token), "hex");
  return timingSafeEqual(expected, actual);
}

export function getCustomerOrderConfirmation(
  order,
  requestedOrderNumber,
  token,
  now = Date.now()
) {
  if (
    order.orderNumber !== requestedOrderNumber ||
    !verifyCustomerOrderAccessToken(order.customerAccessTokenHash, token, now)
  ) {
    return null;
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentProofUrl: order.paymentProofUrl,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerCity: order.customerCity,
    deliveryAddress: order.deliveryAddress,
    deliveryInstructions: order.deliveryInstructions,
    giftMessage: order.giftMessage,
    items: order.items.map((item) => ({
      productName: item.productName,
      productImage: item.productImage,
      sku: item.sku,
      variationText: item.variationText,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
  };
}
