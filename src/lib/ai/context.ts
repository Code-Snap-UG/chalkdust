import { db } from "@/lib/db";
import { curricula, curriculumTopics, diaryEntries, classGroups } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

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

  // Recent diary entries
  const recentDiary = await db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.classGroupId, classGroupId))
    .orderBy(desc(diaryEntries.entryDate))
    .limit(10);

  if (recentDiary.length > 0) {
    parts.push(
      `## Letzte Stunden (Klassentagebuch)\n\n${recentDiary
        .map(
          (d) =>
            `- ${d.entryDate}: ${d.actualSummary || d.plannedSummary || "Kein Eintrag"} [Status: ${d.progressStatus}]${d.teacherNotes ? ` – Notiz: ${d.teacherNotes}` : ""}`
        )
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
