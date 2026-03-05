import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { saveCurriculum } from "@/lib/actions/curriculum";
import { getCurrentTeacherId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "active";

    const teacherId = await getCurrentTeacherId();
    const rows = await db
      .select()
      .from(classGroups)
      .where(and(eq(classGroups.teacherId, teacherId), eq(classGroups.status, status)))
      .orderBy(desc(classGroups.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Klassen." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade, subject, schoolYear, predecessorId, curriculum } =
      body;

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
  } catch (error) {
    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Klasse." },
      { status: 500 }
    );
  }
}
