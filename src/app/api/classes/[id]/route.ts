import { NextRequest, NextResponse } from "next/server";
import { getClassGroup } from "@/lib/actions/class-groups";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const classGroup = await getClassGroup(id);

  if (!classGroup) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(classGroup);
}
