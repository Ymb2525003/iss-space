import { NextRequest, NextResponse } from "next/server";
import { addRecommendation, getAppData } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { type TaskType } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getAppData();
    return NextResponse.json(data.recommendations);
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
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

    if (!body?.title || !body?.type || !body?.description) {
      return NextResponse.json({ error: "Missing recommendation data." }, { status: 400 });
    }

    const recommendation = await addRecommendation({
      title: String(body.title).trim(),
      type: body.type as TaskType,
      description: String(body.description).trim(),
      createdBy: session.name,
    });

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
