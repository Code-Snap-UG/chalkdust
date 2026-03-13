import { NextResponse } from "next/server";
import { updateMilestone, deleteMilestone } from "@/lib/actions/series";
import { withLogging } from "@/lib/logger";

export const PATCH = withLogging(
  "api.series.milestones.patch",
  async (request, { params }) => {
    const { milestoneId } = await params;
    const body = await request.json();

    const updated = await updateMilestone(milestoneId, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
);

export const DELETE = withLogging(
  "api.series.milestones.delete",
  async (_request, { params }) => {
    const { milestoneId } = await params;
    await deleteMilestone(milestoneId);
    return NextResponse.json({ ok: true });
  }
);
