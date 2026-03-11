import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import { getModel } from "@/lib/ai";
import {
  curriculumTopicExtractionSchema,
  type CurriculumTopicExtraction,
} from "@/lib/ai/schemas";
import { curriculumExtractionPrompt } from "@/lib/ai/prompts/curriculum-extraction";
import { tracedGenerateObject } from "@/lib/ai/trace";
import { getCurrentTeacherId } from "@/lib/auth";
import { withLogging } from "@/lib/logger";

export const POST = withLogging("api.curriculum.upload", async (request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Eine PDF-Datei ist erforderlich." },
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
    "curricula",
    fileName
  );
  await writeFile(filePath, buffer);

  const pdf = new PDFParse({ data: buffer });
  const pdfData = await pdf.getText();
  const parsedText = pdfData.text;

  if (!parsedText || parsedText.trim().length < 50) {
    return NextResponse.json(
      { error: "Die PDF-Datei enthält zu wenig Text." },
      { status: 400 }
    );
  }

  const truncatedText = parsedText.slice(0, 30000);
  const userPrompt = `Hier ist der Text des Kerncurriculums:\n\n${truncatedText}`;

  const teacherId = await getCurrentTeacherId();

  const { object } = await tracedGenerateObject<CurriculumTopicExtraction>(
    {
      model: getModel("fast"),
      schema: curriculumTopicExtractionSchema,
      system: curriculumExtractionPrompt,
      prompt: userPrompt,
    },
    {
      agentMode: "curriculum_extraction",
      teacherId,
      inputParams: { fileName: file.name, textLength: truncatedText.length },
    },
  );

  return NextResponse.json({
    fileName: file.name,
    storedFileName: fileName,
    parsedContent: parsedText,
    topics: object.topics,
  });
}, "Fehler beim Verarbeiten der Datei.");
