import { NextResponse } from "next/server";
import { getSalesAnalytics } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET() {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getSalesAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
