import { NextResponse } from "next/server";
import { getModel } from "@/lib/ai";
import {
  seriesGenerationSchema,
  type SeriesGenerationOutput,
} from "@/lib/ai/schemas";
import { seriesGenerationSystemPrompt } from "@/lib/ai/prompts/series-generation";
import { tracedGenerateObject } from "@/lib/ai/trace";
import { getCurrentTeacherId } from "@/lib/auth";
import { withLogging } from "@/lib/logger";
import { db } from "@/lib/db";
import { curricula, curriculumTopics, classGroups } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export const POST = withLogging(
  "api.series.generate",
  async (request) => {
    const body = await request.json();
    const {
      classGroupId,
      title,
      description,
      estimatedLessons,
      curriculumTopicIds,
      additionalNotes,
    } = body;

    if (!classGroupId || !title || !description) {
      return NextResponse.json(
        { error: "classGroupId, title, and description are required." },
        { status: 400 }
      );
    }

    const [classGroup] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, classGroupId))
      .limit(1);

    let topicContext = "";
    if (curriculumTopicIds?.length) {
      const topics = await db
        .select()
        .from(curriculumTopics)
        .where(inArray(curriculumTopics.id, curriculumTopicIds));

      if (topics.length > 0) {
        topicContext = `\n\n## Verknüpfte Lehrplanthemen\n\n${topics
          .map(
            (t) =>
              `- **${t.title}**: ${t.description || "Keine Beschreibung"} (${t.competencyArea || "Allgemein"})`
          )
          .join("\n")}`;
      }
    }

    let predecessorContext = "";
    if (classGroup?.predecessorId) {
      const [pred] = await db
        .select()
        .from(classGroups)
        .where(eq(classGroups.id, classGroup.predecessorId))
        .limit(1);
      if (pred?.transitionStrengths || pred?.transitionWeaknesses) {
        predecessorContext = `\n\n## Vorjahr – Übergangsinformationen\n\n${
          pred.transitionStrengths
            ? `**Stärken:** ${pred.transitionStrengths}\n`
            : ""
        }${
          pred.transitionWeaknesses
            ? `**Schwächen:** ${pred.transitionWeaknesses}`
            : ""
        }`;
      }
    }

    const userPrompt = [
      `Erstelle eine Reihenplanung mit Meilensteinen basierend auf folgenden Angaben:`,
      `\n## Reihendetails`,
      `- Titel: ${title}`,
      `- Ziel: ${description}`,
      `- Geschätzte Stunden gesamt: ${estimatedLessons || "nicht angegeben"}`,
      classGroup
        ? `- Klasse: ${classGroup.name}, ${classGroup.subject}, Klasse ${classGroup.grade}`
        : "",
      additionalNotes
        ? `- Zusätzliche Hinweise: ${additionalNotes}`
        : "",
      topicContext,
      predecessorContext,
      `\nErstelle eine sinnvolle Abfolge von Meilensteinen, die progressiv zum Ziel führen. Die Summe der geschätzten Stunden pro Meilenstein sollte ungefähr ${estimatedLessons || 8} ergeben.`,
    ]
      .filter(Boolean)
      .join("\n");

    const teacherId = await getCurrentTeacherId();
    const traceGroupId = crypto.randomUUID();

    const { object: result } =
      await tracedGenerateObject<SeriesGenerationOutput>(
        {
          model: getModel("high"),
          schema: seriesGenerationSchema,
          system: seriesGenerationSystemPrompt,
          prompt: userPrompt,
        },
        {
          agentMode: "series_generation",
          teacherId,
          classGroupId,
          traceGroupId,
          inputParams: {
            title,
            description,
            estimatedLessons,
            curriculumTopicIds,
            additionalNotes,
          },
        }
      );

    return NextResponse.json(result);
  },
  "Fehler bei der Meilenstein-Generierung."
);
