import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { recordCustomerMessageSent } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (
      typeof body.templateKey !== "string" ||
      !/^(order_(received_thank_you|pending_[123]|confirmed|preparing|ready|shipped|delivered|cancelled)|payment_(cod_due|unpaid_[123]|awaiting_verification|paid|refunded))$/.test(
        body.templateKey
      )
    ) {
      return NextResponse.json({ error: "Invalid customer message template." }, { status: 400 });
    }

    const order = await recordCustomerMessageSent(params.id, body.templateKey);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record customer message.";
    const status = /not found/i.test(message)
      ? 404
      : /not available|limit|due|already|changed/i.test(message)
        ? 409
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
