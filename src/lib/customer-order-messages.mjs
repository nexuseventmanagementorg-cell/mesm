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

function buildMessage(order, templateKey, orderManageUrl = "") {
  const name = order.customerName || "there";
  const orderNumber = order.orderNumber;
  const total = formatPkr(order.total);
  const intro = "✨ *MESM Store* — Elegance, made personal 💎\n";
  const signOff = "\n\nWith love,\n*Team MESM* 💛";

  const templates = {
    order_received_thank_you:
      `${intro}Assalam-o-Alaikum ${name}! 🌸\n\nThank you for choosing MESM and placing order *#${orderNumber}*. We’ve received it and our team is carefully reviewing your order. ✨\n\nYour order total: *${total}*\nWe’ll keep you updated at every step. 💌${signOff}`,
    order_pending_1:
      `${intro}Assalam-o-Alaikum ${name}! 🌷\n\nYour order *#${orderNumber}* for *${total}* is waiting for your confirmation. Please reply *CONFIRM* if you’d like Team MESM to begin preparing your order. 💌${signOff}`,
    order_pending_2:
      `${intro}Assalam-o-Alaikum ${name}! 💛\n\nA little reminder from Team MESM: order *#${orderNumber}* (*${total}*) is still awaiting your confirmation. Reply *CONFIRM* and we’ll be delighted to prepare it for you. ✨${signOff}`,
    order_pending_3:
      `${intro}Assalam-o-Alaikum ${name}! 🌸\n\nThis is our final reminder for order *#${orderNumber}* (*${total}*), which is still awaiting confirmation. Your order has *not* been cancelled. Reply *CONFIRM* if you’d still like us to proceed. 💌${signOff}`,
    order_confirmed:
      `${intro}Wonderful news, ${name}! 🎉\n\nYour order *#${orderNumber}* is confirmed. Team MESM is getting everything ready with care, and we’ll share your next update soon. ✨\n\nOrder total: *${total}*${signOff}`,
    order_preparing:
      `${intro}Assalam-o-Alaikum ${name}! 🛠️💎\n\nYour order *#${orderNumber}* is now being prepared in the MESM studio. Each detail is coming together with care. We’ll let you know as soon as it’s ready to dispatch. 🌸\n\nOrder total: *${total}*${signOff}`,
    order_ready:
      `${intro}Exciting update, ${name}! 🎁✨\n\nYour order *#${orderNumber}* is beautifully packed and *ready to dispatch*. We’ll message you when it’s handed to the courier. 💌\n\nOrder total: *${total}*${signOff}`,
    order_shipped:
      `${intro}It’s on its way, ${name}! 🚚💨\n\nYour MESM order *#${orderNumber}* has been shipped and is with the courier. Please keep your phone available for the delivery call. We hope it brings a little extra sparkle to your day! ✨\n\nOrder total: *${total}*${signOff}`,
    order_delivered:
      `${intro}Assalam-o-Alaikum ${name}! 💝\n\nYour order *#${orderNumber}* has been marked as delivered. We hope your MESM piece makes you feel as special as you are! ✨ We’d love to hear how you like it—reply here if you need any help. 🌷\n\nOrder total: *${total}*${signOff}`,
    order_cancelled:
      `${intro}Assalam-o-Alaikum ${name},\n\nYour MESM order *#${orderNumber}* (*${total}*) has been marked as cancelled. We’re sorry this order didn’t work out. If you have any questions or think this was a mistake, simply reply and Team MESM will be happy to help. 💛${signOff}`,
    payment_cod_due:
      `${intro}Assalam-o-Alaikum ${name}! 🌸\n\nYour order *#${orderNumber}* is set to *Cash on Delivery*. Please pay *${total}* directly to the courier when your parcel arrives. 📦💵\n\nThank you for shopping with MESM! ✨${signOff}`,
    payment_unpaid_1:
      `${intro}Assalam-o-Alaikum ${name}! 💌\n\nPayment for order *#${orderNumber}* (*${total}*) is still marked as unpaid. Your selected method is *${order.paymentMethod}*. Once paid, please share your receipt here so our team can verify it. 🌷${signOff}`,
    payment_unpaid_2:
      `${intro}A friendly reminder, ${name}! 🌼\n\nPayment for MESM order *#${orderNumber}* (*${total}*) is still pending via *${order.paymentMethod}*. If you’ve already paid, please send us your receipt. Need a hand? Just reply—we’re here for you. 💛${signOff}`,
    payment_unpaid_3:
      `${intro}Assalam-o-Alaikum ${name}! 🌸\n\nThis is our final payment reminder for order *#${orderNumber}* (*${total}*). Payment is still pending. Please reply to Team MESM to let us know how you’d like to proceed. 💌${signOff}`,
    payment_paid:
      `${intro}Payment confirmed, ${name}! ✅💎\n\nWe’ve verified the payment of *${total}* for order *#${orderNumber}*. Thank you for choosing MESM—we’re taking great care of your order! 🌷${signOff}`,
    payment_refunded:
      `${intro}Assalam-o-Alaikum ${name},\n\nThe payment of *${total}* for order *#${orderNumber}* has been marked as refunded. Depending on your payment provider, it may take a little time to appear in your account. If you need help, reply here and Team MESM will assist. 💛${signOff}`,
    payment_receipt_received:
      `${intro}Assalam-o-Alaikum ${name}! 🧾💛\n\nWe’ve received your payment transaction screenshot for order *#${orderNumber}* (*${total}*). Team MESM is reviewing it now. Please don’t make the payment again; we’ll update you once verification is complete. ✨${signOff}`,
    payment_receipt_missing:
      `${intro}Assalam-o-Alaikum ${name}! 🧾🌸\n\nWe haven’t received a payment receipt for order *#${orderNumber}* (*${total}*) yet. If you’ve completed the payment, please upload your transaction screenshot securely on your MESM order page:\n${orderManageUrl || "Please contact Team MESM to request your secure order link."}\n\nIf you haven’t paid yet, please complete payment first and then upload the receipt. 💌${signOff}`,
  };

  if (templateKey === "payment_awaiting_verification") {
    return order.paymentProofUrl
      ? `${intro}Assalam-o-Alaikum ${name}! 🧾✨\n\nWe’ve received your payment details for order *#${orderNumber}* (*${total}*). Team MESM is reviewing them now. Please don’t send the payment again—we’ll update you as soon as verification is complete. 💛${signOff}`
      : `${intro}Assalam-o-Alaikum ${name}! 🧾✨\n\nPayment for order *#${orderNumber}* (*${total}*) is awaiting verification. If you’ve already paid, please share your receipt here so Team MESM can verify it. 💌${signOff}`;
  }

  return templates[templateKey] || "";
}

