import { db } from "@/lib/db";
import {
  lessonPlans,
  lessonSeries,
  seriesMilestones,
  milestoneLessonSlots,
  diaryEntries,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { buildPlanSummary } from "./plan-summary";
import { isVagueSummary } from "./vagueness";

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

export async function buildSeriesContext(
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

      const milestoneSlots = slotsByMilestoneId.get(currentMilestoneId) ?? [];
      const currentSlot = milestoneSlots.find((s) => s.position === position);

      lines.push(``);
      lines.push(`### Aktuelle Stunde:`);
      lines.push(`Meilenstein: ${current.title}`);

      if (currentSlot) {
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
        lines.push(buildProgressionBlock(position, total, milestoneGoals));
      }

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
