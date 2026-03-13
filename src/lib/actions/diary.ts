"use server";

import { db } from "@/lib/db";
import {
  diaryEntries,
  materials,
  lessonPlans,
  seriesMilestones,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { log } from "@/lib/logger";

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
  try {
    const [updated] = await db
      .update(diaryEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(diaryEntries.id, id))
      .returning();

    if (updated) {
      revalidatePath(`/classes/${updated.classGroupId}`);

      if (updates.progressStatus) {
        await syncMilestoneStatus(updated.lessonPlanId);
      }
    }
    return updated;
  } catch (error) {
    log.error("action.diary.update", { input: { id, updates }, error });
    throw error;
  }
}

async function syncMilestoneStatus(lessonPlanId: string | null) {
  if (!lessonPlanId) return;

  const [plan] = await db
    .select({ milestoneId: lessonPlans.milestoneId })
    .from(lessonPlans)
    .where(eq(lessonPlans.id, lessonPlanId))
    .limit(1);

  if (!plan?.milestoneId) return;

  const milestonePlans = await db
    .select({
      planId: lessonPlans.id,
      diaryStatus: diaryEntries.progressStatus,
    })
    .from(lessonPlans)
    .leftJoin(diaryEntries, eq(diaryEntries.lessonPlanId, lessonPlans.id))
    .where(eq(lessonPlans.milestoneId, plan.milestoneId));

  const taughtStatuses = ["completed", "partial", "deviated"];

  const allTaught =
    milestonePlans.length > 0 &&
    milestonePlans.every(
      (p) => p.diaryStatus && taughtStatuses.includes(p.diaryStatus)
    );

  const anyTaught = milestonePlans.some(
    (p) => p.diaryStatus && taughtStatuses.includes(p.diaryStatus)
  );

  const newStatus = allTaught
    ? "completed"
    : anyTaught
      ? "in_progress"
      : "pending";

  await db
    .update(seriesMilestones)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(seriesMilestones.id, plan.milestoneId));
}

export async function getDiaryEntryMaterials(diaryEntryId: string) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.diaryEntryId, diaryEntryId));
}
