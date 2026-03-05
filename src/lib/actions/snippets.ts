"use server";

import { db } from "@/lib/db";
import { lessonSnippets, snippetClassFavorites } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

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
  filters?: { tag?: string; classGroupId?: string }
) {
  if (filters?.classGroupId) {
    const rows = await db
      .select({ snippet: lessonSnippets })
      .from(lessonSnippets)
      .innerJoin(
        snippetClassFavorites,
        and(
          eq(snippetClassFavorites.snippetId, lessonSnippets.id),
          eq(snippetClassFavorites.classGroupId, filters.classGroupId)
        )
      )
      .where(eq(lessonSnippets.teacherId, teacherId))
      .orderBy(desc(snippetClassFavorites.createdAt));

    const snippets = rows.map((r) => r.snippet);

    if (filters.tag) {
      const tag = filters.tag;
      return snippets.filter((s) => (s.tags as string[]).includes(tag));
    }

    return snippets;
  }

  const rows = await db
    .select()
    .from(lessonSnippets)
    .where(eq(lessonSnippets.teacherId, teacherId))
    .orderBy(desc(lessonSnippets.createdAt));

  if (filters?.tag) {
    const tag = filters.tag;
    return rows.filter((row) => (row.tags as string[]).includes(tag));
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

export async function addClassFavorite(
  snippetId: string,
  classGroupId: string
) {
  await db
    .insert(snippetClassFavorites)
    .values({ snippetId, classGroupId })
    .onConflictDoNothing();
}

export async function removeClassFavorite(
  snippetId: string,
  classGroupId: string
) {
  await db
    .delete(snippetClassFavorites)
    .where(
      and(
        eq(snippetClassFavorites.snippetId, snippetId),
        eq(snippetClassFavorites.classGroupId, classGroupId)
      )
    );
}

export async function getClassFavorites(classGroupId: string) {
  const rows = await db
    .select({ snippet: lessonSnippets })
    .from(lessonSnippets)
    .innerJoin(
      snippetClassFavorites,
      eq(snippetClassFavorites.snippetId, lessonSnippets.id)
    )
    .where(eq(snippetClassFavorites.classGroupId, classGroupId))
    .orderBy(desc(snippetClassFavorites.createdAt));

  return rows.map((r) => r.snippet);
}

export async function getSnippetFavoriteClasses(snippetId: string) {
  const rows = await db
    .select({ classGroupId: snippetClassFavorites.classGroupId })
    .from(snippetClassFavorites)
    .where(eq(snippetClassFavorites.snippetId, snippetId));

  return rows.map((r) => r.classGroupId);
}
