import {
  generateObject,
  streamText,
  type GenerateObjectResult,
  type LanguageModelUsage,
} from "ai";
import { db } from "@/lib/db";
import { aiTraces } from "@/lib/db/schema";
import { AI_MOCK_ENABLED, getMockObject } from "./mocks";

export type AgentMode =
  | "plan_generation"
  | "plan_refinement"
  | "curriculum_extraction"
  | "transition_summary";

export interface TraceMetadata {
  agentMode: AgentMode;
  teacherId?: string;
  classGroupId?: string;
  lessonPlanId?: string;
  traceGroupId?: string;
  inputParams?: Record<string, unknown>;
  assembledContext?: string;
}

interface TraceRow {
  agentMode: AgentMode;
  provider: string;
  modelId: string;
  teacherId?: string;
  classGroupId?: string;
  lessonPlanId?: string;
  traceGroupId?: string;
  inputParams?: Record<string, unknown>;
  assembledContext?: string;
  systemPrompt?: string;
  userPrompt?: string;
  messages?: unknown;
  output?: unknown;
  toolCalls?: unknown;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  status: "success" | "error";
  errorMessage?: string;
}

function extractTokens(usage: LanguageModelUsage) {
  return {
    promptTokens: usage.inputTokens ?? undefined,
    completionTokens: usage.outputTokens ?? undefined,
    totalTokens: usage.totalTokens ?? undefined,
  };
}

async function saveTrace(row: TraceRow) {
  await db.insert(aiTraces).values({
    agentMode: row.agentMode,
    provider: row.provider,
    modelId: row.modelId,
    teacherId: row.teacherId,
    classGroupId: row.classGroupId,
    lessonPlanId: row.lessonPlanId,
    traceGroupId: row.traceGroupId,
    inputParams: row.inputParams,
    assembledContext: row.assembledContext,
    systemPrompt: row.systemPrompt,
    userPrompt: row.userPrompt,
    messages: row.messages,
    output: row.output,
    toolCalls: row.toolCalls,
    finishReason: row.finishReason,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    totalTokens: row.totalTokens,
    durationMs: row.durationMs,
    status: row.status,
    errorMessage: row.errorMessage,
  });
}

export async function tracedGenerateObject<RESULT>(
  generateOptions: Parameters<typeof generateObject>[0],
  traceMetadata: TraceMetadata,
): Promise<GenerateObjectResult<RESULT>> {
  if (AI_MOCK_ENABLED) {
    const object = getMockObject(traceMetadata.agentMode) as RESULT;
    saveTrace({
      ...traceMetadata,
      provider: "mock",
      modelId: "mock",
      systemPrompt:
        typeof generateOptions.system === "string"
          ? generateOptions.system
          : undefined,
      userPrompt:
        typeof generateOptions.prompt === "string"
          ? generateOptions.prompt
          : undefined,
      output: object as unknown,
      durationMs: 0,
      finishReason: "stop",
      status: "success",
    }).catch(console.error);
    return { object } as unknown as GenerateObjectResult<RESULT>;
  }

  const start = Date.now();
  try {
    const result = await generateObject(generateOptions);
    const durationMs = Date.now() - start;
    const tokens = extractTokens(result.usage);

    saveTrace({
      ...traceMetadata,
      provider: result.response.modelId?.split(":")[0] ?? "unknown",
      modelId: result.response.modelId ?? "unknown",
      systemPrompt:
        typeof generateOptions.system === "string"
          ? generateOptions.system
          : undefined,
      userPrompt:
        typeof generateOptions.prompt === "string"
          ? generateOptions.prompt
          : undefined,
      output: result.object as unknown,
      ...tokens,
      durationMs,
      finishReason: result.finishReason,
      status: "success",
    }).catch(console.error);

    return result as GenerateObjectResult<RESULT>;
  } catch (error) {
    const durationMs = Date.now() - start;
    saveTrace({
      ...traceMetadata,
      provider: "unknown",
      modelId: "unknown",
      systemPrompt:
        typeof generateOptions.system === "string"
          ? generateOptions.system
          : undefined,
      userPrompt:
        typeof generateOptions.prompt === "string"
          ? generateOptions.prompt
          : undefined,
      durationMs,
      status: "error",
      errorMessage: String(error),
    }).catch(console.error);
    throw error;
  }
}

/**
 * Build an `onFinish` callback that persists an AI trace row.
 * Attach this to a `streamText` call's `onFinish` option.
 */
export function createTracedOnFinish(
  traceMetadata: TraceMetadata,
  opts: { systemPrompt?: string; messages?: unknown; startTime: number },
): (event: any) => Promise<void> {
  return async (event) => {
    const durationMs = Date.now() - opts.startTime;
    const tokens = extractTokens(event.totalUsage);

    const toolCallData =
      event.toolCalls?.length || event.toolResults?.length
        ? { calls: event.toolCalls, results: event.toolResults }
        : undefined;

    saveTrace({
      ...traceMetadata,
      provider: event.model?.provider ?? "unknown",
      modelId: event.model?.modelId ?? "unknown",
      systemPrompt: opts.systemPrompt,
      messages: opts.messages,
      output: { text: event.text },
      toolCalls: toolCallData,
      ...tokens,
      durationMs,
      finishReason: event.finishReason,
      status: "success",
    }).catch(console.error);
  };
}
