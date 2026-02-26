import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getModel } from "@/lib/ai";
import { lessonPlanSchema } from "@/lib/ai/schemas";
import { planGenerationSystemPrompt } from "@/lib/ai/prompts/plan-generation";
import { assembleContext } from "@/lib/ai/context";
import { saveLessonPlan } from "@/lib/actions/lesson-plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classGroupId,
      lessonDate,
      durationMinutes,
      topicId,
      topicFreeText,
      learningGoals,
      additionalNotes,
    } = body;

    if (!classGroupId) {
      return NextResponse.json(
        { error: "classGroupId ist erforderlich." },
        { status: 400 }
      );
    }

    const context = await assembleContext(classGroupId, topicId);

    const teacherInput = [
      `## Lehrerangaben`,
      durationMinutes ? `- Stundenlänge: ${durationMinutes} Minuten` : null,
      lessonDate ? `- Datum: ${lessonDate}` : null,
      topicFreeText ? `- Gewünschtes Thema: ${topicFreeText}` : null,
      learningGoals ? `- Lernziele: ${learningGoals}` : null,
      additionalNotes ? `- Zusätzliche Hinweise: ${additionalNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const fullPrompt = [context, teacherInput].filter(Boolean).join("\n\n---\n\n");

    const { object: plan } = await generateObject({
      model: getModel("high"),
      schema: lessonPlanSchema,
      system: planGenerationSystemPrompt,
      prompt: `Erstelle einen Unterrichtsplan basierend auf folgendem Kontext:\n\n${fullPrompt}`,
    });

    // Quality guardrail: check duration sum
    const totalDuration = plan.timeline.reduce(
      (sum, phase) => sum + phase.durationMinutes,
      0
    );
    const targetDuration = durationMinutes || 45;

    if (Math.abs(totalDuration - targetDuration) > 2) {
      // Retry once with explicit duration hint
      const { object: retryPlan } = await generateObject({
        model: getModel("high"),
        schema: lessonPlanSchema,
        system: planGenerationSystemPrompt,
        prompt: `Erstelle einen Unterrichtsplan basierend auf folgendem Kontext:\n\n${fullPrompt}\n\nWICHTIG: Die Summe aller Phasendauern muss exakt ${targetDuration} Minuten ergeben.`,
      });
      const saved = await saveLessonPlan(
        classGroupId,
        retryPlan,
        lessonDate,
        targetDuration
      );
      return NextResponse.json({ plan: retryPlan, id: saved.id });
    }

    const saved = await saveLessonPlan(
      classGroupId,
      plan,
      lessonDate,
      targetDuration
    );
    return NextResponse.json({ plan, id: saved.id });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Planerstellung." },
      { status: 500 }
    );
  }
}
