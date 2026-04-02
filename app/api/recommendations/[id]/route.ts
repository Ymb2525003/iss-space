import { NextRequest, NextResponse } from "next/server";
import { deleteRecommendation, getAppData, updateRecommendation } from "@/lib/server-store";
import { getSession } from "@/lib/session";
import { type TaskType } from "@/types";

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

    // If editing title/description/type, only creator or admin can do it
    const isEdit = body?.title || body?.type || body?.description;
    if (isEdit) {
      const data = await getAppData();
      const rec = data.recommendations.find((r) => r.id === id);
      if (!rec) {
        return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
      }
      if (rec.createdBy !== session.name && session.role !== "admin") {
        return NextResponse.json({ error: "Only the creator or admin can edit." }, { status: 403 });
      }
    }

    const recommendation = await updateRecommendation({
      recommendationId: id,
      actorName: session.name,
      toggleReaction: Boolean(body?.toggleReaction),
      commentBody: typeof body?.commentBody === "string" ? body.commentBody.trim() : undefined,
      title: typeof body?.title === "string" ? body.title.trim() : undefined,
      type: body?.type as TaskType | undefined,
      description: typeof body?.description === "string" ? body.description.trim() : undefined,
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("PATCH /api/recommendations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Only creator or admin can delete
    const data = await getAppData();
    const rec = data.recommendations.find((r) => r.id === id);
    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
    }
    if (rec.createdBy !== session.name && session.role !== "admin") {
      return NextResponse.json({ error: "Only the creator or admin can delete." }, { status: 403 });
    }

    await deleteRecommendation(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/recommendations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
