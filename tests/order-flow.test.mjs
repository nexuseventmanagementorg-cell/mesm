import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getCustomerOrderConfirmation,
  hashCustomerOrderAccessToken,
  persistCustomerAccessHashInTimeline,
  recoverCustomerAccessHashFromTimeline,
} from "../src/lib/customer-order-access.mjs";
import { checkoutOrderSchema } from "../src/lib/order-checkout-validation.mjs";
import { isPersistedOrderResponse } from "../src/lib/order-rpc-response.mjs";
import { generateWhatsAppOrderMessage } from "../src/lib/whatsapp-order-message.mjs";
import {
  getCustomerMessageOptions,
  MAX_CUSTOMER_MESSAGES_PER_24_HOURS,
} from "../src/lib/customer-order-messages.mjs";

const readSource = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("Checkout schema accepts valid customer and item details but rejects client prices", () => {
  const validOrder = {
    customerName: "Sana Tariq",
    customerPhone: "03001234567",
    customerCity: "Lahore",
    deliveryAddress: "House 12, Phase 6 DHA",
    items: [{ productId: "product-1", quantity: 2 }],
    paymentMethod: "cod",
  };

  assert.equal(checkoutOrderSchema.safeParse(validOrder).success, true);
  assert.equal(
    checkoutOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: "product-1", quantity: 2, unitPrice: 1 }],
    }).success,
    false
  );
  assert.equal(
    checkoutOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: "product-1", quantity: 0 }],
    }).success,
    false
  );
});

test("WhatsApp order summary includes persisted order, customer, item, and payment details", () => {
  const message = generateWhatsAppOrderMessage({
    id: "ord-123",
    orderNumber: "MG-9102",
    createdAt: "2026-11-01T10:00:00.000Z",
    orderStatus: "pending",
    customerName: "Sana Tariq",
    customerPhone: "03001234567",
    customerCity: "Lahore",
    deliveryAddress: "House 12, Phase 6 DHA",
    deliveryInstructions: "Call on arrival",
    giftMessage: "Happy birthday",
    items: [
      {
        productName: "Botanical Pendant",
        sku: "MESM-104",
        variationText: "Chain: 18 inches",
        quantity: 2,
        unitPrice: 1850,
        lineTotal: 3700,
      },
      {
        productName: "Pearl Earrings",
        quantity: 1,
        unitPrice: 900,
        lineTotal: 900,
      },
    ],
    subtotal: 4600,
    deliveryFee: 250,
    discount: 100,
    total: 4750,
    paymentMethod: "easypaisa",
    paymentStatus: "awaiting_verification",
  });

  for (const detail of [
    "MG-9102",
    "ord-123",
    "Sana Tariq",
    "03001234567",
    "House 12, Phase 6 DHA",
    "Lahore",
    "Botanical Pendant",
    "MESM-104",
    "Variation: Chain: 18 inches",
    "Quantity: 2",
    "Unit price: PKR 1,850.00",
    "Item subtotal: PKR 3,700.00",
    "Pearl Earrings",
    "Delivery charges: PKR 250.00",
    "Discount: PKR 100.00",
    "Grand total: PKR 4,750.00",
    "EASYPAISA",
    "AWAITING_VERIFICATION",
    "Call on arrival",
    "Happy birthday",
  ]) {
    assert.ok(message.includes(detail), `Expected WhatsApp message to contain ${detail}`);
  }
});

test("Order creation matches the four-argument RPC and excludes unsupported SKU keys", () => {
  const database = readSource("../src/lib/db.ts");
  const createdItems = database.match(
    /const validatedItems: OrderItem\[\] = orderInput\.items\.map\([\s\S]*?\n    \}\);/
  );
  assert.ok(createdItems, "expected server-validated order item snapshots");
  for (const key of [
    "id",
    "productId",
    "productName",
    "productSlug",
    "productImage",
    "variationText",
    "quantity",
    "unitPrice",
    "lineTotal",
  ]) {
    assert.match(
      createdItems[0],
      key === "lineTotal"
        ? /\blineTotal(?:,|\s*})/
        : new RegExp(`\\b${key}:`)
    );
  }
  assert.doesNotMatch(createdItems[0], /\bsku\s*:/);

  assert.match(database, /rpc\("create_order_with_inventory"/);
  assert.match(database, /p_order:\s*mapOrderToRow\(newOrder\)/);
  assert.match(database, /p_idempotency_key:\s*orderInput\.idempotencyKey/);
  assert.match(database, /p_request_fingerprint:\s*orderInput\.requestFingerprint/);
  assert.match(database, /expected_price:\s*product\.price/);
  assert.match(database, /!isPersistedOrderResponse\(data\)/);
});

