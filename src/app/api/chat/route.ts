import { streamText, tool } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";
import { planRefinementSystemPrompt } from "@/lib/ai/prompts/plan-refinement";
import { updateLessonPlan, getLessonPlan } from "@/lib/actions/lesson-plans";
import type { LessonPlanOutput, TimelinePhase, Objective, Material } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const { messages, lessonPlanId } = await request.json();

  if (!lessonPlanId) {
    return new Response("lessonPlanId is required", { status: 400 });
  }

  const currentPlan = await getLessonPlan(lessonPlanId);
  if (!currentPlan) {
    return new Response("Lesson plan not found", { status: 404 });
  }

  const planContext = `## Aktueller Unterrichtsplan

Thema: ${currentPlan.topic}
Dauer: ${currentPlan.durationMinutes} Minuten

Lernziele:
${(currentPlan.objectives as Objective[]).map((o, i) => `${i}. ${o.text}`).join("\n")}

Stundenablauf:
${(currentPlan.timeline as TimelinePhase[]).map((p, i) => `${i}. ${p.phase} (${p.durationMinutes} Min.): ${p.description} [Methode: ${p.method}]`).join("\n")}

Differenzierung:
- Schwächere: ${(currentPlan.differentiation as LessonPlanOutput["differentiation"]).weaker}
- Stärkere: ${(currentPlan.differentiation as LessonPlanOutput["differentiation"]).stronger}

Materialien:
${(currentPlan.materials as Material[]).map((m, i) => `${i}. ${m.title} (${m.type}): ${m.description}`).join("\n")}

Hausaufgaben: ${currentPlan.homework || "Keine"}`;

  const result = streamText({
    model: getModel("fast"),
    system: `${planRefinementSystemPrompt}\n\n${planContext}`,
    messages,
    tools: {
      update_plan_field: tool({
        description: "Update a top-level field of the lesson plan (topic or homework)",
        parameters: z.object({
          field: z.enum(["topic", "homework"]),
          value: z.string(),
        }),
        execute: async ({ field, value }) => {
          await updateLessonPlan(lessonPlanId, { [field]: value });
          return { success: true, field, value };
        },
      }),

      update_timeline_phase: tool({
        description: "Modify a specific phase in the timeline",
        parameters: z.object({
          phaseIndex: z.number().int().min(0),
          changes: z.object({
            phase: z.string().optional(),
            durationMinutes: z.number().int().positive().optional(),
            description: z.string().optional(),
            method: z.string().optional(),
          }),
        }),
        execute: async ({ phaseIndex, changes }) => {
          const timeline = [...(currentPlan.timeline as TimelinePhase[])];
          if (phaseIndex >= timeline.length)
            return { success: false, error: "Invalid phase index" };
          timeline[phaseIndex] = { ...timeline[phaseIndex], ...changes };
          await updateLessonPlan(lessonPlanId, { timeline });
          return { success: true, phaseIndex, changes };
        },
      }),

      add_timeline_phase: tool({
        description: "Insert a new phase into the timeline",
        parameters: z.object({
          afterIndex: z.number().int().min(-1),
          phase: z.object({
            phase: z.string(),
            durationMinutes: z.number().int().positive(),
            description: z.string(),
            method: z.string(),
          }),
        }),
        execute: async ({ afterIndex, phase }) => {
          const timeline = [...(currentPlan.timeline as TimelinePhase[])];
          timeline.splice(afterIndex + 1, 0, phase);
          await updateLessonPlan(lessonPlanId, { timeline });
          return { success: true, afterIndex, phase: phase.phase };
        },
      }),

      remove_timeline_phase: tool({
        description: "Remove a phase from the timeline",
        parameters: z.object({
          phaseIndex: z.number().int().min(0),
        }),
        execute: async ({ phaseIndex }) => {
          const timeline = [...(currentPlan.timeline as TimelinePhase[])];
          if (phaseIndex >= timeline.length)
            return { success: false, error: "Invalid phase index" };
          const removed = timeline.splice(phaseIndex, 1);
          await updateLessonPlan(lessonPlanId, { timeline });
          return { success: true, removed: removed[0]?.phase };
        },
      }),

      update_objective: tool({
        description: "Modify a learning objective",
        parameters: z.object({
          index: z.number().int().min(0),
          changes: z.object({
            text: z.string().optional(),
            curriculumTopicId: z.string().optional(),
          }),
        }),
        execute: async ({ index, changes }) => {
          const objectives = [...(currentPlan.objectives as Objective[])];
          if (index >= objectives.length)
            return { success: false, error: "Invalid index" };
          objectives[index] = { ...objectives[index], ...changes };
          await updateLessonPlan(lessonPlanId, { objectives });
          return { success: true, index, changes };
        },
      }),

      add_objective: tool({
        description: "Add a new learning objective",
        parameters: z.object({
          text: z.string(),
          curriculumTopicId: z.string().optional(),
        }),
        execute: async (objective) => {
          const objectives = [...(currentPlan.objectives as Objective[]), objective];
          await updateLessonPlan(lessonPlanId, { objectives });
          return { success: true, text: objective.text };
        },
      }),

      update_differentiation: tool({
        description: "Update differentiation for weaker or stronger students",
        parameters: z.object({
          level: z.enum(["weaker", "stronger"]),
          text: z.string(),
        }),
        execute: async ({ level, text }) => {
          const diff = currentPlan.differentiation as LessonPlanOutput["differentiation"];
          const updated = { ...diff, [level]: text };
          await updateLessonPlan(lessonPlanId, { differentiation: updated });
          return { success: true, level, text };
        },
      }),

      update_material: tool({
        description: "Modify a material item",
        parameters: z.object({
          index: z.number().int().min(0),
          changes: z.object({
            title: z.string().optional(),
            type: z.string().optional(),
            description: z.string().optional(),
          }),
        }),
        execute: async ({ index, changes }) => {
          const mats = [...(currentPlan.materials as Material[])];
          if (index >= mats.length)
            return { success: false, error: "Invalid index" };
          mats[index] = { ...mats[index], ...changes };
          await updateLessonPlan(lessonPlanId, { materials: mats });
          return { success: true, index, changes };
        },
      }),

      add_material: tool({
        description: "Add a new material",
        parameters: z.object({
          title: z.string(),
          type: z.string(),
          description: z.string(),
        }),
        execute: async (material) => {
          const mats = [...(currentPlan.materials as Material[]), material];
          await updateLessonPlan(lessonPlanId, { materials: mats });
          return { success: true, title: material.title };
        },
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
