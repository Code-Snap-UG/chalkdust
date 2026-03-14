import { db } from "@/lib/db";
import {
  curricula,
  curriculumTopics,
  diaryEntries,
  classGroups,
  lessonPlans,
  lessonSeries,
  seriesMilestones,
  milestoneLessonSlots,
} from "@/lib/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";

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

// ---------------------------------------------------------------------------
// Reihe context builder
// ---------------------------------------------------------------------------

/**
 * Builds a pacing block for the "Aktuelle Stunde" section.
 * Instead of hard-coded role labels, this gives the LLM the raw data it needs
 * to reason about proportional progress: position, total, remaining runway,
 * the milestone's end goals, and a pacing mandate that scales with lesson count.
 */
function buildProgressionBlock(
  position: number,
  total: number,
  milestoneGoals: string[]
): string {
  const remaining = total - position;
  const lessonWord = (n: number) => (n === 1 ? "Stunde" : "Stunden");

  const lines: string[] = [
    `Stunde ${position} von ${total} — noch ${remaining} ${lessonWord(remaining)} nach dieser bis zum Ende dieses Meilensteins.`,
  ];

  if (milestoneGoals.length > 0) {
    lines.push(``);
    lines.push(
      `Ziele des Meilensteins (müssen erst am Ende von Stunde ${total} vollständig erreicht sein):`
    );
    milestoneGoals.forEach((g) => lines.push(`- ${g}`));
  }

  lines.push(``);

  if (total === 1) {
    lines.push(
      `Pacing: Nur eine Stunde für diesen Meilenstein — alle wesentlichen Ziele kompakt und fokussiert behandeln.`
    );
  } else if (total <= 3) {
    lines.push(
      `Pacing: ${total} Stunden — zügige Progression. Pro Stunde ca. ${Math.round(100 / total)}% der Meilensteinziele abdecken. Knappe, fokussierte Schritte ohne Umwege.`
    );
  } else if (total <= 6) {
    lines.push(
      `Pacing: ${total} Stunden — ausgewogene Progression. Pro Stunde ca. ${Math.round(100 / total)}% der Meilensteinziele. Raum für Übung und Differenzierung, aber klarer Vorwärtsdrang.`
    );
  } else {
    lines.push(
      `Pacing: ${total} Stunden — großzügige Progression. Pro Stunde ca. ${Math.round(100 / total)}% der Meilensteinziele. Viel Raum für tiefe Übung, Differenzierung und Fehlerkorrektur. Themen dürfen über mehrere Stunden ausgedehnt werden.`
    );
  }

  lines.push(
    `Wichtig: Decke in DIESER Stunde nicht alle Meilensteinziele ab — plane nur den nächsten proportionalen Schritt.`
  );

  return lines.join("\n");
}

