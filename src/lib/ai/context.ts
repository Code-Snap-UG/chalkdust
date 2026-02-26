import { db } from "@/lib/db";
import {
  curricula,
  curriculumTopics,
  diaryEntries,
  classGroups,
  lessonPlans,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Vagueness detection
// ---------------------------------------------------------------------------

const VAGUE_PATTERNS = [
  /^wie geplant$/i,
  /^alles wie geplant/i,
  /^alles erledigt$/i,
  /^s\.?\s*o\.?$/i,
  /^siehe plan/i,
  /^nichts besonderes$/i,
  /^wie besprochen$/i,
  /^erledigt$/i,
  /^ok$/i,
  /^passt$/i,
  /^gut gelaufen$/i,
  /^lief gut$/i,
  /^wie vorbereitet$/i,
  /^durchgeführt$/i,
  /^gemacht$/i,
];

/**
 * Detect whether an actualSummary is too vague to be useful as AI context.
 * Returns true for null/empty values, very short strings (< 30 chars), or
 * strings matching known low-information patterns.
 */
export function isVagueSummary(text: string | null): boolean {
  if (!text || !text.trim()) return true;
  const trimmed = text.trim();
  if (trimmed.length < 30) return true;
  return VAGUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// ---------------------------------------------------------------------------
// Lesson plan summary builder
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Entry formatting
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  completed: "Abgeschlossen",
  partial: "Teilweise",
  deviated: "Abgewichen",
  planned: "Geplant",
};

type DiaryRow = typeof diaryEntries.$inferSelect;
type PlanRow = typeof lessonPlans.$inferSelect;

function formatTaughtEntry(d: DiaryRow, plan: PlanRow | null): string {
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

function formatPlannedEntry(d: DiaryRow, plan: PlanRow | null): string {
  const summary = plan
    ? buildPlanSummary(plan)
    : d.plannedSummary || "Kein Eintrag";
  return `- ${d.entryDate}: [Geplant] ${summary}`;
}

// ---------------------------------------------------------------------------
// Context assembly
// ---------------------------------------------------------------------------

export async function assembleContext(
  classGroupId: string,
  selectedTopicId?: string
) {
  const parts: string[] = [];

  // Curriculum excerpt
  const [curriculum] = await db
    .select()
    .from(curricula)
    .where(eq(curricula.classGroupId, classGroupId))
    .limit(1);

  if (curriculum) {
    const topics = await db
      .select()
      .from(curriculumTopics)
      .where(eq(curriculumTopics.curriculumId, curriculum.id))
      .orderBy(curriculumTopics.sortOrder);

    if (selectedTopicId) {
      const idx = topics.findIndex((t) => t.id === selectedTopicId);
      const start = Math.max(0, idx - 1);
      const end = Math.min(topics.length, idx + 2);
      const relevantTopics = topics.slice(start, end);

      parts.push(
        `## Kerncurriculum (relevanter Ausschnitt)\n\n${relevantTopics
          .map(
            (t) =>
              `- **${t.title}**: ${t.description || "Keine Beschreibung"} (Kompetenzbereich: ${t.competencyArea || "Allgemein"})`
          )
          .join("\n")}`
      );
    } else if (topics.length > 0) {
      parts.push(
        `## Kerncurriculum (Themenübersicht)\n\n${topics
          .map(
            (t) =>
              `- **${t.title}**: ${t.description || "Keine Beschreibung"}`
          )
          .join("\n")}`
      );
    }
  }

  // Diary entries with linked lesson plans (LEFT JOIN)
  const recentDiary = await db
    .select({
      diary: diaryEntries,
      plan: lessonPlans,
    })
    .from(diaryEntries)
    .leftJoin(lessonPlans, eq(diaryEntries.lessonPlanId, lessonPlans.id))
    .where(eq(diaryEntries.classGroupId, classGroupId))
    .orderBy(desc(diaryEntries.entryDate))
    .limit(15);

  const taught = recentDiary.filter(
    (r) => r.diary.progressStatus !== "planned"
  );
  const planned = recentDiary.filter(
    (r) => r.diary.progressStatus === "planned"
  );

  if (taught.length > 0) {
    parts.push(
      `## Letzte Stunden (Klassentagebuch)\n\n${taught
        .slice(0, 10)
        .map((r) => formatTaughtEntry(r.diary, r.plan))
        .join("\n")}`
    );
  }

  if (planned.length > 0) {
    parts.push(
      `## Geplante Stunden (noch nicht durchgeführt)\n\n${planned
        .slice(0, 3)
        .map((r) => formatPlannedEntry(r.diary, r.plan))
        .join("\n")}`
    );
  }

  // Predecessor transition summary
  const [classGroup] = await db
    .select()
    .from(classGroups)
    .where(eq(classGroups.id, classGroupId))
    .limit(1);

  if (classGroup?.predecessorId) {
    const [predecessor] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, classGroup.predecessorId))
      .limit(1);

    if (predecessor?.transitionStrengths || predecessor?.transitionWeaknesses) {
      parts.push(
        `## Vorjahr – Übergangsinformationen\n\n` +
          (predecessor.transitionStrengths
            ? `**Stärken:** ${predecessor.transitionStrengths}\n`
            : "") +
          (predecessor.transitionWeaknesses
            ? `**Schwächen:** ${predecessor.transitionWeaknesses}\n`
            : "") +
          (predecessor.transitionSummary
            ? `**Zusammenfassung:** ${predecessor.transitionSummary}`
            : "")
      );
    }
  }

  return parts.join("\n\n---\n\n");
}
