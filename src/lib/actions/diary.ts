"use server";

import { db } from "@/lib/db";
import { diaryEntries, materials } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDiaryEntries(classGroupId: string) {
  return db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.classGroupId, classGroupId))
    .orderBy(desc(diaryEntries.entryDate));
}

export async function getDiaryEntry(id: string) {
  const rows = await db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateDiaryEntry(
  id: string,
  updates: {
    actualSummary?: string;
    teacherNotes?: string;
    progressStatus?: string;
  }
) {
  const [updated] = await db
    .update(diaryEntries)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(diaryEntries.id, id))
    .returning();

  if (updated) {
    revalidatePath(`/classes/${updated.classGroupId}`);
  }
  return updated;
}

export async function getDiaryEntryMaterials(diaryEntryId: string) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.diaryEntryId, diaryEntryId));
}
