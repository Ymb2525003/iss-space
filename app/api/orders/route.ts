import { NextRequest, NextResponse } from "next/server";
import { createOrder, getAppData } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { isLeaderRole } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getAppData();
    return NextResponse.json(data.orders || []);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLeaderRole(session.role)) {
      return NextResponse.json({ error: "Only leaders/admins can create orders." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    if (!body?.category || !body?.quantity) {
      return NextResponse.json({ error: "Missing order data (category and quantity required)." }, { status: 400 });
    }

    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }

    const order = await createOrder({
      category: String(body.category).trim(),
      quantity,
      note: body.note ? String(body.note).trim() : undefined,
      createdBy: session.name,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
