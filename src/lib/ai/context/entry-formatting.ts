import { diaryEntries, lessonPlans } from "@/lib/db/schema";
import { buildPlanSummary } from "./plan-summary";
import { isVagueSummary } from "./vagueness";

const STATUS_LABELS: Record<string, string> = {
  completed: "Abgeschlossen",
  partial: "Teilweise",
  deviated: "Abgewichen",
  planned: "Geplant",
};

type DiaryRow = typeof diaryEntries.$inferSelect;
type PlanRow = typeof lessonPlans.$inferSelect;

export function formatTaughtEntry(d: DiaryRow, plan: PlanRow | null): string {
  const label = STATUS_LABELS[d.progressStatus] || d.progressStatus;
  const notes = d.teacherNotes ? ` – Notiz: ${d.teacherNotes}` : "";

  if (d.progressStatus === "deviated") {
    const planRef = plan ? `Geplant: ${plan.topic}. ` : "";
    const actual = d.actualSummary || "Keine Angabe zur Abweichung";
    return `- ${d.entryDate}: [${label}] ${planRef}Tatsächlich: ${actual}${notes}`;
  }

  if (d.progressStatus === "partial") {
    const base = plan
      ? buildPlanSummary(plan)
      : d.plannedSummary || "Kein Eintrag";
    const actual = !isVagueSummary(d.actualSummary)
      ? ` Tatsächlich: ${d.actualSummary}`
      : "";
    return `- ${d.entryDate}: [${label}] ${base}${actual}${notes}`;
  }

  // completed (or any other taught status)
  if (!isVagueSummary(d.actualSummary)) {
    return `- ${d.entryDate}: [${label}] ${d.actualSummary}${notes}`;
  }

  if (plan) {
    return `- ${d.entryDate}: [${label}] Durchgeführt wie geplant: ${buildPlanSummary(plan)}${notes}`;
  }

  return `- ${d.entryDate}: [${label}] ${d.plannedSummary || "Kein Eintrag"}${notes}`;
}

export function formatPlannedEntry(d: DiaryRow, plan: PlanRow | null): string {
  const summary = plan
    ? buildPlanSummary(plan)
    : d.plannedSummary || "Kein Eintrag";
  return `- ${d.entryDate}: [Geplant] ${summary}`;
}
