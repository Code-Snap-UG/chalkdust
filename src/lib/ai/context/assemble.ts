import { db } from "@/lib/db";
import {
  curricula,
  curriculumTopics,
  diaryEntries,
  classGroups,
  lessonPlans,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { buildGradeGuidelines } from "./grade-guidelines";
import { buildSeriesContext } from "./series-context";
import { formatTaughtEntry, formatPlannedEntry } from "./entry-formatting";

export async function assembleContext(
  classGroupId: string,
  selectedTopicId?: string,
  seriesId?: string,
  milestoneId?: string
) {
  const sections: string[] = [];

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

  // Grade-level pedagogical guidelines
  if (classGroup?.grade) {
    const gradeGuidelines = buildGradeGuidelines(classGroup.grade);
    if (gradeGuidelines) {
      sections.push(`<lehrerangaben>\n${gradeGuidelines}\n</lehrerangaben>`);
    }
  }

  // Build curriculum section
  if (curriculum && topics.length > 0) {
    let curriculumContent: string;
    if (selectedTopicId) {
      const idx = topics.findIndex((t) => t.id === selectedTopicId);
      const start = Math.max(0, idx - 1);
      const end = Math.min(topics.length, idx + 2);
      const relevantTopics = topics.slice(start, end);

      curriculumContent = `## Lehrplan (relevanter Ausschnitt)\n\n${relevantTopics
        .map(
          (t) =>
            `- **${t.title}**: ${t.description || "Keine Beschreibung"} (Kompetenzbereich: ${t.competencyArea || "Allgemein"})`
        )
        .join("\n")}`;
    } else {
      curriculumContent = `## Lehrplan (Themenübersicht)\n\n${topics
        .map(
          (t) =>
            `- **${t.title}**: ${t.description || "Keine Beschreibung"}`
        )
        .join("\n")}`;
    }
    sections.push(`<lehrplan>\n${curriculumContent}\n</lehrplan>`);
  }

  // Reihe context layer (additive — between curriculum and diary entries)
  if (seriesId) {
    const seriesContext = await buildSeriesContext(seriesId, milestoneId);
    if (seriesContext) {
      sections.push(`<unterrichtsreihe>\n${seriesContext}\n</unterrichtsreihe>`);
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

  const klassenbuchParts: string[] = [];
  if (taught.length > 0) {
    klassenbuchParts.push(
      `## Letzte Stunden\n\n${taught
        .slice(0, 10)
        .map((r) => formatTaughtEntry(r.diary, r.plan))
        .join("\n")}`
    );
  }
  if (planned.length > 0) {
    klassenbuchParts.push(
      `## Geplante Stunden (noch nicht durchgeführt)\n\n${planned
        .slice(0, 3)
        .map((r) => formatPlannedEntry(r.diary, r.plan))
        .join("\n")}`
    );
  }
  if (klassenbuchParts.length > 0) {
    sections.push(
      `<klassenbuch>\n${klassenbuchParts.join("\n\n")}\n</klassenbuch>`
    );
  }

  // Predecessor transition summary
  if (predecessor?.transitionStrengths || predecessor?.transitionWeaknesses) {
    const vorgaengerContent =
      (predecessor.transitionStrengths
        ? `**Stärken:** ${predecessor.transitionStrengths}\n`
        : "") +
      (predecessor.transitionWeaknesses
        ? `**Schwächen:** ${predecessor.transitionWeaknesses}\n`
        : "") +
      (predecessor.transitionSummary
        ? `**Zusammenfassung:** ${predecessor.transitionSummary}`
        : "");
    sections.push(
      `<vorgaenger_klasse>\n${vorgaengerContent}\n</vorgaenger_klasse>`
    );
  }

  return sections.join("\n\n");
}
