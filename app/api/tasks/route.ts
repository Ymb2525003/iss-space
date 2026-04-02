import { NextRequest, NextResponse } from "next/server";
import { createTask, getAppData } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { MEMBERS, isLeaderRole, type MemberName, type TaskPriority, type TaskType } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getAppData();
    return NextResponse.json(data.tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
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
      return NextResponse.json({ error: "Only leaders can create tasks." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

  if (
    !body?.title ||
    !body?.type ||
    !body?.description ||
    !body?.dueDate ||
    !body?.assignedTo
  ) {
    return NextResponse.json({ error: "Missing task data." }, { status: 400 });
  }

  if (!MEMBERS.includes(body.assignedTo as MemberName)) {
    return NextResponse.json({ error: "Tasks can only be assigned to members." }, { status: 400 });
  }

  const validPriorities = ["high", "medium", "low"];
  const priority: TaskPriority = validPriorities.includes(body.priority) ? body.priority : "medium";

  const task = await createTask({
    title: String(body.title).trim(),
    type: body.type as TaskType,
    description: String(body.description).trim(),
    dueDate: String(body.dueDate),
    assignedTo: body.assignedTo as MemberName,
    createdBy: session.name as typeof task.createdBy,
    priority,
  });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
