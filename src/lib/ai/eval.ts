import { wrapAISDKModel } from "evalite/ai-sdk";
import { getModel } from "@/lib/ai";

/**
 * Returns the project's configured AI model wrapped with Evalite's tracing and
 * caching. Use this in .eval.ts files instead of getModel() directly so that
 * Evalite can record LLM calls and serve cached responses during iteration.
 *
 * Outside of an Evalite context wrapAISDKModel is a no-op, so this file is
 * safe to import from production code if needed.
 */
export function getEvalModel(tier: "high" | "fast" = "high") {
  return wrapAISDKModel(getModel(tier));
}
