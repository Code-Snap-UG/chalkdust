import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai";
import { lessonPlanSchema, type LessonPlanOutput } from "@/lib/ai/schemas";
import { planGenerationSystemPrompt } from "@/lib/ai/prompts/plan-generation";
import { assembleContext } from "@/lib/ai/context";
import { saveLessonPlan } from "@/lib/actions/lesson-plans";
import { tracedGenerateObject } from "@/lib/ai/trace";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

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
    const userPrompt = `Erstelle einen Unterrichtsplan basierend auf folgendem Kontext:\n\n${fullPrompt}`;

    const traceGroupId = crypto.randomUUID();
    const inputParams = {
      topicId,
      topicFreeText,
      durationMinutes,
      lessonDate,
      learningGoals,
      additionalNotes,
    };
    const traceMeta = {
      agentMode: "plan_generation" as const,
      teacherId: HARDCODED_TEACHER_ID,
      classGroupId,
      traceGroupId,
      inputParams,
      assembledContext: context,
    };

    const { object: plan } = await tracedGenerateObject<LessonPlanOutput>(
      {
        model: getModel("high"),
        schema: lessonPlanSchema,
        system: planGenerationSystemPrompt,
        prompt: userPrompt,
      },
      traceMeta,
    );

    const targetDuration = durationMinutes || 45;
    const totalDuration = plan.timeline.reduce(
      (sum, phase) => sum + phase.durationMinutes,
      0
    );

    if (Math.abs(totalDuration - targetDuration) > 2) {
      const retryPrompt = `${userPrompt}\n\nWICHTIG: Die Summe aller Phasendauern muss exakt ${targetDuration} Minuten ergeben.`;

      const { object: retryPlan } = await tracedGenerateObject<LessonPlanOutput>(
        {
          model: getModel("high"),
          schema: lessonPlanSchema,
          system: planGenerationSystemPrompt,
          prompt: retryPrompt,
        },
        { ...traceMeta, inputParams: { ...inputParams, isRetry: true } },
      );

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
