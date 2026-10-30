import { NextResponse } from "next/server";
import { createOrder, getOrders, getStoreSettings } from "@/lib/db";
import { generateOrderNumber, formatPakistaniPhone } from "@/lib/utils";
import { buildWhatsAppUrl, generateWhatsAppOrderMessage } from "@/lib/whatsapp";
import { verifyAdminAuth } from "@/lib/auth";
import { isPaymentMethodAvailable } from "@/lib/payment-methods";
import { getRequestOrigin } from "@/lib/request-origin";

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
    const body = await req.json();

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
    } = body;

    // Server-side validation
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json({ error: "Contact phone number is required" }, { status: 400 });
    }
    if (!customerCity || !customerCity.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Shopping cart is empty" }, { status: 400 });
    }
    const settings = await getStoreSettings();
    if (!isPaymentMethodAvailable(paymentMethod, settings)) {
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
    const orderNumber = generateOrderNumber();

    // Create order persistently in DB with inventory check & deduction
    const order = await createOrder({
      orderNumber,
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
    });

    // Fetch store settings for WhatsApp phone number
    const whatsappMessage = generateWhatsAppOrderMessage(order);
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, whatsappMessage);

    return NextResponse.json({
      success: true,
      order,
      whatsappUrl,
      whatsappMessage,
      businessWhatsApp: settings.whatsappNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