function makeReceivedThankYouPlan(order, now) {
  const key = "order_received_thank_you";
  const alreadySent = (order.timeline || []).some(
    (entry) =>
      entry.messageKey === key ||
      (typeof entry.messageKey === "string" && entry.messageKey.startsWith("order_pending_"))
  );
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
      ? "The order received message or a pending reminder has already been logged."
      : limitReached
        ? "The order reached the limit of 3 customer messages in 24 hours."
        : "",
  };
}

function makeStatusPlan(order, category, status, now, templateKey, label) {
  const cycleStart = latestStateTimestamp(order, status);
  const sent = currentCycleMessages(order, category, cycleStart);

  if (
    category === "payment_status" &&
    order.orderStatus === "cancelled" &&
    status !== "refunded"
  ) {
    return {
      category,
      cycleStart,
      key: templateKey,
      label,
      message: buildMessage(order, templateKey),
      dueAt: null,
      canSend: false,
      reason: "Cancelled orders do not receive payment reminders; use the refund update when applicable.",
    };
  }

  const duplicate = sent.some((entry) => entry.messageKey === templateKey);
  const currentStatusMatches =
    (category === "order_status" && order.orderStatus === status) ||
    (category === "payment_status" && order.paymentStatus === status);
  const messagesSentInWindow = recentMessageCount(order, now);
  const limitReached = messagesSentInWindow >= MAX_CUSTOMER_MESSAGES_PER_24_HOURS;
  const canSend =
    currentStatusMatches &&
    !duplicate &&
    !limitReached;

  let reason = "";
  if (!currentStatusMatches) reason = "This template is not for the order's current status.";
  else if (duplicate) reason = "This message has already been logged for the current status.";
  else if (limitReached) reason = "The order reached the limit of 3 customer messages in 24 hours.";

  return {
    category,
    cycleStart,
    key: templateKey,
    label,
    message: buildMessage(order, templateKey),
    dueAt: cycleStart,
    canSend,
    reason,
  };
}

function makeSequencePlans(order, category, status, now, sequence, intervalMs) {
  const cycleStart = latestStateTimestamp(order, status);
  const sent = currentCycleMessages(order, category, cycleStart);
  const isPendingOrder = category === "order_status" && status === "pending";
  const thankYou = isPendingOrder
    ? (order.timeline || []).find(
        (entry) =>
          entry.messageKey === "order_received_thank_you" &&
          entry.messageCycleStart === cycleStart &&
          Number.isFinite(Date.parse(entry.timestamp))
      )
    : undefined;
  const completedSlots = sent.length + (thankYou ? 1 : 0);
  return sequence.map(([templateKey, label], index) => {
    const alreadySent = sent.some((entry) => entry.messageKey === templateKey);
    const previousKey = index > 0 ? sequence[index - 1][0] : "";
    const previousStep = index === 1 && thankYou
      ? thankYou
      : sent.find((entry) => entry.messageKey === previousKey);
    const dueAt = index === 0
      ? Date.parse(cycleStart)
      : previousStep
        ? Date.parse(previousStep.timestamp) + intervalMs
        : null;
    const currentStatusMatches =
      (category === "order_status" && order.orderStatus === status) ||
      (category === "payment_status" && order.paymentStatus === status);
    const limitReached = recentMessageCount(order, now) >= MAX_CUSTOMER_MESSAGES_PER_24_HOURS;
    const isNext = index === completedSlots;
    const canSend =
      currentStatusMatches &&
      isNext &&
      !alreadySent &&
      dueAt !== null &&
      dueAt <= now &&
      !limitReached;

    let reason = "";
    if (!currentStatusMatches) reason = `Available when the order is ${ORDER_STATUS_LABELS[status] || PAYMENT_STATUS_LABELS[status]}.`;
    else if (alreadySent || index < completedSlots) reason = "This reminder has already been sent or replaced by the order-received thank-you message.";
    else if (index > completedSlots) reason = "Send the earlier reminder first.";
    else if (dueAt !== null && dueAt > now) reason = `Next reminder is due ${new Date(dueAt).toLocaleString("en-PK")}.`;
    else if (limitReached) reason = "The order reached the limit of 3 customer messages in 24 hours.";

    return {
      category,
      cycleStart,
      key: templateKey,
      label,
      message: buildMessage(order, templateKey),
      dueAt: dueAt !== null && Number.isFinite(dueAt) ? new Date(dueAt).toISOString() : null,
      canSend,
      reason,
    };
  });
}

