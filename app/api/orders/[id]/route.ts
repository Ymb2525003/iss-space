import { NextRequest, NextResponse } from "next/server";
import { updateOrder, deleteOrder } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { isLeaderRole, type OrderStatus } from "@/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLeaderRole(session.role)) {
      return NextResponse.json({ error: "Only leaders/admins can update orders." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const validStatuses: OrderStatus[] = ["active", "done"];
    const status = body?.status && validStatuses.includes(body.status) ? body.status : undefined;
    const paid = typeof body?.paid === "boolean" ? body.paid : undefined;

    const order = await updateOrder({
      orderId: id,
      status,
      paid,
      actorName: session.name,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLeaderRole(session.role)) {
      return NextResponse.json({ error: "Only leaders/admins can delete orders." }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteOrder(id);

    if (!deleted) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
