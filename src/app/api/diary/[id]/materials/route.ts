import { NextRequest, NextResponse } from "next/server";
import { getDiaryEntryMaterials } from "@/lib/actions/diary";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const materials = await getDiaryEntryMaterials(id);
  return NextResponse.json({ materials });
}
