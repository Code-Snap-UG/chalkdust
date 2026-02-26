import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

type Provider = "openai" | "anthropic" | "google";

const provider = (process.env.AI_PROVIDER ?? "openai") as Provider;

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

const models = {
  openai: {
    high: process.env.OPENAI_MODEL_HIGH ?? "gpt-4o",
    fast: process.env.OPENAI_MODEL_FAST ?? "gpt-4o-mini",
  },
  anthropic: {
    high: process.env.ANTHROPIC_MODEL_HIGH ?? "claude-sonnet-4-20250514",
    fast: process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5",
  },
  google: {
    high: process.env.GOOGLE_MODEL_HIGH ?? "gemini-2.0-pro-exp",
    fast: process.env.GOOGLE_MODEL_FAST ?? "gemini-2.0-flash",
  },
};

export function getModel(tier: "high" | "fast" = "high") {
  switch (provider) {
    case "anthropic":
      return anthropic(models.anthropic[tier]);
    case "google":
      return google(models.google[tier]);
    default:
      return openai(models.openai[tier]);
  }
}

export function getModelWithMeta(tier: "high" | "fast" = "fast") {
  if (provider === "anthropic") {
    const id =
      tier === "high" ? "claude-sonnet-4-20250514" : "claude-haiku-4-20250514";
    return { model: anthropic(id), modelId: id, provider: "anthropic" as const };
  }
  const id = tier === "high" ? "gpt-4o" : "gpt-4o-mini";
  return { model: openai(id), modelId: id, provider: "openai" as const };
}
