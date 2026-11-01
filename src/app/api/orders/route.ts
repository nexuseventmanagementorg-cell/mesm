import { NextResponse } from "next/server";
import {
  createOrder,
  getOrderByIdempotencyKey,
  getOrders,
  getStoreSettings,
  OrderIdempotencyConflictError,
} from "@/lib/db";
import { generateOrderNumber, formatPakistaniPhone } from "@/lib/utils";
import { buildWhatsAppUrl, generateWhatsAppOrderMessage } from "@/lib/whatsapp";
import { verifyAdminAuth } from "@/lib/auth";
import { isPaymentMethodAvailable } from "@/lib/payment-methods";
import { getRequestOrigin } from "@/lib/request-origin";
import { createHash, createHmac } from "crypto";
import type { Order } from "@/types";
import { checkoutOrderSchema } from "@/lib/order-checkout-validation.mjs";
import {
  CUSTOMER_ORDER_ACCESS_COOKIE,
  CUSTOMER_ORDER_ACCESS_MAX_AGE_SECONDS,
  hashCustomerOrderAccessToken,
} from "@/lib/customer-order-access.mjs";

const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fingerprintCheckoutIntent(intent: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  giftMessage?: string;
  paymentProofUrl?: string;
  items: { productId: string; variationText?: string; quantity: number }[];
  paymentMethod: string;
}) {
  const items = intent.items
    .map((item) => ({
      productId: item.productId.trim(),
      variationText: item.variationText?.trim() || null,
      quantity: item.quantity,
    }))
    .sort((left, right) => {
      const leftKey = `${left.productId}\u0000${left.variationText || ""}\u0000${left.quantity}`;
      const rightKey = `${right.productId}\u0000${right.variationText || ""}\u0000${right.quantity}`;
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
  const normalizedIntent = {
    customerName: intent.customerName.trim(),
    customerPhone: formatPakistaniPhone(intent.customerPhone),
    customerEmail: intent.customerEmail?.trim().toLowerCase() || null,
    customerCity: intent.customerCity.trim(),
    deliveryAddress: intent.deliveryAddress.trim(),
    deliveryInstructions: intent.deliveryInstructions?.trim() || null,
    giftMessage: intent.giftMessage?.trim() || null,
    paymentProofUrl: intent.paymentProofUrl?.trim() || null,
    items,
    paymentMethod: intent.paymentMethod,
  };
  return createHash("sha256").update(JSON.stringify(normalizedIntent)).digest("hex");
}

function getCheckoutSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("A server-side secret is required for secure checkout.");
  }
  return secret;
}

function createCheckoutAccessToken(idempotencyKey: string, createdAt: string) {
  const nonce = createHmac("sha256", getCheckoutSecret())
    .update(`customer-order-access:${idempotencyKey}`)
    .digest("base64url");
  const expiresAt =
    Math.floor(new Date(createdAt).getTime() / 1000) +
    CUSTOMER_ORDER_ACCESS_MAX_AGE_SECONDS;
  return `${nonce}.${expiresAt}`;
}

function toPublicOrder(order: Order) {
  const publicOrder = { ...order };
  delete publicOrder.idempotencyKey;
  delete publicOrder.requestFingerprint;
  delete publicOrder.customerAccessTokenHash;
  delete publicOrder.paymentProofUrl;
  return publicOrder;
}

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 10;

    const data = await getOrders({ status, paymentStatus, search, page, limit });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawIdempotencyKey = req.headers.get("Idempotency-Key");
    if (!rawIdempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(rawIdempotencyKey)) {
      return NextResponse.json(
        { error: "A valid UUID v4 Idempotency-Key header is required." },
        { status: 400 }
      );
    }
    const idempotencyKey = rawIdempotencyKey.toLowerCase();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Order details are invalid." }, { status: 400 });
    }
    const parsedBody = checkoutOrderSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Order details are invalid." }, { status: 400 });
    }
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      deliveryAddress,
      deliveryInstructions,
      giftMessage,
      items,
      paymentMethod,
      paymentProofUrl,
    } = parsedBody.data;

    const requestFingerprint = fingerprintCheckoutIntent(parsedBody.data);
    const priorOrder = await getOrderByIdempotencyKey(
      idempotencyKey,
      requestFingerprint
    );
    const settings = await getStoreSettings();
    if (!priorOrder && !isPaymentMethodAvailable(paymentMethod, settings)) {
      return NextResponse.json(
        { error: "This payment method is currently unavailable. Please choose another method." },
        { status: 400 }
      );
    }
    if (paymentProofUrl !== undefined) {
      if (typeof paymentProofUrl !== "string" || paymentProofUrl.length > 2048) {
        return NextResponse.json({ error: "The payment receipt link is invalid." }, { status: 400 });
      }

      let proofUrl: URL;
      try {
        proofUrl = new URL(paymentProofUrl);
      } catch {
        return NextResponse.json({ error: "The payment receipt link is invalid." }, { status: 400 });
      }
      const requestOrigin = getRequestOrigin(req);
      const isLocalUpload =
        proofUrl.origin === requestOrigin &&
        proofUrl.pathname.startsWith("/uploads/payment-proofs/");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      let isSupabaseUpload = false;
      if (supabaseUrl) {
        try {
          isSupabaseUpload =
            proofUrl.origin === new URL(supabaseUrl).origin &&
            proofUrl.pathname.startsWith(
              "/storage/v1/object/public/meems-gems-media/payment-proofs/"
            );
        } catch {
          isSupabaseUpload = false;
        }
      }
      if (
        !["http:", "https:"].includes(proofUrl.protocol) ||
        proofUrl.search ||
        proofUrl.hash ||
        (!isLocalUpload && !isSupabaseUpload)
      ) {
        return NextResponse.json({ error: "The payment receipt link is invalid." }, { status: 400 });
      }
    }

    const cleanedPhone = formatPakistaniPhone(customerPhone);
    const createdAt = priorOrder?.createdAt || new Date().toISOString();
    const orderNumber = priorOrder?.orderNumber || generateOrderNumber();
    const initialAccessToken = createCheckoutAccessToken(idempotencyKey, createdAt);

    const order = priorOrder || await createOrder({
      orderNumber,
      idempotencyKey,
      requestFingerprint,
      createdAt,
      customerName,
      customerPhone: cleanedPhone,
      customerEmail,
      customerCity,
      deliveryAddress,
      deliveryInstructions,
      giftMessage,
      items,
      paymentMethod,
      paymentProofUrl,
      customerAccessTokenHash: hashCustomerOrderAccessToken(initialAccessToken),
    });
    const customerAccessToken = createCheckoutAccessToken(
      idempotencyKey,
      order.createdAt
    );

    const whatsappMessage = generateWhatsAppOrderMessage(order);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);

    const response = NextResponse.json({
      success: true,
      order: toPublicOrder(order),
      whatsappUrl,
      whatsappMessage,
      businessWhatsApp: settings.whatsappNumber,
    });
    response.cookies.set(CUSTOMER_ORDER_ACCESS_COOKIE, customerAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/order-confirmation",
      maxAge: CUSTOMER_ORDER_ACCESS_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof OrderIdempotencyConflictError) {
      return NextResponse.json(
        {
          error:
            "This checkout attempt was already used with different order details. Please refresh checkout and submit the updated order as a new attempt.",
          code: "IDEMPOTENCY_KEY_REUSED",
        },
        { status: 409 }
      );
    }
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Unable to place this order. Please try again." },
      { status: 500 }
    );
  }
}
