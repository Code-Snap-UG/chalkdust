import { NextResponse } from "next/server";
import { withLogging } from "@/lib/logger";
import { updateSlot } from "@/lib/actions/slots";

export const PATCH = withLogging(
  "api.series.milestones.arc.slot.update",
  async (request, { params }) => {
    const { slotId } = await params;
    const body = await request.json();
    const { suggestedTopic, focusAreas, goalsAddressed, notes } = body;

    const updated = await updateSlot(slotId, {
      ...(suggestedTopic !== undefined && { suggestedTopic }),
      ...(focusAreas !== undefined && { focusAreas }),
      ...(goalsAddressed !== undefined && { goalsAddressed }),
      ...(notes !== undefined && { notes }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  },
  "Fehler beim Aktualisieren des Slots."
);
