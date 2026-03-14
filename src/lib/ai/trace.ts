import {
  generateText,
  streamText,
  Output,
} from "ai";
import { after } from "next/server";
import { propagateAttributes, setActiveTraceIO } from "@langfuse/tracing";
import { AI_MOCK_ENABLED, getMockObject } from "./mocks";
import { langfuseSpanProcessor } from "@/instrumentation";

export type AgentMode =
  | "plan_generation"
  | "plan_refinement"
  | "curriculum_extraction"
  | "transition_summary"
  | "series_generation"
  | "arc_generation";

export interface TraceMetadata {
  agentMode: AgentMode;
  teacherId?: string;
  classGroupId?: string;
  lessonPlanId?: string;
  traceGroupId?: string;
  inputParams?: Record<string, unknown>;
  assembledContext?: string;
}

type GenerateObjectOptions = Omit<Parameters<typeof generateText>[0], "output"> & {
  schema: Parameters<typeof Output.object>[0]["schema"];
};

export async function tracedGenerateObject<RESULT>(
  generateOptions: GenerateObjectOptions,
  traceMetadata: TraceMetadata,
): Promise<{ object: RESULT }> {
  const { schema, ...textOptions } = generateOptions;

  if (AI_MOCK_ENABLED) {
    return { object: getMockObject(traceMetadata.agentMode) as RESULT };
  }

  const result = await propagateAttributes(
    getLangfuseAttributes(traceMetadata),
    () =>
      generateText({
        ...(textOptions as Parameters<typeof generateText>[0]),
        output: Output.object({ schema }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: traceMetadata.agentMode,
        },
        onFinish: ({ text }) => {
          setActiveTraceIO({
            input: {
              ...(typeof textOptions.system === "string" && { system: textOptions.system }),
              ...(typeof textOptions.prompt === "string" && { prompt: textOptions.prompt }),
              ...traceMetadata.inputParams,
            },
            output: { text },
          });
        },
      }),
  );

  after(() => langfuseSpanProcessor.forceFlush());

  return { object: result.output as RESULT };
}

/**
 * Returns the Langfuse propagation attributes for a given trace metadata
 * object. Pass these to `propagateAttributes()` around a `streamText` call
 * so that user/session context is attached to the Langfuse trace.
 */
export function getLangfuseAttributes(traceMetadata: TraceMetadata) {
  return {
    userId: traceMetadata.teacherId,
    sessionId: traceMetadata.traceGroupId ?? traceMetadata.lessonPlanId,
    tags: [traceMetadata.agentMode],
    metadata: Object.fromEntries(
      Object.entries({
        agentMode: traceMetadata.agentMode,
        classGroupId: traceMetadata.classGroupId,
        lessonPlanId: traceMetadata.lessonPlanId,
      }).filter(([, v]) => v !== undefined),
    ) as Record<string, string>,
  };
}

/**
 * Build an `onFinish` callback that sets Langfuse trace I/O.
 * Attach this to a `streamText` call's `onFinish` option.
 */
export function createTracedOnFinish(
  traceMetadata: TraceMetadata,
  opts: { messages?: unknown },
): (event: any) => Promise<void> {
  return async (event) => {
    setActiveTraceIO({
      input: opts.messages,
      output: { text: event.text },
    });
  };
}
