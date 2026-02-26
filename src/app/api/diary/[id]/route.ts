import { NextRequest, NextResponse } from "next/server";
import { updateDiaryEntry } from "@/lib/actions/diary";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await updateDiaryEntry(id, {
    actualSummary: body.actualSummary,
    teacherNotes: body.teacherNotes,
    progressStatus: body.progressStatus,
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
