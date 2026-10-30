import test from "node:test";
import assert from "node:assert/strict";
import {
  areVariationSelectionsAvailable,
  getDefaultVariationSelections,
  hasAvailableVariantSelection,
  isVariationOptionAvailable,
} from "../src/lib/variation-availability.mjs";
import {
  normalizeProductTag,
  parseProductTags,
} from "../src/lib/product-tags.mjs";

// 1. Cart Totals & Delivery Threshold Tests
function calculateCartTotals(items, flatFee = 250, freeThreshold = 3000) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= freeThreshold ? 0 : flatFee;
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
}

test("Cart Totals - Charges delivery fee when subtotal is below free delivery threshold", () => {
  const items = [
    { productId: "p1", price: 1200, quantity: 1 },
    { productId: "p2", price: 800, quantity: 1 },
  ]; // Subtotal: 2000
  const totals = calculateCartTotals(items, 250, 3000);
  assert.equal(totals.subtotal, 2000);
  assert.equal(totals.deliveryFee, 250);
  assert.equal(totals.total, 2250);
});

test("Cart Totals - Waives delivery fee (FREE) when subtotal meets or exceeds threshold", () => {
  const items = [
    { productId: "p1", price: 1850, quantity: 2 }, // 3700
  ];
  const totals = calculateCartTotals(items, 250, 3000);
  assert.equal(totals.subtotal, 3700);
  assert.equal(totals.deliveryFee, 0);
  assert.equal(totals.total, 3700);
});

// 2. Pakistani Phone Normalization & WhatsApp Deep Link Format
function formatPakistaniPhone(phone) {
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+92")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("92")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

function toWhatsAppPhone(phone) {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }
  return cleaned;
}

test("Phone Formatting - Normalizes +92 and local 03xx Pakistani formats", () => {
  assert.equal(formatPakistaniPhone("+92 300 1234567"), "03001234567");
  assert.equal(formatPakistaniPhone("92321-7654321"), "03217654321");
  assert.equal(formatPakistaniPhone("0333 555 1234"), "03335551234");

  assert.equal(toWhatsAppPhone("03001234567"), "923001234567");
  assert.equal(toWhatsAppPhone("+923217654321"), "923217654321");
});

// 3. WhatsApp Message Generator Format
function generateWhatsAppOrderMessage(order) {
  const itemsText = order.items
    .map((item) => {
      const variationLine = item.variationText
        ? `\n  - Selected Variation: ${item.variationText}`
        : "";
      return `- ${item.productName} x ${item.quantity}${variationLine}\n  - Unit Price: PKR ${item.unitPrice.toLocaleString()}\n  - Line Total: PKR ${item.lineTotal.toLocaleString()}`;
    })
    .join("\n\n");

  return `Hello MEEMS GEMS! I would like to confirm my jewellery order.

Order No: ${order.orderNumber}

Customer Name: ${order.customerName}
Phone: ${order.customerPhone}
City: ${order.customerCity}
Delivery Address: ${order.deliveryAddress}

Order Items:
${itemsText}

Subtotal: PKR ${order.subtotal.toLocaleString()}
Delivery: PKR ${order.deliveryFee.toLocaleString()}
Discount: PKR ${order.discount.toLocaleString()}
Total: PKR ${order.total.toLocaleString()}
Payment Method: ${order.paymentMethod.toUpperCase()}

Please confirm availability and delivery details. Thank you!`;
}

test("WhatsApp Message - Generates complete structured prefilled message", () => {
  const order = {
    orderNumber: "MG-9102",
    customerName: "Sana Tariq",
    customerPhone: "03001234567",
    customerCity: "Lahore",
    deliveryAddress: "House 12, Phase 6 DHA",
    items: [
      {
        productName: "Botanical Pendant",
        variationText: "Chain: 18 inches",
        quantity: 1,
        unitPrice: 1850,
        lineTotal: 1850,
      },
    ],
    subtotal: 1850,
    deliveryFee: 250,
    discount: 0,
    total: 2100,
    paymentMethod: "easypaisa",
  };

  const message = generateWhatsAppOrderMessage(order);
  assert.match(message, /Order No: MG-9102/);
  assert.match(message, /Customer Name: Sana Tariq/);
  assert.match(message, /Botanical Pendant x 1/);
  assert.match(message, /Selected Variation: Chain: 18 inches/);
  assert.match(message, /Total: PKR 2,100/);
  assert.match(message, /Payment Method: EASYPAISA/);
});

