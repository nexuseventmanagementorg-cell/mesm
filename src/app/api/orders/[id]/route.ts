import { NextResponse } from "next/server";
import {
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let order = await getOrderById(params.id);
    if (!order) {
      order = await getOrderByNumber(params.id);
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let updatedOrder;

    if (body.orderStatus) {
      updatedOrder = await updateOrderStatus(params.id, body.orderStatus, body.notes);
    }

    if (body.paymentStatus) {
      updatedOrder = await updateOrderPaymentStatus(params.id, body.paymentStatus, body.notes);
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: "No status update provided" }, { status: 400 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
