import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import { withLogging } from "@/lib/logger";

export const POST = withLogging("api.materials.upload", async (request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const diaryEntryId = formData.get("diaryEntryId") as string | null;
  const title = formData.get("title") as string | null;

  if (!file || !diaryEntryId) {
    return NextResponse.json(
      { error: "Datei und Tagebucheintrag sind erforderlich." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "materials",
    fileName
  );
  await writeFile(filePath, buffer);

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string> = {
    pdf: "document",
    doc: "document",
    docx: "document",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    xls: "spreadsheet",
    xlsx: "spreadsheet",
  };

  const [material] = await db
    .insert(materials)
    .values({
      diaryEntryId,
      title: title || file.name,
      type: typeMap[ext] || "other",
      source: "uploaded",
      fileUrl: `/uploads/materials/${fileName}`,
    })
    .returning();

  return NextResponse.json(material);
}, "Fehler beim Hochladen.");
