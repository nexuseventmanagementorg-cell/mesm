const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
export const MAX_CUSTOMER_MESSAGES_PER_24_HOURS = 3;

const ORDER_STATUS_LABELS = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  preparing: "Being prepared in our studio",
  ready: "Ready to dispatch",
  shipped: "Shipped and out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  awaiting_verification: "Awaiting verification",
  paid: "Paid and verified",
  refunded: "Refunded",
};

function formatPkr(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)}`;
}

function latestStateTimestamp(order, status) {
  const event = [...(order.timeline || [])]
    .reverse()
    .find((entry) => entry.status === status && !entry.messageKey);
  const timestamp = event?.timestamp || order.createdAt;
  const time = Date.parse(timestamp);
  return Number.isFinite(time) ? new Date(time).toISOString() : order.createdAt;
}

function currentCycleMessages(order, category, cycleStart) {
  return (order.timeline || [])
    .filter(
      (entry) =>
        entry.messageCategory === category &&
        entry.messageCycleStart === cycleStart &&
        typeof entry.messageKey === "string" &&
        Number.isFinite(Date.parse(entry.timestamp))
    )
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function recentMessageCount(order, now) {
  return (order.timeline || []).filter((entry) => {
    if (!entry.messageKey) return false;
    const sentAt = Date.parse(entry.timestamp);
    return Number.isFinite(sentAt) && sentAt > now - DAY_MS && sentAt <= now;
  }).length;
}

function buildMessage(order, templateKey) {
  const name = order.customerName || "there";
  const orderNumber = order.orderNumber;
  const total = formatPkr(order.total);

  const templates = {
    order_received_thank_you:
      `Assalam-o-Alaikum ${name}, thank you for placing order #${orderNumber} with MESM Store. ` +
      `We have received your order and our team is reviewing it. We will update you shortly. Total: ${total}.`,
    order_pending_1:
      `Assalam-o-Alaikum ${name}, we received your MESM order #${orderNumber} (${total}). ` +
      "Please reply to this message to confirm you would like us to process it.",
    order_pending_2:
      `Assalam-o-Alaikum ${name}, a quick reminder about your pending MESM order #${orderNumber} (${total}). ` +
      "Please reply if you would like us to proceed.",
    order_pending_3:
      `Assalam-o-Alaikum ${name}, this is our last reminder about MESM order #${orderNumber} (${total}), ` +
      "which is still pending confirmation. Please reply if you would like to continue; your order has not been cancelled.",
    order_confirmed:
      `Assalam-o-Alaikum ${name}, your MESM order #${orderNumber} is confirmed. ` +
      `We will keep you updated as it moves through preparation. Total: ${total}.`,
    order_preparing:
      `Assalam-o-Alaikum ${name}, your MESM order #${orderNumber} is being prepared in our studio. ` +
      `We will message you when it is ready. Total: ${total}.`,
    order_ready:
      `Assalam-o-Alaikum ${name}, your MESM order #${orderNumber} is packed and ready for dispatch. ` +
      `We will share an update when it is handed to the courier. Total: ${total}.`,
    order_shipped:
      `Assalam-o-Alaikum ${name}, your MESM order #${orderNumber} has been shipped and is out for delivery. ` +
      `Please keep your contact phone available. Total: ${total}.`,
    order_delivered:
      `Assalam-o-Alaikum ${name}, your MESM order #${orderNumber} has been marked as delivered. ` +
      `We hope you love it. Order total: ${total}. Please reply if you need any help.`,
    order_cancelled:
      `Assalam-o-Alaikum ${name}, MESM order #${orderNumber} (${total}) has been cancelled. ` +
      "Please contact us if you have questions or believe this was a mistake.",
    payment_cod_due:
      `Assalam-o-Alaikum ${name}, order #${orderNumber} is set to Cash on Delivery. ` +
      `Please pay ${total} to the courier when your parcel arrives.`,
    payment_unpaid_1:
      `Assalam-o-Alaikum ${name}, payment for MESM order #${orderNumber} (${total}) is still marked unpaid. ` +
      `Selected method: ${order.paymentMethod}. Please complete payment and share the receipt with us.`,
    payment_unpaid_2:
      `Assalam-o-Alaikum ${name}, this is a reminder that payment for MESM order #${orderNumber} (${total}) ` +
      `is still pending. Selected method: ${order.paymentMethod}. Please contact us if you need help.`,
    payment_unpaid_3:
      `Assalam-o-Alaikum ${name}, our final payment reminder for MESM order #${orderNumber} (${total}). ` +
      "Payment is still pending; please contact us to confirm how you would like to proceed.",
    payment_paid:
      `Assalam-o-Alaikum ${name}, payment for MESM order #${orderNumber} (${total}) has been verified. Thank you!`,
    payment_refunded:
      `Assalam-o-Alaikum ${name}, the payment for MESM order #${orderNumber} (${total}) is marked as refunded. ` +
      "Please contact us if you need help with the refund.",
  };

  if (templateKey === "payment_awaiting_verification") {
    return order.paymentProofUrl
      ? `Assalam-o-Alaikum ${name}, we have received the payment details for MESM order #${orderNumber}. ` +
          "Our team is verifying them. Please do not send the payment again; we will update you shortly."
      : `Assalam-o-Alaikum ${name}, payment for MESM order #${orderNumber} (${total}) is awaiting verification. ` +
          "If you have already paid, please share your receipt so our team can verify it.";
  }

  return templates[templateKey] || "";
}

