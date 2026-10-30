import { Order } from "@/types";
import { toWhatsAppPhone } from "./utils";

export function generateWhatsAppOrderMessage(order: Order): string {
  const itemsText = order.items
    .map((item) => {
      const variationLine = item.variationText
        ? `\n  - Selected Variation: ${item.variationText}`
        : "";
      return `- ${item.productName} x ${item.quantity}${variationLine}\n  - Unit Price: PKR ${item.unitPrice.toLocaleString()}\n  - Line Total: PKR ${item.lineTotal.toLocaleString()}`;
    })
    .join("\n\n");

  const notesText = order.deliveryInstructions
    ? `\nDelivery Instructions: ${order.deliveryInstructions}`
    : "";
  const giftText = order.giftMessage
    ? `\nGift Message: ${order.giftMessage}`
    : "";
  const paymentProofText = order.paymentProofUrl
    ? `\nPayment Receipt: ${order.paymentProofUrl}`
    : "";

  return `Hello MESM! I would like to confirm my jewellery order.

Order No: ${order.orderNumber}

Customer Name: ${order.customerName}
Phone: ${order.customerPhone}
City: ${order.customerCity}
Delivery Address: ${order.deliveryAddress}${notesText}${giftText}

Order Items:
${itemsText}

Subtotal: PKR ${order.subtotal.toLocaleString()}
Delivery: PKR ${order.deliveryFee.toLocaleString()}
Discount: PKR ${order.discount.toLocaleString()}
Total: PKR ${order.total.toLocaleString()}
Payment Method: ${order.paymentMethod.toUpperCase()}${paymentProofText}

Please confirm availability and delivery details. Thank you!`;
}

export function buildWhatsAppUrl(businessNumber: string, message: string): string | null {
  const cleanPhone = toWhatsAppPhone(businessNumber);
  if (!/^\d{10,15}$/.test(cleanPhone)) return null;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
