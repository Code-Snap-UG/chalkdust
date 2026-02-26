import { NextRequest, NextResponse } from "next/server";
import { getDiaryEntries } from "@/lib/actions/diary";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entries = await getDiaryEntries(id);
  return NextResponse.json({ entries });
}
