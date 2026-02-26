import { NextRequest, NextResponse } from "next/server";
import { getCurriculumTopics } from "@/lib/actions/curriculum";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const topics = await getCurriculumTopics(id);
  return NextResponse.json({ topics });
}
