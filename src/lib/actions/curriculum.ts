"use server";

import { db } from "@/lib/db";
import { curricula, curriculumTopics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { log } from "@/lib/logger";

export async function saveCurriculum(
  classGroupId: string,
  data: {
    subject: string;
    grade: string;
    sourceFileName: string;
    parsedContent: string;
    topics: {
      title: string;
      description: string;
      competencyArea: string;
    }[];
  }
) {
  try {
    const [curriculum] = await db
      .insert(curricula)
      .values({
        classGroupId,
        subject: data.subject,
        grade: data.grade,
        sourceFileName: data.sourceFileName,
        parsedContent: data.parsedContent,
        topicIndex: data.topics,
      })
      .onConflictDoUpdate({
        target: curricula.classGroupId,
        set: {
          subject: data.subject,
          grade: data.grade,
          sourceFileName: data.sourceFileName,
          parsedContent: data.parsedContent,
          topicIndex: data.topics,
        },
      })
      .returning();

    await db
      .delete(curriculumTopics)
      .where(eq(curriculumTopics.curriculumId, curriculum.id));

    if (data.topics.length > 0) {
      await db.insert(curriculumTopics).values(
        data.topics.map((topic, index) => ({
          curriculumId: curriculum.id,
          title: topic.title,
          description: topic.description,
          competencyArea: topic.competencyArea,
          sortOrder: index,
        }))
      );
    }

    revalidatePath(`/classes/${classGroupId}`);
    return curriculum;
  } catch (error) {
    log.error("action.curriculum.save", {
      input: { classGroupId, subject: data.subject, topicCount: data.topics.length },
      error,
    });
    throw error;
  }
}

export async function getCurriculum(classGroupId: string) {
  const rows = await db
    .select()
    .from(curricula)
    .where(eq(curricula.classGroupId, classGroupId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCurriculumTopics(classGroupId: string) {
  const curriculum = await getCurriculum(classGroupId);
  if (!curriculum) return [];

  return db
    .select()
    .from(curriculumTopics)
    .where(eq(curriculumTopics.curriculumId, curriculum.id))
    .orderBy(curriculumTopics.sortOrder);
}

export async function updateCurriculumTopics(
  classGroupId: string,
  topics: { title: string; description: string; competencyArea: string }[]
) {
  const existing = await getCurriculum(classGroupId);

  return saveCurriculum(classGroupId, {
    subject: existing?.subject ?? "",
    grade: existing?.grade ?? "",
    sourceFileName: existing?.sourceFileName ?? "",
    parsedContent: existing?.parsedContent ?? "",
    topics,
  });
}
