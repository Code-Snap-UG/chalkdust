import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const providerName = process.env.AI_PROVIDER ?? "openai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function getModel(tier: "high" | "fast" = "fast") {
  if (providerName === "anthropic") {
    return tier === "high"
      ? anthropic("claude-sonnet-4-20250514")
      : anthropic("claude-haiku-4-5");
  }
  return tier === "high" ? openai("gpt-4o") : openai("gpt-4o-mini");
}

export function getModelWithMeta(tier: "high" | "fast" = "fast") {
  if (providerName === "anthropic") {
    const id =
      tier === "high" ? "claude-sonnet-4-20250514" : "claude-haiku-4-20250514";
    return { model: anthropic(id), modelId: id, provider: "anthropic" as const };
  }
  const id = tier === "high" ? "gpt-4o" : "gpt-4o-mini";
  return { model: openai(id), modelId: id, provider: "openai" as const };
}
