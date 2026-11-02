import { NextResponse } from "next/server";
import { submitCustomerPaymentProof } from "@/lib/db";
import { getRequestOrigin } from "@/lib/request-origin";

function isValidReceiptUrl(value: unknown, request: Request) {
  if (typeof value !== "string" || value.length > 2048) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    return false;
  }

  const isLocalUpload =
    url.origin === getRequestOrigin(request) &&
    url.pathname.startsWith("/uploads/payment-proofs/");
  const configuredSupabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let isSupabaseUpload = false;
  if (configuredSupabaseUrl) {
    try {
      isSupabaseUpload =
        url.origin === new URL(configuredSupabaseUrl).origin &&
        url.pathname.startsWith(
          "/storage/v1/object/public/meems-gems-media/payment-proofs/"
        );
    } catch {
      isSupabaseUpload = false;
    }
  }

  return isLocalUpload || isSupabaseUpload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The receipt upload details are invalid." },
        { status: 400 }
      );
    }

    if (
      !isRecord(body) ||
      typeof body.accessToken !== "string" ||
      body.accessToken.length > 128 ||
      typeof body.paymentProofUrl !== "string" ||
      !isValidReceiptUrl(body.paymentProofUrl, request)
    ) {
      return NextResponse.json(
        { error: "The receipt upload details are invalid." },
        { status: 400 }
      );
    }

    const order = await submitCustomerPaymentProof(
      params.orderNumber,
      body.accessToken,
      body.paymentProofUrl
    );
    return NextResponse.json({ success: true, paymentStatus: order.paymentStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit payment receipt.";
    const status = /invalid or has expired/i.test(message)
      ? 401
      : /not found/i.test(message)
        ? 404
        : /cannot be uploaded|changed while uploading/i.test(message)
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
