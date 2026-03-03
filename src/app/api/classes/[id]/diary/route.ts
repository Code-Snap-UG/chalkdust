import { NextRequest, NextResponse } from "next/server";
import { getDiaryEntries } from "@/lib/actions/diary";
import { getClassGroup } from "@/lib/actions/class-groups";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [entries, classGroup] = await Promise.all([
    getDiaryEntries(id),
    getClassGroup(id),
  ]);
  return NextResponse.json({
    entries,
    isArchived: classGroup?.status === "archived",
  });
}
