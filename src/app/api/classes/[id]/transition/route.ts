import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classGroups, diaryEntries, lessonPlans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { tracedGenerateObject } from "@/lib/ai/trace";
import { getModel } from "@/lib/ai";
import { transitionSummarySchema } from "@/lib/ai/schemas";
import {
  transitionSummarySystemPrompt,
  buildTransitionSummaryPrompt,
} from "@/lib/ai/prompts/transition-summary";
import { buildPlanSummary, isVagueSummary } from "@/lib/ai/context";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classGroupId } = await params;

  try {
    const [classGroup] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, classGroupId))
      .limit(1);

    if (!classGroup) {
      return NextResponse.json(
        { error: "Klasse nicht gefunden." },
        { status: 404 }
      );
    }

    if (classGroup.status !== "active") {
      return NextResponse.json(
        { error: "Diese Klasse ist bereits archiviert." },
        { status: 400 }
      );
    }

    // Fetch all taught diary entries with linked lesson plans
    const diaryRows = await db
      .select({ diary: diaryEntries, plan: lessonPlans })
      .from(diaryEntries)
      .leftJoin(lessonPlans, eq(diaryEntries.lessonPlanId, lessonPlans.id))
      .where(eq(diaryEntries.classGroupId, classGroupId))
      .orderBy(desc(diaryEntries.entryDate));

    const taughtEntries = diaryRows.filter(
      (r) => r.diary.progressStatus !== "planned"
    );

    // Serialize diary entries for the prompt
    const diaryText =
      taughtEntries.length > 0
        ? taughtEntries
            .map((r) => {
              const { diary, plan } = r;
              const status =
                diary.progressStatus === "completed"
                  ? "Abgeschlossen"
                  : diary.progressStatus === "partial"
                    ? "Teilweise"
                    : diary.progressStatus === "deviated"
                      ? "Abgewichen"
                      : diary.progressStatus;

              const parts: string[] = [
                `- ${diary.entryDate}: [${status}]`,
              ];

              if (
                diary.progressStatus === "deviated" ||
                !isVagueSummary(diary.actualSummary)
              ) {
                parts.push(diary.actualSummary ?? "");
              } else if (plan) {
                parts.push(`Durchgeführt wie geplant: ${buildPlanSummary(plan)}`);
              } else if (diary.plannedSummary) {
                parts.push(diary.plannedSummary);
              }

              if (diary.teacherNotes) {
                parts.push(`Notiz: ${diary.teacherNotes}`);
              }

              return parts.filter(Boolean).join(" ");
            })
            .join("\n")
        : "Keine Unterrichtseinträge vorhanden.";

    const userPrompt = buildTransitionSummaryPrompt(
      classGroup.name,
      classGroup.subject,
      classGroup.grade,
      classGroup.schoolYear,
      diaryText
    );

    const { object } = await tracedGenerateObject<{
      summary: string;
      strengths: string;
      weaknesses: string;
    }>(
      {
        model: getModel("high"),
        schema: transitionSummarySchema,
        system: transitionSummarySystemPrompt,
        prompt: userPrompt,
      },
      {
        agentMode: "transition_summary",
        teacherId: HARDCODED_TEACHER_ID,
        classGroupId,
        inputParams: { diaryEntryCount: taughtEntries.length },
      }
    );

    return NextResponse.json(object);
  } catch (error) {
    console.error("Transition summary generation error:", error);
    return NextResponse.json(
      { error: "Fehler bei der KI-Generierung. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classGroupId } = await params;

  try {
    const { summary, strengths, weaknesses } = await req.json();

    if (!summary?.trim() || !strengths?.trim() || !weaknesses?.trim()) {
      return NextResponse.json(
        { error: "Alle drei Felder müssen ausgefüllt sein." },
        { status: 400 }
      );
    }

    const [classGroup] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, classGroupId))
      .limit(1);

    if (!classGroup) {
      return NextResponse.json(
        { error: "Klasse nicht gefunden." },
        { status: 404 }
      );
    }

    if (classGroup.status !== "active") {
      return NextResponse.json(
        { error: "Diese Klasse ist bereits archiviert." },
        { status: 400 }
      );
    }

    await db
      .update(classGroups)
      .set({
        transitionSummary: summary,
        transitionStrengths: strengths,
        transitionWeaknesses: weaknesses,
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(classGroups.id, classGroupId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Transition archive error:", error);
    return NextResponse.json(
      { error: "Beim Archivieren ist ein Fehler aufgetreten." },
      { status: 500 }
    );
  }
}
