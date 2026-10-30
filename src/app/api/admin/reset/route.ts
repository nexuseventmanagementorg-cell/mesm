import { NextResponse } from "next/server";
import { resetStoreData } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function POST() {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await resetStoreData();
    return NextResponse.json({ success: true, message: "Products, orders, and reviews cleared successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
