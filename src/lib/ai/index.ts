import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const provider = process.env.AI_PROVIDER ?? "openai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function getModel(tier: "high" | "fast" = "high") {
  if (provider === "anthropic") {
    return tier === "high"
      ? anthropic("claude-sonnet-4-20250514")
      : anthropic("claude-haiku-4-20250414");
  }
  return tier === "high" ? openai("gpt-4o") : openai("gpt-4o-mini");
}