function makeReceivedThankYouPlan(order, now) {
  const key = "order_received_thank_you";
  const alreadySent = (order.timeline || []).some((entry) => entry.messageKey === key);
  const limitReached = recentMessageCount(order, now) >= MAX_CUSTOMER_MESSAGES_PER_24_HOURS;
  const cycleStart = latestStateTimestamp(order, "pending");

  return {
    category: "order_received",
    cycleStart,
    key,
    label: "Order received — thank-you message",
    message: buildMessage(order, key),
    dueAt: cycleStart,
    canSend: !alreadySent && !limitReached,
    reason: alreadySent
      ? "The order received thank-you message has already been logged."
      : limitReached
        ? "The order reached the limit of 3 customer messages in 24 hours."
        : "",
  };
}

function makePlan(order, category, status, now) {
  const cycleStart = latestStateTimestamp(order, status);
  const sent = currentCycleMessages(order, category, cycleStart);
  const receivedThankYou = category === "order_status" && status === "pending"
    ? (order.timeline || []).find(
        (entry) =>
          entry.messageKey === "order_received_thank_you" &&
          entry.messageCycleStart === cycleStart &&
          Number.isFinite(Date.parse(entry.timestamp))
      )
    : undefined;
  let templateKey;
  let label;
  let intervalMs = 0;
  let maxInCycle = 1;
  let lastSentAt = sent.length
    ? Date.parse(sent[sent.length - 1].timestamp)
    : null;

  if (
    category === "payment_status" &&
    order.orderStatus === "cancelled" &&
    status !== "refunded"
  ) {
    return {
      category,
      cycleStart,
      key: "",
      label: "No payment reminder for a cancelled order",
      message: "",
      dueAt: null,
      canSend: false,
      reason: "Cancelled orders do not receive payment reminders; use the refund update when applicable.",
    };
  }

  if (category === "order_status" && status === "pending") {
    const sequence = [
      ["order_pending_1", "Order received — message 1 of 3", 0],
      ["order_pending_2", "Pending confirmation reminder — message 2 of 3", 8 * HOUR_MS],
      ["order_pending_3", "Final pending confirmation reminder — message 3 of 3", 8 * HOUR_MS],
    ];
    maxInCycle = sequence.length;
    const thankYouReplacesFirstReminder = sent.length === 0 && Boolean(receivedThankYou);
    const step = sequence[sent.length + (thankYouReplacesFirstReminder ? 1 : 0)];
    if (thankYouReplacesFirstReminder) {
      lastSentAt = Date.parse(receivedThankYou.timestamp);
    }
    if (step) [templateKey, label, intervalMs] = step;
  } else if (category === "payment_status" && status === "unpaid") {
    if (order.paymentMethod === "cod") {
      templateKey = "payment_cod_due";
      label = "Cash-on-delivery instructions";
    } else {
      const sequence = [
        ["payment_unpaid_1", "Payment reminder — message 1 of 3", 0],
        ["payment_unpaid_2", "Payment reminder — message 2 of 3", DAY_MS],
        ["payment_unpaid_3", "Final payment reminder — message 3 of 3", DAY_MS],
      ];
      maxInCycle = sequence.length;
      const step = sequence[sent.length];
      if (step) [templateKey, label, intervalMs] = step;
    }
  } else {
    const keyByStatus = {
      confirmed: "order_confirmed",
      preparing: "order_preparing",
      ready: "order_ready",
      shipped: "order_shipped",
      delivered: "order_delivered",
      cancelled: "order_cancelled",
      awaiting_verification: "payment_awaiting_verification",
      paid: "payment_paid",
      refunded: "payment_refunded",
    };
    templateKey = keyByStatus[status];
    label = `${category === "order_status" ? "Order" : "Payment"} update — ${
      (category === "order_status" ? ORDER_STATUS_LABELS : PAYMENT_STATUS_LABELS)[status]
    }`;
  }

  if (!templateKey) {
    return {
      category,
      cycleStart,
      key: "",
      label: "No further message scheduled",
      message: "",
      dueAt: null,
      canSend: false,
      reason:
        category === "order_status"
          ? "The reminder limit for this status has been reached."
          : "No additional payment reminder is scheduled for this status.",
    };
  }

  const duplicate = sent.some((entry) => entry.messageKey === templateKey);
  const dueAt = lastSentAt === null
    ? now
    : lastSentAt + intervalMs;
  const currentStatusMatches =
    (category === "order_status" && order.orderStatus === status) ||
    (category === "payment_status" && order.paymentStatus === status);
  const messagesSentInWindow = recentMessageCount(order, now);
  const limitReached = messagesSentInWindow >= MAX_CUSTOMER_MESSAGES_PER_24_HOURS;
  const canSend =
    currentStatusMatches &&
    !duplicate &&
    sent.length < maxInCycle &&
    dueAt <= now &&
    !limitReached;

  let reason = "";
  if (!currentStatusMatches) reason = "This template is not for the order's current status.";
  else if (duplicate) reason = "This message has already been logged for the current status.";
  else if (sent.length >= maxInCycle) reason = "The reminder limit for this status has been reached.";
  else if (dueAt > now) reason = `Next reminder is due ${new Date(dueAt).toLocaleString("en-PK")}.`;
  else if (limitReached) reason = "The order reached the limit of 3 customer messages in 24 hours.";

  return {
    category,
    cycleStart,
    key: templateKey,
    label,
    message: buildMessage(order, templateKey),
    dueAt: new Date(dueAt).toISOString(),
    canSend,
    reason,
  };
}

export function getCustomerMessageOptions(order, now = Date.now()) {
  return [
    makeReceivedThankYouPlan(order, now),
    makePlan(order, "order_status", order.orderStatus, now),
    makePlan(order, "payment_status", order.paymentStatus, now),
  ];
}

export function buildCustomerMessage(order, templateKey) {
  return buildMessage(order, templateKey);
}
