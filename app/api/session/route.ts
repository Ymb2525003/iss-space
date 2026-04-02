import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("GET /api/session error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
