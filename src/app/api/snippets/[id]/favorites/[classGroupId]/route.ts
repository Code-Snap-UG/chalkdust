import { NextRequest, NextResponse } from "next/server";
import { removeClassFavorite } from "@/lib/actions/snippets";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; classGroupId: string }> }
) {
  const { id, classGroupId } = await params;
  await removeClassFavorite(id, classGroupId);
  return new NextResponse(null, { status: 204 });
}
