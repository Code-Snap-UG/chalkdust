"use server";

import { db } from "@/lib/db";
import { lessonPlans, classGroups, diaryEntries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentTeacherId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { LessonPlanOutput } from "@/lib/ai/schemas";

export async function saveLessonPlan(
  classGroupId: string,
  plan: LessonPlanOutput,
  lessonDate?: string,
  durationMinutes?: number
) {
  const [created] = await db
    .insert(lessonPlans)
    .values({
      classGroupId,
      lessonDate: lessonDate || null,
      durationMinutes: durationMinutes || 45,
      status: "draft",
      topic: plan.topic,
      objectives: plan.objectives,
      timeline: plan.timeline,
      differentiation: plan.differentiation,
      materials: plan.materials,
      homework: plan.homework || null,
    })
    .returning();

  revalidatePath(`/classes/${classGroupId}`);
  return created;
}

export async function updateLessonPlan(
  id: string,
  updates: Partial<{
    topic: string;
    objectives: LessonPlanOutput["objectives"];
    timeline: LessonPlanOutput["timeline"];
    differentiation: LessonPlanOutput["differentiation"];
    materials: LessonPlanOutput["materials"];
    homework: string;
    status: string;
  }>
) {
  const [updated] = await db
    .update(lessonPlans)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(lessonPlans.id, id))
    .returning();

  return updated;
}

export async function approveLessonPlan(id: string) {
  const [plan] = await db
    .update(lessonPlans)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(lessonPlans.id, id))
    .returning();

  if (plan) {
    const summary = `Thema: ${plan.topic}. ${
      Array.isArray(plan.timeline)
        ? (plan.timeline as { phase: string; description: string }[])
            .map((p) => `${p.phase}: ${p.description}`)
            .join(". ")
        : ""
    }`;

    await db.insert(diaryEntries).values({
      classGroupId: plan.classGroupId,
      lessonPlanId: plan.id,
      entryDate: plan.lessonDate || new Date().toISOString().split("T")[0],
      plannedSummary: summary,
      progressStatus: "planned",
    });
  }

  revalidatePath(`/classes/${plan?.classGroupId}`);
  return plan;
}

export async function createBlankLessonPlan(
  classGroupId: string,
  topic: string,
  lessonDate?: string,
  durationMinutes?: number
) {
  const [created] = await db
    .insert(lessonPlans)
    .values({
      classGroupId,
      topic,
      lessonDate: lessonDate || null,
      durationMinutes: durationMinutes || 45,
      status: "draft",
      objectives: [],
      timeline: [],
      differentiation: { weaker: "", stronger: "" },
      materials: [],
      homework: null,
    })
    .returning();

  revalidatePath(`/classes/${classGroupId}`);
  return created;
}

export async function getLessonPlan(id: string) {
  const rows = await db
    .select()
    .from(lessonPlans)
    .where(eq(lessonPlans.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLessonPlans(classGroupId?: string) {
  if (classGroupId) {
    return db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.classGroupId, classGroupId))
      .orderBy(desc(lessonPlans.createdAt));
  }

  const teacherId = await getCurrentTeacherId();
  return db
    .select({ lessonPlans })
    .from(lessonPlans)
    .innerJoin(classGroups, eq(lessonPlans.classGroupId, classGroups.id))
    .where(eq(classGroups.teacherId, teacherId))
    .orderBy(desc(lessonPlans.createdAt))
    .then((rows) => rows.map((r) => r.lessonPlans));
}
