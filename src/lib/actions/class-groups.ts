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

export async function createClassGroup(formData: FormData) {
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
    })
    .returning();

  revalidatePath("/classes");
  redirect(`/classes/${created.id}`);
}

export async function archiveClassGroup(id: string) {
  await db
    .update(classGroups)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(classGroups.id, id));

  revalidatePath("/classes");
}
