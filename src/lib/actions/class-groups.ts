"use server";

import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

export async function getClassGroups(status: string = "active") {
  return db
    .select()
    .from(classGroups)
    .where(eq(classGroups.status, status))
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

  const [created] = await db
    .insert(classGroups)
    .values({
      teacherId: HARDCODED_TEACHER_ID,
      name,
      grade,
      subject,
      schoolYear,
      predecessorId: predecessorId ?? undefined,
    })
    .returning();

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
}
