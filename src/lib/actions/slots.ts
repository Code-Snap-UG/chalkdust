"use server";

import { db } from "@/lib/db";
import { milestoneLessonSlots } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SlotUpdate = {
  suggestedTopic?: string;
  focusAreas?: string | null;
  goalsAddressed?: { text: string }[];
  notes?: string | null;
  isStale?: boolean;
};

export async function getSlots(milestoneId: string) {
  return db
    .select()
    .from(milestoneLessonSlots)
    .where(eq(milestoneLessonSlots.milestoneId, milestoneId))
    .orderBy(asc(milestoneLessonSlots.position));
}

export async function updateSlot(id: string, updates: SlotUpdate) {
  const [updated] = await db
    .update(milestoneLessonSlots)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(milestoneLessonSlots.id, id))
    .returning();
  return updated;
}

export async function deleteSlots(milestoneId: string) {
  await db
    .delete(milestoneLessonSlots)
    .where(eq(milestoneLessonSlots.milestoneId, milestoneId));
}

export async function insertSlots(
  milestoneId: string,
  slots: {
    position: number;
    suggestedTopic: string;
    focusAreas?: string;
    goalsAddressed: { text: string }[];
  }[]
) {
  if (slots.length === 0) return [];
  return db
    .insert(milestoneLessonSlots)
    .values(
      slots.map((s) => ({
        milestoneId,
        position: s.position,
        suggestedTopic: s.suggestedTopic,
        focusAreas: s.focusAreas ?? null,
        goalsAddressed: s.goalsAddressed,
        isStale: false,
      }))
    )
    .returning();
}

export async function markSlotsStale(milestoneId: string) {
  await db
    .update(milestoneLessonSlots)
    .set({ isStale: true, updatedAt: new Date() })
    .where(eq(milestoneLessonSlots.milestoneId, milestoneId));
}

export async function markSlotsNotStale(milestoneId: string) {
  await db
    .update(milestoneLessonSlots)
    .set({ isStale: false, updatedAt: new Date() })
    .where(eq(milestoneLessonSlots.milestoneId, milestoneId));
  revalidatePath("/");
}
