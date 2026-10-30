import { NextResponse } from "next/server";
import {
  getCategories,
  getProductCountsByCategory,
  saveCategory,
} from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdminAuth();
    const { searchParams } = new URL(req.url);
    const includeUnpublished = isAdmin && searchParams.get("all") === "true";
    const categories = await getCategories(includeUnpublished);
    if (searchParams.get("includeProductCounts") === "true") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const productCounts = await getProductCountsByCategory("all");
      return NextResponse.json({ categories, productCounts });
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Category name and slug are required" }, { status: 400 });
    }

    const saved = await saveCategory(body);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
