import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  simulateReadableStream,
  type UIMessage,
} from "ai";
import { after } from "next/server";
import { MockLanguageModelV3 } from "ai/test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { z } from "zod";
import { propagateAttributes } from "@langfuse/tracing";
import { getModel } from "@/lib/ai";
import { planRefinementSystemPrompt } from "@/lib/ai/prompts/plan-refinement";
import { updateLessonPlan, getLessonPlan } from "@/lib/actions/lesson-plans";
import { createTracedOnFinish, getLangfuseAttributes } from "@/lib/ai/trace";
import { AI_MOCK_ENABLED, MOCK_CHAT_RESPONSE } from "@/lib/ai/mocks";
import { getCurrentTeacherId } from "@/lib/auth";
import { langfuseSpanProcessor } from "@/instrumentation";
import type {
  LessonPlanOutput,
  TimelinePhase,
  Objective,
  Material,
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  const { messages, lessonPlanId }: { messages: UIMessage[]; lessonPlanId?: string } =
    await request.json();

  if (!lessonPlanId) {
    return new Response("lessonPlanId is required", { status: 400 });
  }

  const currentPlan = await getLessonPlan(lessonPlanId);
  if (!currentPlan) {
    return new Response("Lesson plan not found", { status: 404 });
  }

  // Mutable local state shared across all tool executions in this request.
  // This ensures sequential tool calls (e.g. add_phase then update_phase) each
  // see the result of the previous call instead of the stale snapshot.
  const live = {
    timeline: [...(currentPlan.timeline as TimelinePhase[])],
    objectives: [...(currentPlan.objectives as Objective[])],
    materials: [...(currentPlan.materials as Material[])],
    differentiation: {
      ...(currentPlan.differentiation as LessonPlanOutput["differentiation"]),
    },
  };

  const planContext = `## Aktueller Unterrichtsplan

Thema: ${currentPlan.topic}
Dauer: ${currentPlan.durationMinutes} Minuten

Lernziele:
${live.objectives.map((o, i) => `${i}. ${o.text}`).join("\n")}

Stundenablauf:
${live.timeline.map((p, i) => `${i}. ${p.phase} (${p.durationMinutes} Min.): ${p.description} [Methode: ${p.method}]`).join("\n")}

Differenzierung:
- Schwächere: ${live.differentiation.weaker}
- Stärkere: ${live.differentiation.stronger}

Materialien:
${live.materials.map((m, i) => `${i}. ${m.title} (${m.type}): ${m.description}`).join("\n")}

Hausaufgaben: ${currentPlan.homework || "Keine"}`;

  const systemPrompt = `${planRefinementSystemPrompt}\n\n${planContext}`;

  const teacherId = await getCurrentTeacherId();

  const onFinish = createTracedOnFinish(
    {
      agentMode: "plan_refinement",
      teacherId,
      classGroupId: currentPlan.classGroupId,
      lessonPlanId,
    },
    { messages },
  );

  if (AI_MOCK_ENABLED) {
    const mockChunks: LanguageModelV3StreamPart[] = [
      { type: "text-start", id: "mock-1" },
      { type: "text-delta", id: "mock-1", delta: MOCK_CHAT_RESPONSE },
      { type: "text-end", id: "mock-1" },
      {
        type: "finish",
        finishReason: { unified: "stop" as const, raw: undefined },
        usage: {
          inputTokens: {
            total: 0,
            noCache: undefined,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: { total: 0, text: undefined, reasoning: undefined },
        },
      },
    ];
    const mockResult = streamText({
      model: new MockLanguageModelV3({
        doStream: async () => ({
          stream: simulateReadableStream({ chunks: mockChunks }),
        }),
      }),
      messages: [],
      onFinish,
    });
    return mockResult.toUIMessageStreamResponse();
  }

  const modelMessages = await convertToModelMessages(messages);

  const traceAttrs = getLangfuseAttributes({
    agentMode: "plan_refinement",
    teacherId,
    classGroupId: currentPlan.classGroupId,
    lessonPlanId,
  });

  const result = await propagateAttributes(traceAttrs, () =>
    streamText({
      model: getModel("fast"),
      system: systemPrompt,
      messages: modelMessages,
      onFinish,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "plan_refinement",
      },
      tools: {
      update_plan_field: {
        description:
          "Update a top-level field of the lesson plan (topic or homework)",
        inputSchema: z.object({
          field: z.enum(["topic", "homework"]),
          value: z.string(),
        }),
        execute: async ({ field, value }) => {
          await updateLessonPlan(lessonPlanId, { [field]: value });
          return { success: true, field, value };
        },
      },

      update_timeline_phase: {
        description: "Modify a specific phase in the timeline",
        inputSchema: z.object({
          phaseIndex: z.number().int().min(0),
          changes: z.object({
            phase: z.string().optional(),
            durationMinutes: z.number().int().positive().optional(),
            description: z.string().optional(),
            method: z.string().optional(),
          }),
        }),
        execute: async ({ phaseIndex, changes }) => {
          if (phaseIndex >= live.timeline.length)
            return { success: false, error: "Invalid phase index" };
          live.timeline[phaseIndex] = {
            ...live.timeline[phaseIndex],
            ...changes,
          };
          await updateLessonPlan(lessonPlanId, { timeline: live.timeline });
          return { success: true, phaseIndex, changes };
        },
      },

      add_timeline_phase: {
        description: "Insert a new phase into the timeline",
        inputSchema: z.object({
          afterIndex: z.number().int().min(-1),
          phase: z.object({
            phase: z.string(),
            durationMinutes: z.number().int().positive(),
            description: z.string(),
            method: z.string(),
          }),
        }),
        execute: async ({ afterIndex, phase }) => {
          live.timeline.splice(afterIndex + 1, 0, phase);
          await updateLessonPlan(lessonPlanId, { timeline: live.timeline });
          return { success: true, afterIndex, phase: phase.phase };
        },
      },

      remove_timeline_phase: {
        description: "Remove a phase from the timeline",
        inputSchema: z.object({
          phaseIndex: z.number().int().min(0),
        }),
        execute: async ({ phaseIndex }) => {
          if (phaseIndex >= live.timeline.length)
            return { success: false, error: "Invalid phase index" };
          const removed = live.timeline.splice(phaseIndex, 1);
          await updateLessonPlan(lessonPlanId, { timeline: live.timeline });
          return { success: true, removed: removed[0]?.phase };
        },
      },

      update_objective: {
        description: "Modify a learning objective",
        inputSchema: z.object({
          index: z.number().int().min(0),
          changes: z.object({
            text: z.string().optional(),
            curriculumTopicId: z.string().optional(),
          }),
        }),
        execute: async ({ index, changes }) => {
          if (index >= live.objectives.length)
            return { success: false, error: "Invalid index" };
          live.objectives[index] = { ...live.objectives[index], ...changes };
          await updateLessonPlan(lessonPlanId, {
            objectives: live.objectives,
          });
          return { success: true, index, changes };
        },
      },

      add_objective: {
        description: "Add a new learning objective",
        inputSchema: z.object({
          text: z.string(),
          curriculumTopicId: z.string().optional(),
        }),
        execute: async (objective) => {
          live.objectives.push(objective);
          await updateLessonPlan(lessonPlanId, {
            objectives: live.objectives,
          });
          return { success: true, text: objective.text };
        },
      },

      update_differentiation: {
        description: "Update differentiation for weaker or stronger students",
        inputSchema: z.object({
          level: z.enum(["weaker", "stronger"]),
          text: z.string(),
        }),
        execute: async ({ level, text }) => {
          live.differentiation = { ...live.differentiation, [level]: text };
          await updateLessonPlan(lessonPlanId, {
            differentiation: live.differentiation,
          });
          return { success: true, level, text };
        },
      },

      update_material: {
        description: "Modify a material item",
        inputSchema: z.object({
          index: z.number().int().min(0),
          changes: z.object({
            title: z.string().optional(),
            type: z.string().optional(),
            description: z.string().optional(),
          }),
        }),
        execute: async ({ index, changes }) => {
          if (index >= live.materials.length)
            return { success: false, error: "Invalid index" };
          live.materials[index] = { ...live.materials[index], ...changes };
          await updateLessonPlan(lessonPlanId, { materials: live.materials });
          return { success: true, index, changes };
        },
      },

      add_material: {
        description: "Add a new material",
        inputSchema: z.object({
          title: z.string(),
          type: z.string(),
          description: z.string(),
        }),
        execute: async (material) => {
          live.materials.push(material);
          await updateLessonPlan(lessonPlanId, { materials: live.materials });
          return { success: true, title: material.title };
        },
      },
    },
      stopWhen: stepCountIs(5),
    }),
  );

  after(() => langfuseSpanProcessor.forceFlush());

  return result.toUIMessageStreamResponse();
}
