interface PlanRecord {
  topic: string;
  objectives: unknown;
  timeline: unknown;
}

/**
 * Build a concise one-line summary from a lesson plan's structured fields:
 * topic, learning objectives (up to 3), and timeline phase names.
 */
export function buildPlanSummary(plan: PlanRecord): string {
  const parts: string[] = [`Thema: ${plan.topic}`];

  if (Array.isArray(plan.objectives) && plan.objectives.length > 0) {
    const objectives = plan.objectives
      .map((o: unknown) =>
        typeof o === "string" ? o : (o as { text?: string })?.text
      )
      .filter(Boolean)
      .slice(0, 3);
    if (objectives.length > 0) {
      parts.push(`Ziele: ${objectives.join(", ")}`);
    }
  }

  if (Array.isArray(plan.timeline) && plan.timeline.length > 0) {
    const phases = plan.timeline
      .map((p: unknown) =>
        typeof p === "string" ? p : (p as { phase?: string })?.phase
      )
      .filter(Boolean);
    if (phases.length > 0) {
      parts.push(`Phasen: ${phases.join(", ")}`);
    }
  }

  return parts.join(". ") + ".";
}
