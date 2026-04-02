import { NextResponse } from "next/server";
import { ALL_TEAM_MEMBERS } from "@/types";
import { getRegisteredNames } from "@/lib/user-store";

/** Returns all team names and which ones are already claimed. */
export async function GET() {
  try {
    const registered = await getRegisteredNames();
    const names = ALL_TEAM_MEMBERS.map((name) => ({
      name,
      taken: registered.includes(name),
    }));
    return NextResponse.json(names);
  } catch (error) {
    console.error("GET /api/available-names error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
