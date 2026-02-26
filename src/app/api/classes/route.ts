import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classGroups } from "@/lib/db/schema";
import { saveCurriculum } from "@/lib/actions/curriculum";

const HARDCODED_TEACHER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade, subject, schoolYear, curriculum } = body;

    if (!name || !grade || !subject || !schoolYear) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich." },
        { status: 400 }
      );
    }

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
