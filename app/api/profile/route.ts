import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAppData } from "@/lib/server-store";
import { findEmailByName } from "@/lib/user-store";
import type { TeamMemberName } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAppData();
    const email = await findEmailByName(session.name as TeamMemberName).catch(() => null);

    const assignedTasks = data.tasks.filter((t) => t.assignedTo === session.name);
    const createdTasks = data.tasks.filter((t) => t.createdBy === session.name);
    const messageThreads = data.messageThreads.filter((t) => t.participants.includes(session.name as TeamMemberName));
    const recommendations = data.recommendations.filter((r) => r.createdBy === session.name);

    return NextResponse.json({
      name: session.name,
      role: session.role,
      email: email || null,
      stats: {
        assignedTasks: assignedTasks.length,
        completedTasks: assignedTasks.filter((t) => t.status === "done").length,
        inProgressTasks: assignedTasks.filter((t) => t.status === "in-progress").length,
        createdTasks: createdTasks.length,
        messageThreads: messageThreads.length,
        recommendations: recommendations.length,
      },
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
