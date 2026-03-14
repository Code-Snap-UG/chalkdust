import { NextResponse } from "next/server";
import { getModel } from "@/lib/ai";
import { arcGenerationSchema, type ArcGenerationOutput } from "@/lib/ai/schemas";
import { arcGenerationSystemPrompt } from "@/lib/ai/prompts/arc-generation";
import { tracedGenerateObject } from "@/lib/ai/trace";
import { getCurrentTeacherId } from "@/lib/auth";
import { withLogging } from "@/lib/logger";
import { db } from "@/lib/db";
import { seriesMilestones, lessonSeries } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { deleteSlots, insertSlots, markSlotsNotStale } from "@/lib/actions/slots";

export const POST = withLogging(
  "api.series.milestones.arc.generate",
  async (_request, { params }) => {
    const { id: seriesId, milestoneId } = await params;

    const [milestone] = await db
      .select()
      .from(seriesMilestones)
      .where(eq(seriesMilestones.id, milestoneId))
      .limit(1);

    if (!milestone || milestone.seriesId !== seriesId) {
      return NextResponse.json(
        { error: "Milestone not found." },
        { status: 404 }
      );
    }

    const [series] = await db
      .select()
      .from(lessonSeries)
      .where(eq(lessonSeries.id, seriesId))
      .limit(1);

    const allMilestones = await db
      .select()
      .from(seriesMilestones)
      .where(eq(seriesMilestones.seriesId, seriesId))
      .orderBy(asc(seriesMilestones.sortOrder));

    const currentIdx = allMilestones.findIndex((m) => m.id === milestoneId);
    const preceding = allMilestones.slice(0, currentIdx);
    const following = allMilestones.slice(currentIdx + 1);

    const goals = Array.isArray(milestone.learningGoals)
      ? (milestone.learningGoals as { text: string }[]).map((g) => `- ${g.text}`).join("\n")
      : "";

    const precedingContext = preceding.length > 0
      ? `\n\n## Vorherige Meilensteine (bereits behandelt oder in Bearbeitung)\n${preceding
          .map((m) => `- ${m.title}: ${m.description || ""}`)
          .join("\n")}`
      : "";

    const followingContext = following.length > 0
      ? `\n\n## Folgende Meilensteine (kommen danach)\n${following
          .map((m) => `- ${m.title}: ${m.description || ""}`)
          .join("\n")}`
      : "";

    const userPrompt = [
      `Erstelle eine Stundenverteilung für folgenden Meilenstein:`,
      ``,
      `## Reihe: ${series?.title || "Unbekannte Reihe"}`,
      `Gesamtziel der Reihe: ${series?.description || ""}`,
      ``,
      `## Meilenstein: ${milestone.title}`,
      `Beschreibung: ${milestone.description || "Keine Beschreibung"}`,
      `Geplante Stunden für diesen Meilenstein: ${milestone.estimatedLessons}`,
      ``,
      `### Lernziele dieses Meilensteins`,
      goals || "Keine Ziele angegeben",
      precedingContext,
      followingContext,
      ``,
      `Erstelle genau ${milestone.estimatedLessons} Slots — einen pro Stunde. Verteile die Ziele progressiv und sinnvoll.`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const teacherId = await getCurrentTeacherId();

    const { object: result } = await tracedGenerateObject<ArcGenerationOutput>(
      {
        model: getModel("high"),
        schema: arcGenerationSchema,
        system: arcGenerationSystemPrompt,
        prompt: userPrompt,
      },
      {
        agentMode: "arc_generation",
        teacherId,
        classGroupId: series?.classGroupId ?? "",
        traceGroupId: crypto.randomUUID(),
        inputParams: { milestoneId, estimatedLessons: milestone.estimatedLessons },
      }
    );

    // Replace all existing slots for this milestone
    await deleteSlots(milestoneId);
    const saved = await insertSlots(
      milestoneId,
      result.slots.map((s) => ({
        position: s.position,
        suggestedTopic: s.suggestedTopic,
        focusAreas: s.focusAreas,
        goalsAddressed: s.goalsAddressed,
      }))
    );
    await markSlotsNotStale(milestoneId);

    return NextResponse.json(saved);
  },
  "Fehler bei der Arc-Generierung."
);
