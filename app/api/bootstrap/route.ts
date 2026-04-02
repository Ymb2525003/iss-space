import { NextResponse } from "next/server";
import { getAppData } from "@/lib/server-store";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getAppData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/bootstrap error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
