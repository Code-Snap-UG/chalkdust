"use server";

import { db } from "@/lib/db";
import { lessonSnippets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type CreateSnippetInput = {
  title: string;
  phase: string;
  durationMinutes?: number;
  description: string;
  method?: string;
  tags?: string[];
  notes?: string;
  sourceLessonPlanId?: string;
};

export async function createSnippet(
  teacherId: string,
  data: CreateSnippetInput
) {
  const [created] = await db
    .insert(lessonSnippets)
    .values({
      teacherId,
      title: data.title,
      phase: data.phase,
      durationMinutes: data.durationMinutes ?? null,
      description: data.description,
      method: data.method ?? null,
      tags: data.tags ?? [],
      notes: data.notes ?? null,
      sourceLessonPlanId: data.sourceLessonPlanId ?? null,
    })
    .returning();

  return created;
}

export async function getSnippets(
  teacherId: string,
  filters?: { tag?: string }
) {
  const rows = await db
    .select()
    .from(lessonSnippets)
    .where(eq(lessonSnippets.teacherId, teacherId))
    .orderBy(desc(lessonSnippets.createdAt));

  if (filters?.tag) {
    const tag = filters.tag;
    return rows.filter((row) =>
      (row.tags as string[]).includes(tag)
    );
  }

  return rows;
}

export async function getSnippet(id: string) {
  const rows = await db
    .select()
    .from(lessonSnippets)
    .where(eq(lessonSnippets.id, id))
    .limit(1);
  return rows[0] ?? null;
}
