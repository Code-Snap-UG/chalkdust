"use server";

import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentTeacherId } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function getClassGroups(status: string = "active") {
  const teacherId = await getCurrentTeacherId();
  return db
    .select()
    .from(classGroups)
    .where(and(eq(classGroups.teacherId, teacherId), eq(classGroups.status, status)))
    .orderBy(desc(classGroups.createdAt));
}

export async function getClassGroup(id: string) {
  const rows = await db
    .select()
    .from(classGroups)
    .where(eq(classGroups.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createClassGroup(
  formData: FormData,
  predecessorId?: string
) {
  const name = formData.get("name") as string;
  const grade = formData.get("grade") as string;
  const subject = formData.get("subject") as string;
  const schoolYear = formData.get("schoolYear") as string;

  let created;
  try {
    const teacherId = await getCurrentTeacherId();

    [created] = await db
      .insert(classGroups)
      .values({
        teacherId,
        name,
        grade,
        subject,
        schoolYear,
        predecessorId: predecessorId ?? undefined,
      })
      .returning();
  } catch (error) {
    log.error("action.class-groups.create", {
      input: { name, grade, subject, schoolYear, predecessorId },
      error,
    });
    throw error;
  }

  revalidatePath("/classes");
  redirect(`/classes/${created.id}`);
}

export async function saveTransitionSummary(
  classGroupId: string,
  data: {
    summary: string;
    strengths: string;
    weaknesses: string;
  }
) {
  await db
    .update(classGroups)
    .set({
      transitionSummary: data.summary,
      transitionStrengths: data.strengths,
      transitionWeaknesses: data.weaknesses,
      updatedAt: new Date(),
    })
    .where(eq(classGroups.id, classGroupId));

  revalidatePath(`/classes/${classGroupId}`);
  revalidatePath("/classes");
}

export async function archiveClassGroup(id: string) {
  try {
    const [classGroup] = await db
      .select()
      .from(classGroups)
      .where(eq(classGroups.id, id))
      .limit(1);

    if (!classGroup) {
      throw new Error("Klasse nicht gefunden.");
    }

    if (!classGroup.transitionSummary?.trim()) {
      throw new Error(
        "Die Übergangszusammenfassung muss gespeichert sein, bevor die Klasse archiviert werden kann."
      );
    }

    await db
      .update(classGroups)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(classGroups.id, id));

    revalidatePath("/classes");
  } catch (error) {
    log.error("action.class-groups.archive", { input: { id }, error });
    throw error;
  }
}
