import { NextRequest, NextResponse } from "next/server";
import { getLessonPlan, updateLessonPlan } from "@/lib/actions/lesson-plans";
import { lessonPlanSchema } from "@/lib/ai/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plan = await getLessonPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patchSchema = lessonPlanSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await updateLessonPlan(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
