import { Order, OrderItem } from "@/types";
import { toWhatsAppPhone } from "./utils";
import { generateWhatsAppOrderMessage as generateOrderMessage } from "./whatsapp-order-message.mjs";

export function generateWhatsAppOrderMessage(order: Order): string {
  return generateOrderMessage(order);
}

type WhatsAppOrderConfirmation = Omit<
  Pick<
    Order,
    | "id"
    | "orderNumber"
    | "createdAt"
    | "orderStatus"
    | "paymentStatus"
    | "paymentMethod"
    | "paymentProofUrl"
    | "customerName"
    | "customerPhone"
    | "customerCity"
    | "deliveryAddress"
    | "deliveryInstructions"
    | "giftMessage"
    | "items"
    | "subtotal"
    | "deliveryFee"
    | "discount"
    | "total"
  >,
  "items"
> & {
  items: Pick<
    OrderItem,
    "productName" | "sku" | "variationText" | "quantity" | "unitPrice" | "lineTotal"
  >[];
};

export function generateCustomerOrderConfirmationMessage(
  order: WhatsAppOrderConfirmation
): string {
  return generateOrderMessage(order);
}

export function buildWhatsAppUrl(businessNumber: string, message: string): string | null {
  const cleanPhone = toWhatsAppPhone(businessNumber);
  if (!/^\d{10,15}$/.test(cleanPhone)) return null;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
