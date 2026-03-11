import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { saveCurriculum } from "@/lib/actions/curriculum";
import { getCurrentTeacherId } from "@/lib/auth";
import { withLogging } from "@/lib/logger";

export const GET = withLogging("api.classes.get", async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "active";

  const teacherId = await getCurrentTeacherId();
  const rows = await db
    .select()
    .from(classGroups)
    .where(and(eq(classGroups.teacherId, teacherId), eq(classGroups.status, status)))
    .orderBy(desc(classGroups.createdAt));

  return NextResponse.json(rows);
}, "Fehler beim Laden der Klassen.");

export const POST = withLogging("api.classes.post", async (request) => {
  const body = await request.json();
  const { name, grade, subject, schoolYear, predecessorId, curriculum } = body;

  if (!name || !grade || !subject || !schoolYear) {
    return NextResponse.json(
      { error: "Alle Felder sind erforderlich." },
      { status: 400 }
    );
  }

  const teacherId = await getCurrentTeacherId();

  const [created] = await db
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

  if (curriculum && curriculum.topics?.length > 0) {
    await saveCurriculum(created.id, {
      subject: curriculum.subject,
      grade: curriculum.grade,
      sourceFileName: curriculum.sourceFileName,
      parsedContent: curriculum.parsedContent,
      topics: curriculum.topics,
    });
  }

  return NextResponse.json({ id: created.id });
}, "Fehler beim Erstellen der Klasse.");
