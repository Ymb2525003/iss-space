import { NextRequest, NextResponse } from "next/server";
import { getAppData, sendDirectMessage } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { type TeamMemberName } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getAppData();
    return NextResponse.json(data.messageThreads);
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (!body?.recipientName || !body?.body) {
      return NextResponse.json({ error: "Missing message data." }, { status: 400 });
    }

    const threads = await sendDirectMessage({
      senderName: session.name,
      recipientName: body.recipientName as TeamMemberName,
      body: String(body.body).trim(),
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
