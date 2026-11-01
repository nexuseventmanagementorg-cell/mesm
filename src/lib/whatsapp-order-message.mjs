function formatPkr(amount) {
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `PKR ${formatted}`;
}

export function generateWhatsAppOrderMessage(order) {
  const orderDate = new Date(order.createdAt);
  const formattedDate = Number.isNaN(orderDate.getTime())
    ? order.createdAt
    : new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Karachi",
      }).format(orderDate);
  const itemsText = order.items
    .map((item) => {
      const skuLine = item.sku ? `\n  SKU: ${item.sku}` : "";
      const variationLine = item.variationText
        ? `\n  Variation: ${item.variationText}`
        : "";
      return `- ${item.productName}${skuLine}${variationLine}\n  Quantity: ${item.quantity}\n  Unit price: ${formatPkr(item.unitPrice)}\n  Item subtotal: ${formatPkr(item.lineTotal)}`;
    })
    .join("\n\n");
  const notes = [
    order.deliveryInstructions
      ? `Customer notes: ${order.deliveryInstructions}`
      : "",
    order.giftMessage ? `Gift message: ${order.giftMessage}` : "",
  ].filter(Boolean);
  const paymentProofLine = order.paymentProofUrl
    ? `\nPayment receipt: ${order.paymentProofUrl}`
    : "";

  return `MESM Order Confirmation

Order number: ${order.orderNumber}
Order ID: ${order.id}
Order date/time: ${formattedDate}
Order status: ${order.orderStatus}

Customer: ${order.customerName}
Phone: ${order.customerPhone}
Delivery address: ${order.deliveryAddress}
City: ${order.customerCity}
${notes.length ? `\n${notes.join("\n")}\n` : ""}
Items:
${itemsText}

Subtotal: ${formatPkr(order.subtotal)}
Delivery charges: ${formatPkr(order.deliveryFee)}
Discount: ${formatPkr(order.discount)}
Grand total: ${formatPkr(order.total)}
Payment method: ${order.paymentMethod.toUpperCase()}
Payment status: ${order.paymentStatus.toUpperCase()}${paymentProofLine}`;
}