async function buildSeriesContext(
  seriesId: string,
  currentMilestoneId?: string
): Promise<string | null> {
  const [series] = await db
    .select()
    .from(lessonSeries)
    .where(eq(lessonSeries.id, seriesId))
    .limit(1);

  if (!series) return null;

  const milestones = await db
    .select()
    .from(seriesMilestones)
    .where(eq(seriesMilestones.seriesId, seriesId))
    .orderBy(asc(seriesMilestones.sortOrder));

  const seriesPlans = await db
    .select()
    .from(lessonPlans)
    .where(eq(lessonPlans.seriesId, seriesId))
    .orderBy(asc(lessonPlans.lessonDate));

  const planIds = seriesPlans.map((p) => p.id);
  const milestoneIds = milestones.map((m) => m.id);

  const [seriesDiaryRows, allSlots] = await Promise.all([
    planIds.length
      ? db
          .select()
          .from(diaryEntries)
          .where(inArray(diaryEntries.lessonPlanId, planIds))
      : Promise.resolve([]),
    milestoneIds.length
      ? db
          .select()
          .from(milestoneLessonSlots)
          .where(inArray(milestoneLessonSlots.milestoneId, milestoneIds))
          .orderBy(asc(milestoneLessonSlots.position))
      : Promise.resolve([]),
  ]);

  const diaryByPlanId = new Map(
    seriesDiaryRows.map((d) => [d.lessonPlanId, d])
  );

  const slotsByMilestoneId = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    const existing = slotsByMilestoneId.get(slot.milestoneId) ?? [];
    existing.push(slot);
    slotsByMilestoneId.set(slot.milestoneId, existing);
  }

  let completedCount = 0;
  for (const p of seriesPlans) {
    const d = diaryByPlanId.get(p.id);
    if (d && ["completed", "partial", "deviated"].includes(d.progressStatus)) {
      completedCount++;
    }
  }

  const lines: string[] = [
    `## Unterrichtsreihe: ${series.title}`,
    ``,
    `Ziel: ${series.description || "Kein Ziel angegeben"}`,
    `Geplante Stunden: ${series.estimatedLessons} | Bisher durchgeführt: ${completedCount}`,
    ``,
    `### Meilensteine:`,
  ];

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const mPlans = seriesPlans.filter((p) => p.milestoneId === m.id);
    const mDone = mPlans.filter((p) => {
      const d = diaryByPlanId.get(p.id);
      return (
        d && ["completed", "partial", "deviated"].includes(d.progressStatus)
      );
    }).length;
    const allDone =
      mPlans.length > 0 && mDone === mPlans.length && m.status !== "pending";
    const isCurrent =
      m.id === currentMilestoneId || (!allDone && m.status !== "completed");

    const statusLabel =
      allDone || m.status === "completed"
        ? "Abgeschlossen"
        : isCurrent
          ? "Aktuell"
          : "Ausstehend";

    const goals = Array.isArray(m.learningGoals)
      ? (m.learningGoals as { text: string }[])
          .map((g) => g.text)
          .join(", ")
      : "";

    lines.push(
      `${i + 1}. [${statusLabel}] ${m.title} — ${m.description || ""}`
    );
    if (goals) {
      lines.push(`   Ziele: ${goals}`);
    }

    if (mPlans.length > 0) {
      if (m.id === currentMilestoneId) {
        // Rich format: each lesson in the current milestone gets its own line
        // with the actual diary outcome (if taught) or a planning flag (if not).
        lines.push(`   Bisherige Stunden in diesem Meilenstein:`);
        for (const p of mPlans) {
          const d = diaryByPlanId.get(p.id);
          const dateLabel = p.lessonDate || "kein Datum";
          if (!d || d.progressStatus === "planned") {
            const summary = buildPlanSummary(p);
            lines.push(
              `   - ⚠ ${dateLabel}: [Geplant, noch nicht durchgeführt] ${summary}`
            );
          } else if (d.progressStatus === "completed") {
            const summary = !isVagueSummary(d.actualSummary)
              ? d.actualSummary!
              : buildPlanSummary(p);
            lines.push(`   - ${dateLabel}: [Abgeschlossen] ${summary}`);
          } else if (d.progressStatus === "partial") {
            const covered = !isVagueSummary(d.actualSummary)
              ? d.actualSummary!
              : buildPlanSummary(p);
            const note = d.teacherNotes
              ? `Hinweis der Lehrkraft: ${d.teacherNotes}`
              : "Stunde wurde nicht zu Ende geführt.";
            lines.push(
              `   - ${dateLabel}: [Teilweise durchgeführt] ${covered} — NICHT ABGESCHLOSSEN: ${note}`
            );
          } else if (d.progressStatus === "deviated") {
            const planned = buildPlanSummary(p);
            const actual = d.actualSummary || "Keine Angabe";
            const note = d.teacherNotes
              ? ` Hinweis: ${d.teacherNotes}`
              : "";
            lines.push(
              `   - ${dateLabel}: [Abgewichen] Geplant: ${planned} | Tatsächlich: ${actual}${note}`
            );
          }
        }
      } else {
        // Brief one-liner for non-current milestones
        const summaries = mPlans.map((p) => {
          const d = diaryByPlanId.get(p.id);
          const status = d?.progressStatus || p.status;
          const summary = d?.actualSummary || d?.plannedSummary || p.topic;
          return `${p.lessonDate || "kein Datum"}: [${status}] ${summary}`;
        });
        lines.push(`   Bisherige Stunden: ${summaries.join("; ")}`);
      }
    }
  }

  if (currentMilestoneId) {
    const current = milestones.find((m) => m.id === currentMilestoneId);
    if (current) {
      const mPlans = seriesPlans.filter(
        (p) => p.milestoneId === currentMilestoneId
      );
      const position = mPlans.length + 1;
      const total = current.estimatedLessons ?? position;

      const milestoneGoals = Array.isArray(current.learningGoals)
        ? (current.learningGoals as { text: string }[])
            .map((g) => g.text)
            .filter(Boolean)
        : [];

      // Check whether an arc slot exists for this exact position
      const milestoneSlots = slotsByMilestoneId.get(currentMilestoneId) ?? [];
      const currentSlot = milestoneSlots.find((s) => s.position === position);

      lines.push(``);
      lines.push(`### Aktuelle Stunde:`);
      lines.push(`Meilenstein: ${current.title}`);

      if (currentSlot) {
        // Slot-specific context — precise, teacher-reviewed arc
        const allGoals = Array.isArray(current.learningGoals)
          ? (current.learningGoals as { text: string }[]).map((g) => g.text)
          : [];
        const slotGoals = Array.isArray(currentSlot.goalsAddressed)
          ? (currentSlot.goalsAddressed as { text: string }[]).map((g) => g.text)
          : [];
        const remainingGoals = allGoals.filter((g) => !slotGoals.includes(g));

        lines.push(
          `Slot ${position} von ${total}: ${currentSlot.suggestedTopic}`
        );
        if (currentSlot.focusAreas) {
          lines.push(`Schwerpunkt: ${currentSlot.focusAreas}`);
        }
        if (slotGoals.length > 0) {
          lines.push(`Ziele für DIESE Stunde:`);
          slotGoals.forEach((g) => lines.push(`- ${g}`));
        }
        if (remainingGoals.length > 0) {
          lines.push(`Ziele für spätere Stunden (NICHT in dieser Stunde):`);
          remainingGoals.forEach((g) => lines.push(`- ${g}`));
        }
      } else {
        // No arc yet — fall back to the generic progression block
        lines.push(buildProgressionBlock(position, total, milestoneGoals));
      }

      // Build explicit constraint blocks from already-taught lessons in this milestone
      const taughtPlans = mPlans.filter((p) => {
        const d = diaryByPlanId.get(p.id);
        return d && d.progressStatus !== "planned";
      });

      if (taughtPlans.length > 0) {
        const notRepeat: string[] = [];
        const catchUp: string[] = [];
        const adapt: string[] = [];

        for (const p of taughtPlans) {
          const d = diaryByPlanId.get(p.id)!;
          if (d.progressStatus === "completed") {
            const summary = !isVagueSummary(d.actualSummary)
              ? d.actualSummary!
              : buildPlanSummary(p);
            notRepeat.push(summary);
          } else if (d.progressStatus === "partial") {
            const covered = !isVagueSummary(d.actualSummary)
              ? d.actualSummary!
              : buildPlanSummary(p);
            notRepeat.push(`(teilweise) ${covered}`);
            const leftover = d.teacherNotes || "Stunde wurde nicht zu Ende geführt";
            catchUp.push(leftover);
          } else if (d.progressStatus === "deviated") {
            const actual = d.actualSummary || "Stark von der Planung abgewichen";
            adapt.push(actual);
          }
        }

        if (notRepeat.length > 0) {
          lines.push(``);
          lines.push(`NICHT WIEDERHOLEN (bereits behandelt):`);
          notRepeat.forEach((c) => lines.push(`- ${c}`));
        }
        if (catchUp.length > 0) {
          lines.push(``);
          lines.push(`AUFHOLEN (optional — von unvollständigen Vorstunden):`);
          catchUp.forEach((c) => lines.push(`- ${c}`));
        }
        if (adapt.length > 0) {
          lines.push(``);
          lines.push(`ANPASSEN (Vorstunde ist abgewichen — plane entsprechend):`);
          adapt.forEach((c) => lines.push(`- ${c}`));
        }
      }
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Context assembly
// ---------------------------------------------------------------------------

export async function assembleContext(
  classGroupId: string,
  selectedTopicId?: string,
  seriesId?: string,
  milestoneId?: string
) {
  const parts: string[] = [];

  // curriculum, recentDiary, and classGroup are all independent — fetch in parallel
  const [curriculumResult, recentDiary, classGroupResult] = await Promise.all([
    db
      .select()
      .from(curricula)
      .where(eq(curricula.classGroupId, classGroupId))
      .limit(1),
    db
      .select({
        diary: diaryEntries,
        plan: lessonPlans,
      })
      .from(diaryEntries)
      .leftJoin(lessonPlans, eq(diaryEntries.lessonPlanId, lessonPlans.id))
      .where(eq(diaryEntries.classGroupId, classGroupId))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(15),
    db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, classGroupId))
      .limit(1),
  ]);

  const curriculum = curriculumResult[0];
  const classGroup = classGroupResult[0];

  // topics depends on curriculum; predecessor depends on classGroup — fetch in parallel
  const [topics, predecessorResult] = await Promise.all([
    curriculum
      ? db
          .select()
          .from(curriculumTopics)
          .where(eq(curriculumTopics.curriculumId, curriculum.id))
          .orderBy(curriculumTopics.sortOrder)
      : Promise.resolve([]),
    classGroup?.predecessorId
      ? db
          .select()
          .from(classGroups)
          .where(eq(classGroups.id, classGroup.predecessorId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const predecessor = predecessorResult[0];

  // Build curriculum section
  if (curriculum && topics.length > 0) {
    if (selectedTopicId) {
      const idx = topics.findIndex((t) => t.id === selectedTopicId);
      const start = Math.max(0, idx - 1);
      const end = Math.min(topics.length, idx + 2);
      const relevantTopics = topics.slice(start, end);

      parts.push(
        `## Lehrplan (relevanter Ausschnitt)\n\n${relevantTopics
          .map(
            (t) =>
              `- **${t.title}**: ${t.description || "Keine Beschreibung"} (Kompetenzbereich: ${t.competencyArea || "Allgemein"})`
          )
          .join("\n")}`
      );
    } else {
      parts.push(
        `## Lehrplan (Themenübersicht)\n\n${topics
          .map(
            (t) =>
              `- **${t.title}**: ${t.description || "Keine Beschreibung"}`
          )
          .join("\n")}`
      );
    }
  }

  // Reihe context layer (additive — between curriculum and diary entries)
  if (seriesId) {
    const seriesContext = await buildSeriesContext(seriesId, milestoneId);
    if (seriesContext) {
      parts.push(seriesContext);
    }
  }

  // When a series is active, its lessons are already shown in the series context block.
  // Exclude them from the general diary sections to avoid redundancy.
  const diaryForGeneral = seriesId
    ? recentDiary.filter((r) => r.plan?.seriesId !== seriesId)
    : recentDiary;

  // Partition diary entries in a single pass
  const taught: typeof recentDiary = [];
  const planned: typeof recentDiary = [];
  for (const r of diaryForGeneral) {
    if (r.diary.progressStatus === "planned") {
      planned.push(r);
    } else {
      taught.push(r);
    }
  }

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

  return parts.join("\n\n---\n\n");
}
