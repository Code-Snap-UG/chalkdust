import { NextRequest, NextResponse } from "next/server";
import { createSnippet, getSnippets } from "@/lib/actions/snippets";
import { z } from "zod";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

const createSnippetBodySchema = z.object({
  title: z.string().min(1),
  phase: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
  description: z.string().min(1),
  method: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  sourceLessonPlanId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tag = searchParams.get("tag") ?? undefined;

  const snippets = await getSnippets(HARDCODED_TEACHER_ID, { tag });
  return NextResponse.json(snippets);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createSnippetBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const snippet = await createSnippet(HARDCODED_TEACHER_ID, parsed.data);
  return NextResponse.json(snippet, { status: 201 });
}
