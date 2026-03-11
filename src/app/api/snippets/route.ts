import { NextRequest, NextResponse } from "next/server";
import { createSnippet, getSnippets } from "@/lib/actions/snippets";
import { getCurrentTeacherId } from "@/lib/auth";
import { z } from "zod";
import { withLogging } from "@/lib/logger";

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

export const GET = withLogging("api.snippets.get", async (request) => {
  const { searchParams } = request.nextUrl;
  const tag = searchParams.get("tag") ?? undefined;
  const classGroupId = searchParams.get("classGroupId") ?? undefined;

  const teacherId = await getCurrentTeacherId();
  const snippets = await getSnippets(teacherId, { tag, classGroupId });
  return NextResponse.json(snippets);
});

export const POST = withLogging("api.snippets.post", async (request) => {
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

  const teacherId = await getCurrentTeacherId();
  const snippet = await createSnippet(teacherId, parsed.data);
  return NextResponse.json(snippet, { status: 201 });
});