test("RPC response validation accepts a complete persisted row and rejects incomplete or SKU-contaminated data", () => {
  const persistedOrder = {
    id: "ord-existing",
    order_number: "MG-9102",
    customer_name: "Sana Tariq",
    customer_phone: "03001234567",
    customer_city: "Lahore",
    delivery_address: "House 12",
    created_at: "2026-11-01T10:00:00.000Z",
    order_status: "pending",
    payment_status: "unpaid",
    payment_method: "cod",
    subtotal: 1200,
    delivery_fee: 250,
    discount: 0,
    total: 1450,
    items: [
      {
        id: "item-1",
        productId: "product-1",
        productName: "Pendant",
        productSlug: "pendant",
        productImage: "/pendant.png",
        quantity: 1,
        unitPrice: 1200,
        lineTotal: 1200,
      },
    ],
  };

  assert.equal(isPersistedOrderResponse(persistedOrder), true);
  assert.equal(
    isPersistedOrderResponse({
      ...persistedOrder,
      id: undefined,
    }),
    false
  );
  assert.equal(
    isPersistedOrderResponse({
      ...persistedOrder,
      items: [{ ...persistedOrder.items[0], sku: "unsupported" }],
    }),
    false
  );
});

test("Checkout reuses an idempotency key and only completes after receiving an order reference", () => {
  const checkout = readSource("../src/app/checkout/page.tsx");
  const api = readSource("../src/app/api/orders/route.ts");
  const database = readSource("../src/lib/db.ts");

  assert.match(checkout, /localStorage\.setItem\(/);
  assert.match(checkout, /"Idempotency-Key": idempotencyKey/);
  assert.match(checkout, /clearCheckoutIdempotencyKey\(idempotencyKey\)/);
  assert.match(api, /IDEMPOTENCY_KEY_PATTERN/);
  assert.match(api, /status: 409/);
  assert.match(database, /getOrderByIdempotencyKey\(/);
  assert.match(database, /p_idempotency_key:\s*orderInput\.idempotencyKey/);

  const persistedOrder = api.indexOf("await createOrder({");
  const messageCreation = api.indexOf("generateWhatsAppOrderMessage(order)");
  assert.ok(persistedOrder >= 0 && persistedOrder < messageCreation);
  assert.match(checkout, /typeof data\.order\?\.orderNumber !== "string"/);
});

test("Customer confirmation requires a token and maps only persisted order data", () => {
  const now = Date.UTC(2026, 10, 1);
  const expiresAt = Math.floor(now / 1000) + 60 * 60;
  const token = `${"A".repeat(43)}.${expiresAt}`;
  const tokenHash = hashCustomerOrderAccessToken(token);
  const timeline = [
    { id: "event-1", title: "Order placed", timestamp: "2026-11-01T00:00:00.000Z" },
  ];
  const storedTimeline = persistCustomerAccessHashInTimeline(timeline, tokenHash);
  const recovered = recoverCustomerAccessHashFromTimeline(storedTimeline);
  const order = {
    id: "ord-1",
    orderNumber: "MG-1",
    customerAccessTokenHash: recovered.tokenHash,
    customerName: "Sana",
    customerPhone: "03001234567",
    customerCity: "Lahore",
    deliveryAddress: "House 12",
    createdAt: "2026-11-01T00:00:00.000Z",
    orderStatus: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "cod",
    items: [
      {
        productName: "Pendant",
        productImage: "/pendant.png",
        quantity: 1,
        unitPrice: 1200,
        lineTotal: 1200,
      },
    ],
    subtotal: 1200,
    deliveryFee: 250,
    discount: 0,
    total: 1450,
    timeline: recovered.timeline,
  };

  assert.equal(getCustomerOrderConfirmation(order, "MG-1", token, now).id, "ord-1");
  assert.equal(getCustomerOrderConfirmation(order, "MG-1", `${token}x`, now), null);
  assert.equal(getCustomerOrderConfirmation(order, "MG-2", token, now), null);
  assert.equal(
    Object.hasOwn(recovered.timeline[0], "__mesm_customer_access_token_hash"),
    false
  );
});

test("Admin order list and details read persisted JSONB item snapshots privately", () => {
  const database = readSource("../src/lib/db.ts");
  const listPage = readSource("../src/app/admin/orders/page.tsx");
  const detailPage = readSource("../src/app/admin/orders/[id]/page.tsx");

  assert.match(database, /\.from\("orders"\)\.select\("\*"\)/);
  assert.match(database, /items: Array\.isArray\(row\.items\).*row\.items as OrderItem\[\]/);
  assert.match(listPage, /await verifyAdminAuth\(\)/);
  assert.match(listPage, /getOrders\(/);
  assert.match(listPage, /ord\.items\.map\(\(i\) => i\.productName\)/);
  assert.match(detailPage, /await verifyAdminAuth\(\)/);
  assert.match(detailPage, /getOrderById\(params\.id\)/);
  assert.match(detailPage, /order\.items\.map/);
  assert.match(detailPage, /item\.productImage/);
  assert.match(detailPage, /item\.sku/);
  assert.match(detailPage, /order\.discount/);
  assert.match(detailPage, /order\.deliveryAddress/);
  assert.match(detailPage, /order\.paymentStatus/);
});

test("Customer message templates cover every order and payment status", () => {
  const statuses = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const paymentStatuses = ["unpaid", "awaiting_verification", "paid", "refunded"];
  const baseTime = Date.parse("2026-11-02T00:00:00.000Z");

  for (const orderStatus of statuses) {
    const order = {
      id: "ord-1",
      orderNumber: "MG-1",
      customerName: "MESM Test",
      customerPhone: "03001234567",
      orderStatus,
      paymentStatus: "paid",
      paymentMethod: "bank_transfer",
      createdAt: new Date(baseTime).toISOString(),
      total: 1450,
      timeline: [
        {
          id: "status",
          status: orderStatus,
          timestamp: new Date(baseTime).toISOString(),
        },
      ],
      items: [],
    };
    const plan = getCustomerMessageOptions(order, baseTime).find(
      (option) => option.category === "order_status" && option.key !== "order_received_thank_you"
    );
    assert.ok(plan?.message, `Expected an order template for ${orderStatus}`);
    assert.ok(plan.message.includes("MG-1"));
    assert.ok(plan.message.includes("PKR 1,450"));
    assert.equal(plan.canSend, true);
  }

  for (const paymentStatus of paymentStatuses) {
    const order = {
      id: "ord-1",
      orderNumber: "MG-1",
      customerName: "MESM Test",
      customerPhone: "03001234567",
      orderStatus: "confirmed",
      paymentStatus,
      paymentMethod: "bank_transfer",
      createdAt: new Date(baseTime).toISOString(),
      total: 1450,
      timeline: [
        {
          id: "payment",
          status: paymentStatus,
          timestamp: new Date(baseTime).toISOString(),
        },
      ],
      items: [],
    };
    const plan = getCustomerMessageOptions(order, baseTime).find(
      (option) => option.category === "payment_status"
    );
    assert.ok(plan?.message, `Expected a payment template for ${paymentStatus}`);
    assert.ok(plan.message.includes("MG-1"));
    assert.equal(plan.canSend, true);
  }
});

test("Pending order messages are capped at three and spaced across 24 hours", () => {
  const start = Date.parse("2026-11-02T00:00:00.000Z");
  const order = {
    orderNumber: "MG-1",
    customerName: "MESM Test",
    customerPhone: "03001234567",
    orderStatus: "pending",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    createdAt: new Date(start).toISOString(),
    total: 1000,
    timeline: [{ status: "pending", timestamp: new Date(start).toISOString() }],
  };
  const appendSent = (plan, sentAt) => {
    order.timeline.push({
      status: order.orderStatus,
      timestamp: new Date(sentAt).toISOString(),
      messageKey: plan.key,
      messageCategory: plan.category,
      messageCycleStart: plan.cycleStart,
    });
  };

  assert.equal(MAX_CUSTOMER_MESSAGES_PER_24_HOURS, 3);
  let plan = getCustomerMessageOptions(order, start).find(
    (option) => option.key === "order_pending_1"
  );
  assert.equal(plan.key, "order_pending_1");
  assert.equal(plan.canSend, true);
  appendSent(plan, start);

  plan = getCustomerMessageOptions(order, start + 7 * 60 * 60 * 1000).find(
    (option) => option.key === "order_pending_2"
  );
  assert.equal(plan.key, "order_pending_2");
  assert.equal(plan.canSend, false);
  plan = getCustomerMessageOptions(order, start + 8 * 60 * 60 * 1000).find(
    (option) => option.key === "order_pending_2"
  );
  assert.equal(plan.canSend, true);
  appendSent(plan, start + 8 * 60 * 60 * 1000);

  plan = getCustomerMessageOptions(order, start + 16 * 60 * 60 * 1000).find(
    (option) => option.key === "order_pending_3"
  );
  assert.equal(plan.key, "order_pending_3");
  assert.equal(plan.canSend, true);
  appendSent(plan, start + 16 * 60 * 60 * 1000);

  plan = getCustomerMessageOptions(order, start + 24 * 60 * 60 * 1000).find(
    (option) => option.category === "order_status"
  );
  assert.equal(plan.canSend, false);
  assert.match(plan.reason, /limit/i);
});

test("Payment reminders stop for COD and are spaced for non-COD unpaid orders", () => {
  const start = Date.parse("2026-11-02T00:00:00.000Z");
  const order = {
    orderNumber: "MG-1",
    customerName: "MESM Test",
    customerPhone: "03001234567",
    orderStatus: "confirmed",
    paymentStatus: "unpaid",
    paymentMethod: "bank_transfer",
    createdAt: new Date(start).toISOString(),
    total: 1000,
    timeline: [{ status: "unpaid", timestamp: new Date(start).toISOString() }],
  };
  const getPaymentPlan = (at) =>
    getCustomerMessageOptions(order, at).find(
      (option) => option.category === "payment_status"
    );
  const appendSent = (plan, sentAt) => {
    order.timeline.push({
      status: order.paymentStatus,
      timestamp: new Date(sentAt).toISOString(),
      messageKey: plan.key,
      messageCategory: plan.category,
      messageCycleStart: plan.cycleStart,
    });
  };

  let plan = getPaymentPlan(start);
  assert.equal(plan.key, "payment_unpaid_1");
  assert.equal(plan.canSend, true);
  appendSent(plan, start);
  plan = getPaymentPlan(start + 24 * 60 * 60 * 1000);
  assert.equal(plan.key, "payment_unpaid_2");
  assert.equal(plan.canSend, true);

  order.paymentMethod = "cod";
  order.timeline = [{ status: "unpaid", timestamp: new Date(start).toISOString() }];
  plan = getPaymentPlan(start);
  assert.equal(plan.key, "payment_cod_due");
  assert.equal(plan.canSend, true);
  assert.match(plan.message, /Cash on Delivery/);

  order.orderStatus = "cancelled";
  plan = getPaymentPlan(start);
  assert.equal(plan.canSend, false);
  assert.match(plan.reason, /cancelled/i);
});

test("Admin customer-message actions use the saved customer phone and require admin auth", () => {
  const detailPage = readSource("../src/app/admin/orders/[id]/page.tsx");
  const messagePanel = readSource("../src/components/admin/AdminCustomerOrderMessages.tsx");
  const messageRoute = readSource("../src/app/api/orders/[id]/messages/route.ts");
  const database = readSource("../src/lib/db.ts");

  assert.match(detailPage, /customerPhone=\{order\.customerPhone\}/);
  assert.match(detailPage, /getCustomerMessageOptions\(order\)/);
  assert.match(messagePanel, /toWhatsAppPhone\(customerPhone\)/);
  assert.match(messagePanel, /I sent this message/);
  assert.match(messagePanel, /router\.refresh\(\)/);
  assert.match(messageRoute, /verifyAdminAuth\(\)/);
  assert.match(messageRoute, /recordCustomerMessageSent/);
  assert.match(database, /messageCycleStart: plan\.cycleStart/);
  assert.match(database, /\.eq\("updated_at", order\.updatedAt\)/);
});

test("Newly received orders preselect a one-time thank-you message that logs only once", () => {
  const now = Date.parse("2026-11-02T00:00:00.000Z");
  const order = {
    orderNumber: "MG-THANKS-1",
    customerName: "MESM Test",
    customerPhone: "03001234567",
    orderStatus: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "bank_transfer",
    createdAt: new Date(now).toISOString(),
    total: 1450,
    timeline: [{ status: "pending", timestamp: new Date(now).toISOString() }],
  };

  let options = getCustomerMessageOptions(order, now);
  let thankYou = options[0];
  assert.equal(thankYou.key, "order_received_thank_you");
  assert.equal(thankYou.category, "order_received");
  assert.equal(thankYou.canSend, true);
  assert.match(thankYou.label, /thank-you/i);
  assert.match(thankYou.message, /thank you for placing order #MG-THANKS-1 with MESM Store/i);
  assert.match(thankYou.message, /PKR 1,450/);

  order.timeline.push({
    status: "pending",
    timestamp: new Date(now).toISOString(),
    messageKey: thankYou.key,
    messageCategory: thankYou.category,
    messageCycleStart: thankYou.cycleStart,
  });
  options = getCustomerMessageOptions(order, now);
  const pendingReminder = options.find((option) => option.key === "order_pending_2");
  assert.equal(pendingReminder.canSend, false);
  assert.equal(pendingReminder.dueAt, new Date(now + 8 * 60 * 60 * 1000).toISOString());

  options = getCustomerMessageOptions(order, now + 60_000);
  thankYou = options[0];
  assert.equal(thankYou.canSend, false);
  assert.match(thankYou.reason, /already been logged/i);
});
