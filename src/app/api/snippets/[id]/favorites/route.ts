import { NextRequest, NextResponse } from "next/server";
import {
  addClassFavorite,
  getSnippetFavoriteClasses,
} from "@/lib/actions/snippets";
import { z } from "zod";

const postBodySchema = z.object({
  classGroupId: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const classGroupIds = await getSnippetFavoriteClasses(id);
  return NextResponse.json({ classGroupIds });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  await addClassFavorite(id, parsed.data.classGroupId);
  return new NextResponse(null, { status: 201 });
}
