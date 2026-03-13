"use server";

import { db } from "@/lib/db";
import {
  lessonSeries,
  seriesMilestones,
  seriesCurriculumTopics,
  lessonPlans,
  diaryEntries,
} from "@/lib/db/schema";
import { eq, asc, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MilestoneInput = {
  title: string;
  description?: string;
  learningGoals: { text: string }[];
  estimatedLessons: number;
};

// ---------------------------------------------------------------------------
// Series CRUD
// ---------------------------------------------------------------------------

export async function createSeries(
  classGroupId: string,
  data: {
    title: string;
    description?: string;
    estimatedLessons: number;
    estimatedWeeks?: number;
    startDate?: string;
    milestones?: MilestoneInput[];
    curriculumTopicIds?: string[];
  }
) {
  const [series] = await db
    .insert(lessonSeries)
    .values({
      classGroupId,
      title: data.title,
      description: data.description || null,
      estimatedLessons: data.estimatedLessons,
      estimatedWeeks: data.estimatedWeeks || null,
      startDate: data.startDate || null,
      status: data.milestones?.length ? "active" : "draft",
    })
    .returning();

  if (data.milestones?.length) {
    await db.insert(seriesMilestones).values(
      data.milestones.map((m, i) => ({
        seriesId: series.id,
        title: m.title,
        description: m.description || null,
        learningGoals: m.learningGoals,
        estimatedLessons: m.estimatedLessons,
        sortOrder: i,
      }))
    );
  }

  if (data.curriculumTopicIds?.length) {
    await db.insert(seriesCurriculumTopics).values(
      data.curriculumTopicIds.map((topicId) => ({
        seriesId: series.id,
        curriculumTopicId: topicId,
      }))
    );
  }

  revalidatePath(`/classes/${classGroupId}`);
  return series;
}

export async function getSeries(seriesId: string) {
  const rows = await db
    .select()
    .from(lessonSeries)
    .where(eq(lessonSeries.id, seriesId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSeriesWithDetails(seriesId: string) {
  const series = await getSeries(seriesId);
  if (!series) return null;

  const [milestones, plans, topicLinks] = await Promise.all([
    db
      .select()
      .from(seriesMilestones)
      .where(eq(seriesMilestones.seriesId, seriesId))
      .orderBy(asc(seriesMilestones.sortOrder)),
    db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.seriesId, seriesId))
      .orderBy(asc(lessonPlans.lessonDate)),
    db
      .select()
      .from(seriesCurriculumTopics)
      .where(eq(seriesCurriculumTopics.seriesId, seriesId)),
  ]);

  const planIds = plans.filter((p) => p.id).map((p) => p.id);
  const diaries = planIds.length
    ? await db
        .select()
        .from(diaryEntries)
        .where(inArray(diaryEntries.lessonPlanId, planIds))
    : [];

  const diaryByPlanId = new Map(
    diaries.map((d) => [d.lessonPlanId, d])
  );

  const milestonesWithPlans = milestones.map((m) => {
    const milestonePlans = plans.filter((p) => p.milestoneId === m.id);
    return {
      ...m,
      lessonPlans: milestonePlans.map((p) => ({
        ...p,
        diaryEntry: diaryByPlanId.get(p.id) ?? null,
      })),
    };
  });

  const unlinkedPlans = plans
    .filter((p) => !p.milestoneId)
    .map((p) => ({
      ...p,
      diaryEntry: diaryByPlanId.get(p.id) ?? null,
    }));

  return {
    ...series,
    milestones: milestonesWithPlans,
    unlinkedPlans,
    curriculumTopicIds: topicLinks.map((l) => l.curriculumTopicId),
  };
}

export async function getSeriesForClass(classGroupId: string) {
  return db
    .select()
    .from(lessonSeries)
    .where(eq(lessonSeries.classGroupId, classGroupId))
    .orderBy(desc(lessonSeries.createdAt));
}

export async function updateSeries(
  seriesId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    estimatedLessons: number;
    estimatedWeeks: number | null;
    startDate: string | null;
    status: string;
  }>
) {
  const [updated] = await db
    .update(lessonSeries)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(lessonSeries.id, seriesId))
    .returning();
  return updated;
}

export async function deleteSeries(seriesId: string) {
  const series = await getSeries(seriesId);
  if (!series) return;

  await db.update(lessonPlans)
    .set({ seriesId: null, milestoneId: null })
    .where(eq(lessonPlans.seriesId, seriesId));

  await db.delete(lessonSeries).where(eq(lessonSeries.id, seriesId));

  revalidatePath(`/classes/${series.classGroupId}`);
}

// ---------------------------------------------------------------------------
// Milestone CRUD
// ---------------------------------------------------------------------------

export async function addMilestone(
  seriesId: string,
  data: MilestoneInput,
  insertAfterOrder?: number
) {
  const existing = await db
    .select({ sortOrder: seriesMilestones.sortOrder })
    .from(seriesMilestones)
    .where(eq(seriesMilestones.seriesId, seriesId))
    .orderBy(desc(seriesMilestones.sortOrder))
    .limit(1);

  const newOrder =
    insertAfterOrder != null
      ? insertAfterOrder + 1
      : (existing[0]?.sortOrder ?? -1) + 1;

  if (insertAfterOrder != null) {
    const toShift = await db
      .select()
      .from(seriesMilestones)
      .where(
        and(
          eq(seriesMilestones.seriesId, seriesId)
        )
      );

    for (const m of toShift) {
      if (m.sortOrder >= newOrder) {
        await db
          .update(seriesMilestones)
          .set({ sortOrder: m.sortOrder + 1 })
          .where(eq(seriesMilestones.id, m.id));
      }
    }
  }

  const [milestone] = await db
    .insert(seriesMilestones)
    .values({
      seriesId,
      title: data.title,
      description: data.description || null,
      learningGoals: data.learningGoals,
      estimatedLessons: data.estimatedLessons,
      sortOrder: newOrder,
    })
    .returning();

  return milestone;
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    learningGoals: { text: string }[];
    estimatedLessons: number;
    status: string;
  }>
) {
  const [updated] = await db
    .update(seriesMilestones)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(seriesMilestones.id, milestoneId))
    .returning();
  return updated;
}

export async function deleteMilestone(milestoneId: string) {
  await db.update(lessonPlans)
    .set({ milestoneId: null })
    .where(eq(lessonPlans.milestoneId, milestoneId));

  await db
    .delete(seriesMilestones)
    .where(eq(seriesMilestones.id, milestoneId));
}

export async function reorderMilestones(
  seriesId: string,
  orderedIds: string[]
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(seriesMilestones)
      .set({ sortOrder: i })
      .where(
        and(
          eq(seriesMilestones.id, orderedIds[i]),
          eq(seriesMilestones.seriesId, seriesId)
        )
      );
  }
}
