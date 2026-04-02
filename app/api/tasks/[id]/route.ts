import { NextRequest, NextResponse } from "next/server";
import { updateTask } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { type TaskStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const task = await updateTask({
      taskId: id,
      status: body?.status as TaskStatus | undefined,
      commentBody: typeof body?.commentBody === "string" ? body.commentBody.trim() : undefined,
      noteBody: typeof body?.noteBody === "string" ? body.noteBody.trim() : undefined,
      authorName: session.name,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
