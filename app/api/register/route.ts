import { NextRequest, NextResponse } from "next/server";
import { ALL_TEAM_MEMBERS, type TeamMemberName } from "@/types";
import { registerUser } from "@/lib/user-store";

const FIXED_PASSWORD = process.env.APP_PASSWORD || "iss1234";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const name = body?.name as TeamMemberName | undefined;
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!name || !ALL_TEAM_MEMBERS.includes(name)) {
      return NextResponse.json({ error: "Invalid team member name." }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    if (password !== FIXED_PASSWORD) {
      return NextResponse.json({ error: "Invalid password." }, { status: 400 });
    }

    const result = await registerUser(name, email);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