export function getCustomerMessageOptions(
  order,
  now = Date.now(),
  orderManageUrl = ""
) {
  const orderPlans = Object.entries(ORDER_STATUS_LABELS).flatMap(([status, statusLabel]) => {
    if (status === "pending") {
      return makeSequencePlans(
        order,
        "order_status",
        status,
        now,
        [
          ["order_pending_1", "Confirmation reminder — 1 of 3"],
          ["order_pending_2", "Confirmation reminder — 2 of 3"],
          ["order_pending_3", "Final confirmation reminder — 3 of 3"],
        ],
        8 * HOUR_MS
      );
    }

    return [
      makeStatusPlan(
        order,
        "order_status",
        status,
        now,
        `order_${status}`,
        `Order update — ${statusLabel}`
      ),
    ];
  });
  const paymentPlans = Object.entries(PAYMENT_STATUS_LABELS).flatMap(([status, statusLabel]) => {
    if (status === "unpaid" && order.paymentMethod === "cod") {
      return [
        makeStatusPlan(
          order,
          "payment_status",
          status,
          now,
          "payment_cod_due",
          "Cash-on-delivery instructions"
        ),
      ];
    }

    if (status === "unpaid") {
      return makeSequencePlans(
        order,
        "payment_status",
        status,
        now,
        [
          ["payment_unpaid_1", "Payment reminder — 1 of 3"],
          ["payment_unpaid_2", "Payment reminder — 2 of 3"],
          ["payment_unpaid_3", "Final payment reminder — 3 of 3"],
        ],
        DAY_MS
      );
    }

    return [
      makeStatusPlan(
        order,
        "payment_status",
        status,
        now,
        `payment_${status}`,
        `Payment update — ${statusLabel}`
      ),
    ];
  });
  const canSendReceiptMessage =
    order.paymentMethod !== "cod" &&
    order.orderStatus !== "cancelled" &&
    ["unpaid", "awaiting_verification"].includes(order.paymentStatus);
  const receiptMessagePlan = (hasReceipt) => {
    const key = hasReceipt
      ? "payment_receipt_received"
      : "payment_receipt_missing";
    const cycleStart = latestStateTimestamp(order, order.paymentStatus);
    const alreadySent = (order.timeline || []).some(
      (entry) => entry.messageKey === key && entry.messageCycleStart === cycleStart
    );
    const limitReached =
      recentMessageCount(order, now) >= MAX_CUSTOMER_MESSAGES_PER_24_HOURS;
    const canSend =
      canSendReceiptMessage &&
      Boolean(order.paymentProofUrl) === hasReceipt &&
      !alreadySent &&
      !limitReached;

    return {
      category: "payment_receipt",
      cycleStart,
      key,
      label: hasReceipt
        ? "Payment receipt received — verification update"
        : "Payment receipt not received — request upload",
      message: buildMessage(order, key, orderManageUrl),
      dueAt: cycleStart,
      canSend,
      reason: !canSendReceiptMessage
        ? order.paymentMethod === "cod"
          ? "Receipt reminders do not apply to Cash on Delivery."
          : "Receipt messages are unavailable for cancelled, paid, or refunded orders."
        : Boolean(order.paymentProofUrl) !== hasReceipt
          ? hasReceipt
            ? "No receipt has been uploaded for this order."
            : "A receipt is already attached to this order."
          : alreadySent
            ? "This receipt message has already been logged for this payment status."
            : limitReached
              ? "The order reached the limit of 3 customer messages in 24 hours."
              : "",
    };
  };

  return [
    makeReceivedThankYouPlan(order, now),
    ...orderPlans,
    ...paymentPlans,
    receiptMessagePlan(true),
    receiptMessagePlan(false),
  ];
}

export function buildCustomerMessage(order, templateKey, orderManageUrl = "") {
  return buildMessage(order, templateKey, orderManageUrl);
}
