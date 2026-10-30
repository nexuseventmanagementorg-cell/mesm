import { NextResponse } from "next/server";
import { getProducts, saveProduct } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdminAuth();
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const requestedStatus = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const inStockOnly = searchParams.get("inStock") === "true";
    const featuredOnly = searchParams.get("featured") === "true";
    const sortBy = (searchParams.get("sort") as any) || "newest";
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 12;

    const data = await getProducts({
      categorySlug,
      categoryId,
      status: isAdmin ? requestedStatus : "published",
      search,
      minPrice,
      maxPrice,
      inStockOnly,
      featuredOnly,
      sortBy,
      page,
      limit,
      includePrivateFields: isAdmin,
    });

    return NextResponse.json(data);
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
    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Product name and price are required" }, { status: 400 });
    }

    const saved = await saveProduct(body);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
