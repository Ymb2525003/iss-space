import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/types";
import { createSession } from "@/lib/session";
import { findUserByEmail } from "@/lib/user-store";

const FIXED_PASSWORD = process.env.APP_PASSWORD || "iss1234";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (password !== FIXED_PASSWORD) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const name = await findUserByEmail(email);
    if (!name) {
      return NextResponse.json({ error: "No account found with this email. Please register first." }, { status: 401 });
    }

    await createSession(name);
    return NextResponse.json(getUserProfile(name));
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
