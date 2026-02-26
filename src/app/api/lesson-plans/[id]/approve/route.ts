import { NextRequest, NextResponse } from "next/server";
import { approveLessonPlan } from "@/lib/actions/lesson-plans";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plan = await approveLessonPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, id: plan.id });
}
