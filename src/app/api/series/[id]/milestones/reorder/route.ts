import { NextResponse } from "next/server";
import { reorderMilestones } from "@/lib/actions/series";
import { withLogging } from "@/lib/logger";

export const PATCH = withLogging(
  "api.series.milestones.reorder",
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    await reorderMilestones(id, orderedIds);
    return NextResponse.json({ ok: true });
  }
);