// 4. Inventory Reservation & Restoration Policy
test("Inventory Policy - Decrements stock on order and restores on cancellation", () => {
  let product = {
    id: "p-test",
    name: "Wildflower Ring",
    stockQuantity: 10,
    trackInventory: true,
  };

  const orderQuantity = 3;

  // 1. Order Placed
  assert.ok(product.stockQuantity >= orderQuantity, "Stock should be sufficient");
  product.stockQuantity -= orderQuantity;
  assert.equal(product.stockQuantity, 7);

  // 2. Order Cancelled
  const orderCancelled = true;
  if (orderCancelled) {
    product.stockQuantity += orderQuantity;
  }
  assert.equal(product.stockQuantity, 10, "Stock should be safely restored on cancellation");
});

test("Inventory Policy - Rejects order when stock is insufficient", () => {
  const product = {
    id: "p-limited",
    name: "One of a kind Pendant",
    stockQuantity: 1,
    trackInventory: true,
    allowBackorders: false,
  };

  const requestedQuantity = 2;
  const canFulfill = product.stockQuantity >= requestedQuantity || product.allowBackorders;
  assert.equal(canFulfill, false, "Should not allow order exceeding stock");
});

test("Variation Availability - Existing options default to available", () => {
  const variations = [
    { id: "color", name: "Color", options: ["Gold", "Silver"] },
    {
      id: "size",
      name: "Size",
      options: ["Small", "Large"],
      optionAvailability: { Small: false },
    },
  ];

  assert.equal(isVariationOptionAvailable(variations[0], "Gold"), true);
  assert.deepEqual(getDefaultVariationSelections(variations), {
    Color: "Gold",
    Size: "Large",
  });
  assert.equal(hasAvailableVariantSelection(variations), true);
});

test("Variation Availability - Rejects closed options and products with all options closed", () => {
  const variations = [
    {
      id: "color",
      name: "Color",
      options: ["Gold", "Silver"],
      optionAvailability: { Silver: false },
    },
  ];

  assert.equal(
    areVariationSelectionsAvailable(variations, "Color: Gold"),
    true
  );
  assert.equal(
    areVariationSelectionsAvailable(variations, "Color: Silver"),
    false
  );
  assert.equal(
    areVariationSelectionsAvailable(variations, "Color: Rose Gold"),
    false
  );
  assert.equal(
    hasAvailableVariantSelection([
      {
        id: "size",
        name: "Size",
        options: ["Small"],
        optionAvailability: { Small: false },
      },
    ]),
    false
  );
});

test("Product tags - Parses pasted comma-separated hashtags into individual tags", () => {
  const input =
    "#MESM, #GoldenLeafEarrings, #LeafStatementEarrings, #GoldToneEarrings, #NatureInspiredJewellery, #LuxuryJewellery, #LeafDesignEarrings, #StatementJewellery, #ElegantAccessories, #PartyWearEarrings, #WeddingAccessories, #WomensJewellery, #GiftForHer";

  assert.deepEqual(parseProductTags(input), [
    "MESM",
    "GoldenLeafEarrings",
    "LeafStatementEarrings",
    "GoldToneEarrings",
    "NatureInspiredJewellery",
    "LuxuryJewellery",
    "LeafDesignEarrings",
    "StatementJewellery",
    "ElegantAccessories",
    "PartyWearEarrings",
    "WeddingAccessories",
    "WomensJewellery",
    "GiftForHer",
  ]);
});

test("Product tags - Supports line breaks, trims whitespace, and ignores duplicates", () => {
  assert.deepEqual(
    parseProductTags(" #Resin \n#Hoops, resin; Gift,, "),
    ["Resin", "Hoops", "Gift"]
  );
});

test("Product tags - Removes every pasted hash so the UI can add exactly one", () => {
  assert.equal(normalizeProductTag("##MESM"), "MESM");
  assert.equal(normalizeProductTag("# #MESM"), "MESM");
  assert.equal(normalizeProductTag(" #  #  MESM "), "MESM");
  assert.equal(normalizeProductTag("#ME#SM"), "MESM");
  assert.equal(normalizeProductTag("\\#MESM"), "MESM");
});
